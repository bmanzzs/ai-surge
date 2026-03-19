/**
 * api/react.js
 *
 * Increments a reaction count for a given story.
 * Uses an atomic Postgres RPC to avoid race conditions.
 *
 * Usage:
 *   POST /api/react
 *   Body: { "story_id": "<uuid>", "emoji_type": "mind_blown" }
 *
 * Valid emoji_type values: mind_blown | overhyped | terrifying | who_cares
 *
 * Response:
 *   { ok: true }
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
)

const VALID_EMOJI_TYPES = new Set(['mind_blown', 'overhyped', 'terrifying', 'who_cares'])
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed — use POST' })
  }

  const { story_id, emoji_type } = req.body ?? {}

  if (!story_id || !emoji_type) {
    return res.status(400).json({ error: 'Missing required fields: story_id, emoji_type' })
  }
  if (!UUID_RE.test(story_id)) {
    return res.status(400).json({ error: 'story_id must be a valid UUID' })
  }
  if (!VALID_EMOJI_TYPES.has(emoji_type)) {
    return res.status(400).json({
      error: `Invalid emoji_type "${emoji_type}". Valid values: ${[...VALID_EMOJI_TYPES].join(', ')}`,
    })
  }

  // Atomic increment via the RPC we created in the DB setup SQL
  const { error } = await supabase.rpc('increment_reaction', {
    p_story_id:   story_id,
    p_emoji_type: emoji_type,
  })

  if (error) {
    console.error('react RPC error:', error)
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ ok: true })
}
