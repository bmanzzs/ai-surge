const shimmerStyle = {
  background: 'linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-elevated) 50%, var(--bg-surface) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s infinite',
  borderRadius: 4,
}

function Bone({ width = '100%', height = 12, style = {} }) {
  return <div style={{ ...shimmerStyle, width, height, ...style }} />
}

function SkeletonCard() {
  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      borderRadius: 'var(--radius-lg)',
      padding: '14px 16px',
      marginBottom: 10,
    }}>
      {/* Metadata row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Bone width={52} height={18} style={{ borderRadius: 4 }} />
        <Bone width={80} height={11} />
        <Bone width={36} height={11} />
        <div style={{ marginLeft: 'auto' }}>
          <Bone width={24} height={24} style={{ borderRadius: 6 }} />
        </div>
      </div>

      {/* Headline */}
      <Bone width="90%" height={15} style={{ marginBottom: 6 }} />
      <Bone width="65%" height={15} style={{ marginBottom: 10 }} />

      {/* Summary */}
      <Bone width="100%" height={11} style={{ marginBottom: 5 }} />
      <Bone width="80%" height={11} style={{ marginBottom: 14 }} />

      {/* Reaction row */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[52, 52, 52, 52].map((w, i) => (
          <Bone key={i} width={w} height={28} style={{ borderRadius: 6 }} />
        ))}
      </div>
    </div>
  )
}

export default function StorySkeleton({ count = 5 }) {
  return (
    <div style={{ padding: '10px 16px 0' }}>
      {Array.from({ length: count }, (_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}
