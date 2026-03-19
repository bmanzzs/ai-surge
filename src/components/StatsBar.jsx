import { useState, useEffect } from 'react'
import { SOURCE_TYPES } from '../data/stories'

const PERIOD_LABELS = { '24h': 'today', '7d': 'this week', 'month': 'this month' }

function useRelativeTime(timestamp) {
  const [label, setLabel] = useState(() => getLabel(timestamp))

  useEffect(() => {
    setLabel(getLabel(timestamp))
    const id = setInterval(() => setLabel(getLabel(timestamp)), 30_000)
    return () => clearInterval(id)
  }, [timestamp])

  return label
}

function getLabel(timestamp) {
  if (!timestamp) return null
  const mins = Math.floor((Date.now() - timestamp) / 60_000)
  if (mins < 1) return 'Updated just now'
  if (mins === 1) return 'Updated 1 min ago'
  return `Updated ${mins} min ago`
}

export default function StatsBar({ stories, period, lastFetched }) {
  const updatedLabel = useRelativeTime(lastFetched)

  const typeCounts = stories.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1
    return acc
  }, {})

  return (
    <div style={{
      maxWidth: 720,
      margin: '0 auto',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      {/* Total */}
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--text-secondary)',
      }}>
        <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{stories.length}</strong>
        {' '}stories {PERIOD_LABELS[period]}
      </span>

      {stories.length > 0 && (
        <>
          <span style={{ color: 'var(--border-muted)', fontSize: 12 }}>·</span>

          {/* Breakdown */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(SOURCE_TYPES).map(([type, config]) => {
              const count = typeCounts[type] || 0
              if (!count) return null
              return (
                <span key={type} style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: config.color,
                  backgroundColor: config.bgColor,
                  padding: '2px 7px',
                  borderRadius: 4,
                  letterSpacing: '0.04em',
                }}>
                  {count} {config.label}{count !== 1 ? 's' : ''}
                </span>
              )
            })}
          </div>
        </>
      )}

      {updatedLabel && (
        <>
          <span style={{ color: 'var(--border-muted)', fontSize: 12 }}>·</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-tertiary)',
            letterSpacing: '0.04em',
            marginLeft: 'auto',
          }}>
            {updatedLabel}
          </span>
        </>
      )}
    </div>
  )
}
