const TIERS = [
  { range: '8–10', label: 'High Trust',    color: '#22c55e', desc: 'Major outlets, peer-reviewed, primary sources' },
  { range: '6–7',  label: 'Mid Trust',     color: '#eab308', desc: 'Community-verified, credible secondhand reports' },
  { range: '4–5',  label: 'Low Trust',     color: '#f97316', desc: 'Speculative, single-source, unconfirmed leaks' },
  { range: '1–3',  label: 'Use Caution',   color: '#ef4444', desc: 'Rumors, anonymous sources, contested claims' },
]

export default function TrustScoreLegend() {
  return (
    <section style={{
      maxWidth: 720,
      margin: '0 auto',
      padding: '24px 16px 40px',
    }}>
      <div style={{
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface)',
        padding: '16px 18px',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.1em',
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
          }}>
            Trust Score Guide
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-subtle)' }} />
        </div>

        {/* Tiers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TIERS.map(tier => (
            <div key={tier.range} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 500,
                color: tier.color,
                backgroundColor: `${tier.color}18`,
                border: `1px solid ${tier.color}33`,
                padding: '2px 7px',
                borderRadius: 4,
                flexShrink: 0,
                whiteSpace: 'nowrap',
                marginTop: 1,
              }}>
                {tier.range}
              </span>
              <div>
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                }}>
                  {tier.label}
                </span>
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                  marginLeft: 6,
                }}>
                  — {tier.desc}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-tertiary)',
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid var(--border-subtle)',
          lineHeight: 1.5,
        }}>
          Trust scores reflect source credibility, not story importance. Low-trust stories may still be significant — verify before sharing.
        </p>
      </div>
    </section>
  )
}
