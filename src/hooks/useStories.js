import { useState, useEffect, useCallback, useRef } from 'react'

const PERIOD_MAP = { '24h': '24h', '7d': '7d', 'month': '30d' }

const EMOJI_MAP = {
  mind_blown: '🤯',
  overhyped:  '🔥',
  terrifying: '😱',
  who_cares:  '🥱',
}

function normalizeStory(raw) {
  const reactionCounts = {}
  if (Array.isArray(raw.reactions)) {
    raw.reactions.forEach(({ emoji_type, count }) => {
      const emoji = EMOJI_MAP[emoji_type]
      if (emoji) reactionCounts[emoji] = count
    })
  }
  return {
    id:             raw.id,
    type:           raw.source_type,
    headline:       raw.headline,
    summary:        raw.summary,
    url:            raw.url,
    sourceName:     raw.source,
    trustScore:     raw.trust_score,
    publishedAt:    raw.published_at,
    reactionCounts,
  }
}

export function useStories(period) {
  const [stories, setStories]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [lastFetched, setLastFetched]   = useState(null)
  const abortRef                        = useRef(null)

  const fetchStories = useCallback(async (p) => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const apiPeriod = PERIOD_MAP[p] || p
      const res = await fetch(`/api/get-news?period=${apiPeriod}`, {
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setStories((data.stories || []).map(normalizeStory))
      setLastFetched(Date.now())
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message || 'Failed to load stories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStories(period)
    return () => { if (abortRef.current) abortRef.current.abort() }
  }, [period, fetchStories])

  const refetch = useCallback(() => fetchStories(period), [period, fetchStories])

  return { stories, loading, error, lastFetched, refetch }
}
