/**
 * api/fetch-news.js
 *
 * Vercel serverless function — fetches the latest AI news via Claude with
 * web search, then writes the results to Supabase.
 *
 * Usage:
 *   POST /api/fetch-news              → refresh all three periods
 *   POST /api/fetch-news?period=24h   → refresh one period only
 *
 * Expected env vars:
 *   ANTHROPIC_API_KEY
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY  (or SUPABASE_SERVICE_ROLE_KEY for write access)
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// ─── Clients ──────────────────────────────────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Use service role key for writes if available; fall back to anon key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY,
)

// ─── Period config ─────────────────────────────────────────────────────────

const PERIODS = {
  '24h': {
    label:       'past 24 hours',
    storyCount:  '8 to 12',
    ageFormat:   'hours only — e.g. "1h", "6h", "20h"',
    dbPeriod:    '24h',
  },
  '7d': {
    label:       'past 7 days',
    storyCount:  '10 to 14',
    ageFormat:   'days — e.g. "1d", "3d", "6d"',
    dbPeriod:    '7d',
  },
  '30d': {
    label:       'past 30 days',
    storyCount:  '12 to 15',
    ageFormat:   'weeks — e.g. "1w", "2w", "3w", "4w"',
    dbPeriod:    '30d',
  },
}

// ─── Prompt builder ────────────────────────────────────────────────────────

function buildPrompt(periodKey, today) {
  const { label, storyCount, ageFormat } = PERIODS[periodKey]

  return `Today is ${today}. Search the web and return ${storyCount} significant AI news stories from the ${label}. Mix of: model releases, research, funding, policy, open-source, viral moments.

Return ONLY valid JSON, no prose:

{"stories":[{"headline":"verbatim headline","summary":"2-3 sentences on what happened and why it matters","url":"https://direct-link-to-story","source":"e.g. The Verge","source_type":"article","trust_score":8,"age":"3h"}]}

RULES:
- source_type: article | reddit | youtube | podcast | paper
- url: direct link to the specific story (not homepage). Reddit: /comments/... YouTube: watch?v=... arXiv: /abs/...
- trust_score 1-10: 9-10=official labs/Reuters/AP, 7-8=Verge/Ars/Bloomberg, 6-7=TechCrunch/Wired, 4-6=Reddit/leaks, 1-3=rumours
- age format: ${ageFormat} (relative to ${today})
- podcast: only Dwarkesh Patel, Lex Fridman, No Priors, The Next Wave, Latent Space — only if notable guest/topic, else omit`
}

// ─── Claude call with pause_turn handling ─────────────────────────────────

async function callClaudeWithWebSearch(prompt) {
  // web_search_20260209 runs server-side — no manual tool execution needed.
  // We only need to handle pause_turn (server hit its iteration cap).
  const tools = [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }]

  let messages = [{ role: 'user', content: prompt }]
  let response
  let continuations = 0
  const MAX_CONTINUATIONS = 2

  while (continuations <= MAX_CONTINUATIONS) {
    response = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 4000,
      tools,
      messages,
    })

    if (response.stop_reason !== 'pause_turn') break

    // Server-side loop hit its iteration cap — re-send to continue.
    // Do NOT add a new user message; the API resumes from the trailing
    // server_tool_use block automatically.
    messages = [
      { role: 'user',      content: messages[0].content },
      { role: 'assistant', content: response.content    },
    ]
    continuations++
  }

  if (continuations > MAX_CONTINUATIONS) {
    throw new Error(`Web search did not complete after ${MAX_CONTINUATIONS} continuations`)
  }

  const textBlock = response.content.find(b => b.type === 'text')
  if (!textBlock) throw new Error('Claude returned no text content')
  return textBlock.text
}

// ─── JSON extraction ──────────────────────────────────────────────────────

function extractJSON(text) {
  // Strip markdown code fences if present
  const stripped = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '')
  // Find the outermost JSON object
  const start = stripped.indexOf('{')
  const end   = stripped.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found in Claude response')
  return JSON.parse(stripped.slice(start, end + 1))
}

// ─── Validate + normalise a story from Claude ─────────────────────────────

const VALID_SOURCE_TYPES = new Set(['article', 'reddit', 'youtube', 'podcast', 'paper'])

function normaliseStory(raw, dbPeriod) {
  if (!raw.headline || !raw.summary || !raw.url || !raw.source || !raw.source_type) {
    throw new Error(`Story missing required fields: ${JSON.stringify(raw)}`)
  }
  if (!VALID_SOURCE_TYPES.has(raw.source_type)) {
    throw new Error(`Invalid source_type "${raw.source_type}"`)
  }
  const trust = Number(raw.trust_score)
  if (!Number.isInteger(trust) || trust < 1 || trust > 10) {
    throw new Error(`Invalid trust_score "${raw.trust_score}"`)
  }

  // Basic URL sanity check
  let parsedUrl
  try { parsedUrl = new URL(raw.url) } catch {
    throw new Error(`Invalid URL "${raw.url}"`)
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error(`Non-HTTP URL "${raw.url}"`)
  }

  return {
    headline:        String(raw.headline).trim(),
    summary:         String(raw.summary).trim(),
    url:             raw.url.trim(),
    source:          String(raw.source).trim(),
    source_type:     raw.source_type,
    trust_score:     trust,
    age:             String(raw.age ?? '?').trim(),
    period:          dbPeriod,
    related_context: null,
  }
}

// ─── Supabase write ───────────────────────────────────────────────────────

async function upsertStories(stories, dbPeriod) {
  // Clear existing stories for this period (cascade deletes their reactions too)
  const { error: deleteError } = await supabase
    .from('stories')
    .delete()
    .eq('period', dbPeriod)

  if (deleteError) throw new Error(`Supabase delete failed: ${deleteError.message}`)

  if (!stories.length) return { inserted: 0 }

  const { error: insertError, data } = await supabase
    .from('stories')
    .insert(stories)
    .select('id')

  if (insertError) throw new Error(`Supabase insert failed: ${insertError.message}`)

  // The seed_reactions trigger auto-inserts reaction rows for each new story.
  return { inserted: data?.length ?? stories.length }
}

// ─── Per-period pipeline ──────────────────────────────────────────────────

async function refreshPeriod(periodKey, today) {
  const { dbPeriod } = PERIODS[periodKey]
  console.log(`[${periodKey}] Fetching news from Claude…`)

  const prompt = buildPrompt(periodKey, today)
  const raw    = await callClaudeWithWebSearch(prompt)

  let parsed
  try {
    parsed = extractJSON(raw)
  } catch (err) {
    throw new Error(`[${periodKey}] JSON parse failed: ${err.message}\n\nRaw text:\n${raw.slice(0, 500)}`)
  }

  if (!Array.isArray(parsed.stories)) {
    throw new Error(`[${periodKey}] Response missing "stories" array`)
  }

  const stories = []
  const skipped = []
  for (const item of parsed.stories) {
    try {
      stories.push(normaliseStory(item, dbPeriod))
    } catch (err) {
      skipped.push({ item, reason: err.message })
    }
  }

  if (skipped.length) {
    console.warn(`[${periodKey}] Skipped ${skipped.length} malformed stories:`, skipped)
  }

  const result = await upsertStories(stories, dbPeriod)
  console.log(`[${periodKey}] Done — inserted ${result.inserted} stories`)
  return { period: periodKey, inserted: result.inserted, skipped: skipped.length }
}

// ─── Timeout wrapper ──────────────────────────────────────────────────────

function withTimeout(promise, ms) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Timed out after ${ms / 1000}s — try again or split into smaller requests`)),
      ms,
    )
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

// ─── Handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed — use POST' })
  }

  const period = req.query?.period
  if (!period) {
    return res.status(400).json({
      error: `period query param is required. Valid values: ${Object.keys(PERIODS).join(', ')}`,
    })
  }
  if (!PERIODS[period]) {
    return res.status(400).json({ error: `Unknown period "${period}". Valid: ${Object.keys(PERIODS).join(', ')}` })
  }

  const today = new Date().toISOString().split('T')[0]
  console.log(`fetch-news started — date: ${today}, period: ${period}`)

  try {
    const result = await withTimeout(refreshPeriod(period, today), 50_000)
    return res.status(200).json({ ok: true, date: today, results: [result] })
  } catch (err) {
    console.error('fetch-news error:', err)
    return res.status(500).json({ error: err.message })
  }
}
