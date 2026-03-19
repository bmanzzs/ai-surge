import StoryCard from './StoryCard'

export default function StoryFeed({ stories, searchQuery, getCounts, getUserPick, toggleReaction, onShare }) {
  const isFiltering = searchQuery && searchQuery.trim().length > 0

  if (!stories.length) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '64px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}>
        {isFiltering ? (
          <>
            <span style={{ fontSize: 28 }}>🔍</span>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'var(--text-secondary)',
            }}>
              No stories match <em>"{searchQuery}"</em>
            </p>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-tertiary)',
              letterSpacing: '0.04em',
            }}>
              Try a different keyword or clear the search
            </p>
          </>
        ) : (
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--text-tertiary)',
          }}>
            No stories for this period yet.
          </p>
        )}
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {stories.map((story, i) => (
        <StoryCard
          key={story.id}
          story={story}
          index={i}
          getCounts={getCounts}
          getUserPick={getUserPick}
          toggleReaction={toggleReaction}
          onShare={onShare}
        />
      ))}
    </div>
  )
}
