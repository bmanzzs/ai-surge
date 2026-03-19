import { SOURCE_TYPES } from '../data/stories'

const PERIOD_LABELS = { '24h': 'today', '7d': 'this week', 'month': 'this month' }

export default function StatsBar({ stories, period }) {
  const now = new Date()
  const updatedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

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

      <span style={{ color: 'var(--border-muted)', fontSize: 12 }}>·</span>

      {/* Last updated */}
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        color: 'var(--text-tertiary)',
        letterSpacing: '0.04em',
        marginLeft: 'auto',
      }}>
        Updated {updatedTime}
      </span>
    </div>
  )
}
