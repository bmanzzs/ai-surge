import { useRef } from 'react'

export default function SearchBar({ value, onChange, resultCount, isFiltering }) {
  const inputRef = useRef(null)

  return (
    <div style={{
      padding: '8px 16px 0',
      maxWidth: 720,
      margin: '0 auto',
    }}>
      <div style={{ position: 'relative' }}>
        {/* Search icon */}
        <span style={{
          position: 'absolute',
          left: 11,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          color: 'var(--text-tertiary)',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Search stories, sources…"
          style={{
            width: '100%',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '8px 36px 8px 32px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            outline: 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            caretColor: 'var(--accent-blue)',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'rgba(59,130,246,0.4)'
            e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)'
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--border-subtle)'
            e.target.style.boxShadow = 'none'
          }}
        />

        {/* Clear button */}
        {value && (
          <button
            onClick={() => { onChange(''); inputRef.current?.focus() }}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 18,
              height: 18,
              borderRadius: '50%',
              backgroundColor: 'var(--text-tertiary)',
              color: 'var(--bg-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1,
              padding: 0,
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Result count */}
      {isFiltering && (
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-tertiary)',
          marginTop: 6,
          letterSpacing: '0.04em',
        }}>
          {resultCount === 0
            ? 'No stories match'
            : `${resultCount} result${resultCount !== 1 ? 's' : ''}`}
        </p>
      )}
    </div>
  )
}
