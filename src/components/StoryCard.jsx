import { SOURCE_TYPES, getTrustConfig } from '../data/stories'
import ReactionBar from './ReactionBar'

function ShareIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  )
}

export default function StoryCard({ story, index, getCounts, getUserPick, toggleReaction, onShare }) {
  const typeConfig = SOURCE_TYPES[story.type]
  const trustConfig = getTrustConfig(story.trustScore)

  return (
    <article
      className="animate-fade-in story-card"
      style={{
        animationDelay: `${index * 0.05}s`,
        // Dynamic per-card value consumed by .story-card:hover in CSS
        '--card-hover-shadow': `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${typeConfig.color}22`,
        position: 'relative',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        borderLeft: `3px solid ${typeConfig.color}`,
        overflow: 'hidden',
      }}
    >
      {/* ── Metadata row — outside <a> so share button isn't nested inside it ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 14px 0',
        flexWrap: 'wrap',
      }}>
        {/* Type badge */}
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: '0.08em',
          color: typeConfig.color,
          backgroundColor: typeConfig.bgColor,
          padding: '2px 7px',
          borderRadius: 4,
          textTransform: 'uppercase',
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}>
          {typeConfig.icon === 'headphones' && (
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M12 3a9 9 0 0 0-9 9v5a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H5v-2a7 7 0 0 1 14 0v2h-2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1a3 3 0 0 0 3-3v-5a9 9 0 0 0-9-9z"/>
            </svg>
          )}
          {typeConfig.label}
        </span>

        {/* Source name */}
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-tertiary)',
          letterSpacing: '0.02em',
          flexShrink: 0,
        }}>
          {story.sourceName}
        </span>

        <span style={{ flex: 1 }} />

        {/* Age */}
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-tertiary)',
          letterSpacing: '0.04em',
          flexShrink: 0,
        }}>
          {story.ageLabel}
        </span>

        {/* Share button */}
        <button
          className="share-btn"
          onClick={e => { e.stopPropagation(); onShare(story.url) }}
          title="Copy link"
          aria-label="Copy link"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
            padding: 0,
          }}
        >
          <ShareIcon />
        </button>

        {/* Trust score */}
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          fontWeight: 500,
          color: trustConfig.color,
          backgroundColor: `${trustConfig.color}18`,
          border: `1px solid ${trustConfig.color}33`,
          padding: '2px 6px',
          borderRadius: 4,
          letterSpacing: '0.04em',
          flexShrink: 0,
        }}>
          {story.trustScore}/10
        </span>
      </div>

      {/* ── Headline + summary — the clickable area ── */}
      <a
        href={story.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          padding: '8px 14px 12px',
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(16px, 2.5vw, 19px)',
          fontWeight: 400,
          lineHeight: 1.3,
          color: 'var(--text-primary)',
          marginBottom: 8,
          letterSpacing: '-0.01em',
        }}>
          {story.headline}
        </h2>

        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          fontWeight: 300,
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
        }}>
          {story.summary}
        </p>
      </a>

      {/* ── Reactions ── */}
      <div style={{ padding: '0 14px 12px' }}>
        <ReactionBar
          storyId={story.id}
          getCounts={getCounts}
          getUserPick={getUserPick}
          toggleReaction={toggleReaction}
        />
      </div>
    </article>
  )
}
