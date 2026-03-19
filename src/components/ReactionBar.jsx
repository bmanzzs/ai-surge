import { useState } from 'react'
import { REACTION_TYPES } from '../hooks/useReactions'

export default function ReactionBar({ storyId, getCounts, getUserPick, toggleReaction }) {
  const counts = getCounts(storyId)
  const userPick = getUserPick(storyId)

  // Incrementing a key forces React to remount the span, replaying the CSS animation.
  const [animKeys, setAnimKeys] = useState({})

  const handleClick = (emoji) => {
    toggleReaction(storyId, emoji)
    setAnimKeys(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }))
  }

  return (
    <div style={{
      display: 'flex',
      gap: 4,
      paddingTop: 10,
      borderTop: '1px solid var(--border-subtle)',
      marginTop: 10,
    }}>
      {REACTION_TYPES.map(({ emoji, label }) => {
        const isSelected = userPick === emoji
        const count = counts[emoji] || 0
        const animKey = animKeys[emoji] || 0

        return (
          <button
            key={emoji}
            onClick={() => handleClick(emoji)}
            title={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 20,
              border: `1px solid ${isSelected ? 'rgba(255,255,255,0.22)' : 'transparent'}`,
              backgroundColor: isSelected ? 'rgba(255,255,255,0.1)' : 'transparent',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, border-color 0.15s ease',
              fontSize: 13,
              lineHeight: 1,
            }}
            onMouseEnter={e => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              }
            }}
            onMouseLeave={e => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = 'transparent'
              }
            }}
          >
            {/* key change → remount → CSS animation replays */}
            <span key={`emoji-${animKey}`} className={animKey > 0 ? 'emoji-pop' : ''} style={{ fontSize: 13 }}>
              {emoji}
            </span>
            <span
              key={`count-${animKey}`}
              className={animKey > 0 ? 'count-flip' : ''}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: isSelected ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                minWidth: 14,
                transition: 'color 0.15s ease',
              }}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
