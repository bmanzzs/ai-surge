import { useState, useCallback } from 'react'

export const REACTION_TYPES = [
  { emoji: '🤯', label: 'Mind Blown' },
  { emoji: '🔥', label: 'Hyped'      },
  { emoji: '😱', label: 'Terrifying' },
  { emoji: '🥱', label: 'Who Cares'  },
]

// Seed with small random starting counts to make it feel lived-in
function seedCounts() {
  const counts = {}
  REACTION_TYPES.forEach(r => {
    counts[r.emoji] = Math.floor(Math.random() * 24)
  })
  return counts
}

/**
 * useReactions manages per-story reaction state.
 * - counts: { storyId: { emoji: number } }
 * - userPicks: { storyId: emoji | null }  — sessionStorage backed
 * Returns { getCounts, getUserPick, toggleReaction }
 */
export function useReactions(storyIds) {
  const [counts, setCounts] = useState(() => {
    const initial = {}
    storyIds.forEach(id => { initial[id] = seedCounts() })
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

  const toggleReaction = useCallback((storyId, emoji) => {
    setUserPicks(prev => {
      const current = prev[storyId]
      const next = { ...prev }

      if (current === emoji) {
        // Undo reaction
        delete next[storyId]
        setCounts(c => ({
          ...c,
          [storyId]: { ...c[storyId], [emoji]: Math.max(0, (c[storyId][emoji] || 0) - 1) },
        }))
      } else {
        // Switch or new reaction
        if (current) {
          setCounts(c => ({
            ...c,
            [storyId]: { ...c[storyId], [current]: Math.max(0, (c[storyId][current] || 0) - 1) },
          }))
        }
        next[storyId] = emoji
        setCounts(c => ({
          ...c,
          [storyId]: { ...c[storyId], [emoji]: (c[storyId][emoji] || 0) + 1 },
        }))
      }

      try { sessionStorage.setItem('ai_surge_reactions', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const getCounts = useCallback((storyId) => counts[storyId] || {}, [counts])
  const getUserPick = useCallback((storyId) => userPicks[storyId] || null, [userPicks])

  return { getCounts, getUserPick, toggleReaction }
}
