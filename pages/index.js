import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import Head from 'next/head'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const TIER_META = {
  CRITICAL:  { emoji: '🔴', color: '#ff2d20', label: 'CRITICAL'  },
  VIRAL:     { emoji: '🔥', color: '#ff6b00', label: 'VIRAL'     },
  PRE_VIRAL: { emoji: '⚡', color: '#bf5af2', label: 'PRE-VIRAL' },
  MONITOR:   { emoji: '👀', color: '#5ac8fa', label: 'MONITOR'   },
  NOISE:     { emoji: '—',  color: '#3a3a5a', label: 'NOISE'     },
}

function ScoreBar({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ fontSize: 11, color: '#50506e', width: 100, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: '#1a1a2e', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(value,100)}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 1s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 38, textAlign: 'right' }}>{Number(value).toFixed(1)}%</span>
    </div>
  )
}

function PredCard({ pred }) {
  const tier = TIER_META[pred.tier] || TIER_META.NOISE
  const [hovered, setHovered] = useState(false)

  return (
    <div style={{
      background: '#0e0e1a',
      border: `1px solid ${tier.color}44`,
      borderRadius: 8,
      padding: '14px 16px',
      position: 'relative',
      animation: 'fadeUp .3s ease',
    }}>
      <div style={{
        position: 'absolute', top: 12, right: 12,
        background: tier.color, color: '#fff',
        fontSize: 10, fontWeight: 700, letterSpacing: '.08em',
        padding: '2px 8px', borderRadius: 10,
      }}>
        {tier.emoji} {tier.label}
      </div>

      <div style={{ fontSize: 11, color: '#50506e', marginBottom: 6, fontFamily: 'monospace' }}>
        {(pred.platform || 'youtube').toUpperCase()} · @{pred.author || 'unknown'}
      </div>

      <a
        href={pred.clip_url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'block',
          fontSize: 14,
          color: hovered ? '#5ac8fa' : '#d0d0e8',
          marginBottom: 12,
          paddingRight: 80,
          lineHeight: 1.5,
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'color .15s',
          wordBreak: 'break-word',
        }}
      >
        {pred.title || 'Untitled'} <span style={{ fontSize: 11, opacity: .5 }}>↗</span>
      </a>

      <ScoreBar label="V-EYE AI"    value={pred.veye_score     || 0} color="#5ac8fa" />
      <ScoreBar label="Platform"    value={pred.platform_score || 0} color="#30d158" />
      <ScoreBar label="Final Score" value={pred.final_score    || 0} color={tier.color} />

      {pred.reason && (
        <div style={{ fontSize: 11, color: '#ff9f0a', fontStyle: 'italic', marginTop: 8 }}>
          {pred.reason}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div style={{
      background: '#0e0e1a', border: '1px solid #1e1e32',
      borderRadius: 8, padding: '16px 20px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 32, fontFamily: "'Bebas Neue', cursive", color: color || '#d0d0e8', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: '#50506e', letterSpacing: '.1em', marginTop: 4 }}>{label}</div>
    </div>
  )
}

export default function Home() {
  const [preds, setPreds]   = useState([])
  const [filter, setFilter] = useState('ALL')
  const [stats, setStats]   = useState({ total: 0, viral: 0, pre: 0, critical: 0 })

  useEffect(() => {
    fetchPredictions()
    const channel = supabase
      .channel('predictions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'predictions' }, payload => {
        setPreds(p => [payload.new, ...p].slice(0, 100))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchPredictions() {
    const { data } = await supabase
      .from('predictions')
      .select('*')
      .order('final_score', { ascending: false })
      .limit(100)
    if (data) {
      setPreds(data)
      setStats({
        total:    data.length,
        critical: data.filter(p => p.tier === 'CRITICAL').length,
        viral:    data.filter(p => p.tier === 'VIRAL').length,
        pre:      data.filter(p => p.tier === 'PRE_VIRAL').length,
      })
    }
  }

  const filtered = filter === 'ALL'  ? preds
    : filter === 'CROSS'             ? preds.filter(p => p.is_cross_signal)
    : preds.filter(p => p.tier === filter)

  return (
    <>
      <Head>
        <title>V-EYE — Virality Command Center</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #07070f; color: #d0d0e8; font-family: 'Space Mono', monospace; min-height: 100vh; }
        body::after { content: ''; position: fixed; inset: 0; background: repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.015) 3px,rgba(0,0,0,.015) 4px); pointer-events: none; z-index: 9999; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink  { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        @keyframes scroll { from { transform: translateX(100%); } to { transform: translateX(-100%); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #07070f; }
        ::-webkit-scrollbar-thumb { background: #1e1e32; border-radius: 2px; }
        a { -webkit-tap-highlight-color: transparent; }
      `}</style>

      <header style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '12px 24px',
        borderBottom: '1px solid #1e1e32',
        background: 'linear-gradient(90deg, rgba(255,45,32,.06), transparent 60%)',
        position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(12px)',
      }}>
        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 36, color: '#ff2d20', letterSpacing: '.1em', textShadow: '0 0 30px rgba(255,45,32,.4)', lineHeight: 1 }}>
          V-EYE
        </div>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 14, letterSpacing: '.14em' }}>VIRALITY COMMAND CENTER</div>
          <div style={{ fontSize: 10, color: '#50506e', letterSpacing: '.1em' }}>Real-time pre-viral detection · YouTube · TikTok · Instagram · Twitch</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#30d158', animation: 'blink 1.8s ease-in-out infinite' }} />
          <span style={{ fontSize: 11, color: '#30d158', letterSpacing: '.1em' }}>LIVE</span>
          <button onClick={fetchPredictions} style={{
            marginLeft: 8, background: 'transparent', border: '1px solid #1e1e32',
            borderRadius: 4, color: '#50506e', padding: '4px 12px',
            cursor: 'pointer', fontFamily: 'monospace', fontSize: 11,
          }}>
            ↻ REFRESH
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, padding: '16px 24px', borderBottom: '1px solid #1e1e32' }}>
        <StatBox label="TOTAL SCORED" value={stats.total}    color="#d0d0e8" />
        <StatBox label="🔴 CRITICAL"  value={stats.critical} color="#ff2d20" />
        <StatBox label="🔥 VIRAL"     value={stats.viral}    color="#ff6b00" />
        <StatBox label="⚡ PRE-VIRAL" value={stats.pre}      color="#bf5af2" />
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '12px 24px', borderBottom: '1px solid #1e1e32', background: '#0b0b14', flexWrap: 'wrap' }}>
        {['ALL','CRITICAL','VIRAL','PRE_VIRAL','MONITOR','CROSS'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '4px 14px', borderRadius: 12, fontSize: 11,
            fontFamily: 'monospace', cursor: 'pointer', letterSpacing: '.08em',
            fontWeight: filter === f ? 700 : 400,
            border:     filter === f ? '1px solid #ff2d20' : '1px solid #1e1e32',
            background: filter === f ? 'rgba(255,45,32,.12)' : 'transparent',
            color:      filter === f ? '#ff2d20' : '#50506e',
            transition: 'all .2s',
          }}>
            {f.replace('_',' ')}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#50506e', alignSelf: 'center' }}>
          {filtered.length} predictions
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px,1fr))', gap: 12, padding: '16px 24px', paddingBottom: 48 }}>
        {filtered.length === 0
          ? <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#50506e', padding: '60px 0', fontSize: 13 }}>
              No predictions yet — run the Colab scorer to populate
            </div>
          : filtered.map(p => <PredCard key={p.id} pred={p} />)
        }
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, borderTop: '1px solid #1e1e32', background: '#0b0b14', padding: '5px 0', overflow: 'hidden' }}>
        <div style={{ whiteSpace: 'nowrap', fontSize: 11, color: '#50506e', animation: 'scroll 40s linear infinite', display: 'inline-block', paddingLeft: '100%' }}>
          {preds.slice(0,10).map(p =>
            `${TIER_META[p.tier]?.emoji || '—'} ${(p.platform||'').toUpperCase()} · ${(p.title||'').slice(0,40)} · ${Number(p.final_score||0).toFixed(1)}%`
          ).join('   ·   ')}
        </div>
      </div>
    </>
  )
}
