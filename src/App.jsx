import { useState, useMemo } from 'react'
import Header from './components/Header'
import TabBar from './components/TabBar'
import StatsBar from './components/StatsBar'
import SearchBar from './components/SearchBar'
import StoryFeed from './components/StoryFeed'
import StorySkeleton from './components/StorySkeleton'
import TrustScoreLegend from './components/TrustScoreLegend'
import Toast from './components/Toast'
import { useStories } from './hooks/useStories'
import { useReactions } from './hooks/useReactions'
import { useToast } from './hooks/useToast'

export default function App() {
  const [activePeriod, setActivePeriod] = useState('24h')
  const [searchQuery, setSearchQuery] = useState('')

  const { toastMessage, toastKey, showToast } = useToast()
  const { stories, loading, error, lastFetched, refetch } = useStories(activePeriod)
  const { getCounts, getUserPick, toggleReaction } = useReactions(stories)

  const filteredStories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return stories
    return stories.filter(s =>
      s.headline.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      s.sourceName.toLowerCase().includes(q)
    )
  }, [stories, searchQuery])

  const handlePeriodChange = (period) => {
    setActivePeriod(period)
    setSearchQuery('')
  }

  const handleShare = async (url) => {
    try {
      await navigator.clipboard.writeText(url)
      showToast('Link copied!')
    } catch {
      showToast('Copy failed — try manually')
    }
  }

  const isFiltering = searchQuery.trim().length > 0

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--bg-base)' }}>
      <Header />
      <TabBar active={activePeriod} onChange={handlePeriodChange} />

      <main style={{ maxWidth: 720, margin: '0 auto' }}>
        <StatsBar stories={stories} period={activePeriod} lastFetched={lastFetched} />

        {!loading && (
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            resultCount={filteredStories.length}
            isFiltering={isFiltering}
          />
        )}

        {loading && <StorySkeleton count={5} />}

        {!loading && error && (
          <div style={{
            margin: '32px 16px',
            padding: '24px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(239,68,68,0.2)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 15,
              color: 'var(--text-secondary)',
              marginBottom: 16,
            }}>
              Couldn't load stories — try refreshing
            </p>
            <button
              onClick={refetch}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.06em',
                color: 'var(--accent-blue)',
                backgroundColor: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 6,
                padding: '7px 16px',
                cursor: 'pointer',
              }}
            >
              RETRY
            </button>
          </div>
        )}

        {!loading && !error && (
          <div style={{ padding: '10px 16px 0' }}>
            <StoryFeed
              key={activePeriod}
              stories={filteredStories}
              searchQuery={searchQuery}
              getCounts={getCounts}
              getUserPick={getUserPick}
              toggleReaction={toggleReaction}
              onShare={handleShare}
            />
          </div>
        )}
      </main>

      <TrustScoreLegend />
      <Toast message={toastMessage} toastKey={toastKey} />
    </div>
  )
}
