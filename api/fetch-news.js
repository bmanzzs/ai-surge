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

  return `Today's date is ${today}.

Search the web and find ${storyCount} of the most significant, genuinely newsworthy AI stories from the ${label}. Cover a diverse mix of topics: major model releases, research breakthroughs, industry funding/acquisitions, AI policy and regulation, open-source developments, viral AI moments, and notable community discussions.

Return ONLY a JSON object — no prose, no markdown, no explanation — in exactly this shape:

{
  "stories": [
    {
      "headline": "The real headline from the source, close to verbatim",
      "summary": "2–3 sentences: what happened, why it matters, any notable context",
      "url": "https://...",
      "source": "Publication or community name — e.g. 'The Verge', 'r/LocalLLaMA', 'Nature', 'Latent Space'",
      "source_type": "article",
      "trust_score": 8,
      "age": "3h"
    }
  ]
}

FIELD RULES:

source_type must be one of: article | reddit | youtube | podcast | paper

url — THIS IS THE MOST IMPORTANT FIELD:
  • Must be a REAL, WORKING, DIRECT link to the specific piece of content
  • For articles: link to the specific article page, not the publication homepage
  • For Reddit: link to the specific post (reddit.com/r/subreddit/comments/...), not the subreddit
  • For YouTube videos: link to the specific video (youtube.com/watch?v=...), not the channel
  • For podcasts: link to the specific episode on YouTube or the podcast website, not the show homepage
  • For papers: link to the specific arXiv page (arxiv.org/abs/XXXX.XXXXX) or journal article
  • NEVER use a homepage, channel page, or category page as the URL

trust_score — 1 to 10 integer based on source credibility:
  • 9–10: Nature, Science, Reuters, AP, official lab announcements (Anthropic, OpenAI, Google blog posts)
  • 7–8: The Verge, Ars Technica, MIT Technology Review, Bloomberg, Financial Times, BBC
  • 6–7: TechCrunch, VentureBeat, Wired, well-sourced Reddit posts with links/evidence
  • 4–6: Reddit speculation, single-source exclusives, unverified leaks
  • 1–3: Anonymous sources, rumours with no corroboration

age — format: ${ageFormat}
  Use the actual estimated age of the story relative to today (${today})

source_type = "podcast" rules (STRICT):
  • Only include podcasts from: Dwarkesh Patel, Lex Fridman, No Priors, The Next Wave, or Latent Space
  • Only include an episode if it features a genuinely notable AI guest (a founder, lead researcher, or major figure at a top AI lab) OR covers an exceptionally insightful AI topic
  • Use the YouTube watch URL for the specific episode if available
  • If you cannot find a qualifying podcast episode from the ${label}, do not include any podcasts — never pad with low-quality episodes

Aim for roughly: 40% articles, 20% reddit, 15% youtube, 10% podcast, 15% papers — adjust based on what was actually newsworthy.`
}

// ─── Claude call with pause_turn handling ─────────────────────────────────

async function callClaudeWithWebSearch(prompt) {
  // web_search_20260209 runs server-side — no manual tool execution needed.
  // We only need to handle pause_turn (server hit its 10-iteration cap).
  const tools = [{ type: 'web_search_20260209', name: 'web_search' }]

  let messages = [{ role: 'user', content: prompt }]
  let response
  let continuations = 0
  const MAX_CONTINUATIONS = 5

  while (continuations <= MAX_CONTINUATIONS) {
    response = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 8192,
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

// ─── Handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed — use POST' })
  }

  const requestedPeriod = req.query?.period
  const periodsToRefresh = requestedPeriod
    ? [requestedPeriod]
    : Object.keys(PERIODS)

  const invalid = periodsToRefresh.filter(p => !PERIODS[p])
  if (invalid.length) {
    return res.status(400).json({ error: `Unknown period(s): ${invalid.join(', ')}. Valid: ${Object.keys(PERIODS).join(', ')}` })
  }

  const today = new Date().toISOString().split('T')[0]
  console.log(`fetch-news started — date: ${today}, periods: ${periodsToRefresh.join(', ')}`)

  try {
    // Run periods in parallel — each is an independent Claude + Supabase operation
    const results = await Promise.all(
      periodsToRefresh.map(p => refreshPeriod(p, today))
    )
    return res.status(200).json({ ok: true, date: today, results })
  } catch (err) {
    console.error('fetch-news error:', err)
    return res.status(500).json({ error: err.message })
  }
}
