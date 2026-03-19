import { useState, useMemo } from 'react'
import Header from './components/Header'
import TabBar from './components/TabBar'
import StatsBar from './components/StatsBar'
import SearchBar from './components/SearchBar'
import StoryFeed from './components/StoryFeed'
import TrustScoreLegend from './components/TrustScoreLegend'
import Toast from './components/Toast'
import { getStoriesByPeriod, stories as allStories } from './data/stories'
import { useReactions } from './hooks/useReactions'
import { useToast } from './hooks/useToast'

export default function App() {
  const [activePeriod, setActivePeriod] = useState('24h')
  const [searchQuery, setSearchQuery] = useState('')

  const { toastMessage, toastKey, showToast } = useToast()

  const allIds = allStories.map(s => s.id)
  const { getCounts, getUserPick, toggleReaction } = useReactions(allIds)

  const periodStories = getStoriesByPeriod(activePeriod)

  const filteredStories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return periodStories
    return periodStories.filter(s =>
      s.headline.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      s.sourceName.toLowerCase().includes(q)
    )
  }, [periodStories, searchQuery])

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
        <StatsBar stories={periodStories} period={activePeriod} />
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          resultCount={filteredStories.length}
          isFiltering={isFiltering}
        />

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
      </main>

      <TrustScoreLegend />
      <Toast message={toastMessage} toastKey={toastKey} />
    </div>
  )
}
