export default function Toast({ message, toastKey }) {
  if (!message) return null

  return (
    <div
      key={toastKey}
      style={{
        position: 'fixed',
        bottom: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        backgroundColor: '#1c1c28',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
        fontSize: 13,
        fontWeight: 500,
        padding: '8px 16px',
        borderRadius: 20,
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        animation: 'toastIn 0.22s ease both',
        pointerEvents: 'none',
      }}
    >
      {message}
    </div>
  )
}
