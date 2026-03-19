import { useState, useCallback, useEffect, useRef } from 'react'

export const REACTION_TYPES = [
  { emoji: '🤯', label: 'Mind Blown' },
  { emoji: '🔥', label: 'Hyped'      },
  { emoji: '😱', label: 'Terrifying' },
  { emoji: '🥱', label: 'Who Cares'  },
]

const EMOJI_TO_TYPE = {
  '🤯': 'mind_blown',
  '🔥': 'overhyped',
  '😱': 'terrifying',
  '🥱': 'who_cares',
}

/**
 * useReactions manages per-story reaction state.
 * Initialises counts from the stories array (API data).
 * Persists user picks in sessionStorage.
 * POSTs to /api/react on each toggle (fire-and-forget).
 */
export function useReactions(stories) {
  const [counts, setCounts] = useState(() => {
    const initial = {}
    stories.forEach(s => { initial[s.id] = { ...s.reactionCounts } })
    return initial
  })

  const [userPicks, setUserPicks] = useState(() => {
    try {
      const stored = sessionStorage.getItem('ai_surge_reactions')
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  // Re-sync counts when stories refresh (new API data)
  const prevIdsRef = useRef(null)
  useEffect(() => {
    const ids = stories.map(s => s.id).join(',')
    if (ids === prevIdsRef.current) return
    prevIdsRef.current = ids
    setCounts(prev => {
      const next = { ...prev }
      stories.forEach(s => {
        // Only overwrite if we don't already have local data for this story
        if (!next[s.id]) next[s.id] = { ...s.reactionCounts }
      })
      return next
    })
  }, [stories])

  const toggleReaction = useCallback((storyId, emoji) => {
    setUserPicks(prev => {
      const current = prev[storyId]
      const next = { ...prev }

      if (current === emoji) {
        delete next[storyId]
        setCounts(c => ({
          ...c,
          [storyId]: { ...c[storyId], [emoji]: Math.max(0, (c[storyId]?.[emoji] || 0) - 1) },
        }))
      } else {
        if (current) {
          setCounts(c => ({
            ...c,
            [storyId]: { ...c[storyId], [current]: Math.max(0, (c[storyId]?.[current] || 0) - 1) },
          }))
        }
        next[storyId] = emoji
        setCounts(c => ({
          ...c,
          [storyId]: { ...c[storyId], [emoji]: (c[storyId]?.[emoji] || 0) + 1 },
        }))
      }

      try { sessionStorage.setItem('ai_surge_reactions', JSON.stringify(next)) } catch {}

      // Fire-and-forget POST to API
      const emoji_type = EMOJI_TO_TYPE[emoji]
      if (emoji_type) {
        fetch('/api/react', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ story_id: storyId, emoji_type }),
        }).catch(() => {})
      }

      return next
    })
  }, [])

  const getCounts  = useCallback((storyId) => counts[storyId] || {}, [counts])
  const getUserPick = useCallback((storyId) => userPicks[storyId] || null, [userPicks])

  return { getCounts, getUserPick, toggleReaction }
}
