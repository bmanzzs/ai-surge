const TABS = [
  { id: '24h',   label: '24h',    sub: 'Today'     },
  { id: '7d',    label: '7 Days', sub: 'This Week'  },
  { id: 'month', label: 'Month',  sub: 'This Month' },
]

export default function TabBar({ active, onChange }) {
  return (
    <div style={{
      position: 'sticky',
      top: 56,
      zIndex: 40,
      backgroundColor: 'rgba(8,8,11,0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0 16px',
    }}>
      <div style={{
        maxWidth: 720,
        margin: '0 auto',
        display: 'flex',
        gap: 0,
      }}>
        {TABS.map(tab => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                padding: '14px 20px 12px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 1,
                color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                transition: 'color 0.2s ease',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-tertiary)' }}
            >
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                lineHeight: 1,
              }}>
                {tab.label}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '0.06em',
                opacity: 0.5,
                lineHeight: 1,
              }}>
                {tab.sub}
              </span>
              {/* Active underline */}
              {isActive && (
                <span style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: 'linear-gradient(90deg, #3b82f6, #a855f7)',
                  borderRadius: '2px 2px 0 0',
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
