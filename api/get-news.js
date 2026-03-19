/**
 * api/get-news.js
 *
 * Returns stories + their reaction counts from Supabase, filtered by period.
 *
 * Usage:
 *   GET /api/get-news?period=24h
 *   GET /api/get-news?period=7d
 *   GET /api/get-news?period=30d
 *
 * Response shape:
 *   {
 *     period: "24h",
 *     count: 10,
 *     stories: [
 *       {
 *         id, headline, summary, url, source, source_type,
 *         trust_score, age, period, related_context, created_at,
 *         reactions: [
 *           { emoji_type: "mind_blown", count: 4 },
 *           ...
 *         ]
 *       }
 *     ]
 *   }
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
)

const VALID_PERIODS = new Set(['24h', '7d', '30d'])

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed — use GET' })
  }

  const period = req.query?.period
  if (!period) {
    return res.status(400).json({ error: 'Missing required query param: period (24h | 7d | 30d)' })
  }
  if (!VALID_PERIODS.has(period)) {
    return res.status(400).json({ error: `Invalid period "${period}". Valid values: 24h, 7d, 30d` })
  }

  // Fetch stories with their nested reaction rows in a single query
  const { data, error } = await supabase
    .from('stories')
    .select(`
      id,
      headline,
      summary,
      url,
      source,
      source_type,
      trust_score,
      age,
      period,
      related_context,
      created_at,
      reactions (
        emoji_type,
        count
      )
    `)
    .eq('period', period)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('get-news Supabase error:', error)
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({
    period,
    count:   data.length,
    stories: data,
  })
}
