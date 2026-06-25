import { useEffect, useState } from 'react'
import { getDashboardStats, getTrades } from '../api/client'
import { LineChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, CartesianGrid, ReferenceLine } from 'recharts'
import { TrendingUp, TrendingDown, Activity, Target, Zap, BarChart2 } from 'lucide-react'
import { GlowCard } from '../components/GlowCard'
import { DisciplineGauge } from '../components/DisciplineGauge'

function MetricCard({ label, value, sub, color, icon: Icon, delay, glow }) {
  return (
    <GlowCard glowColor="purple" className={`animate-fade-up stagger-${delay}`} style={{
      padding: '20px 22px',
      borderColor: glow ? 'rgba(124,58,237,0.2)' : undefined,
      boxShadow: glow ? '0 0 24px rgba(124,58,237,0.08)' : undefined,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div className="label" style={{ marginBottom: 10 }}>{label}</div>
        {Icon && <Icon size={14} color={`var(--${color === 'green' ? 'green' : color === 'red' ? 'red' : color === 'amber' ? 'amber' : 'accent'})`} />}
      </div>
      <div className="metric-num" style={{
        fontSize: '1.8rem', lineHeight: 1,
        color: color === 'green' ? 'var(--green)' : color === 'red' ? 'var(--red)' : color === 'amber' ? 'var(--amber)' : 'var(--accent)',
      }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 6 }}>{sub}</div>}
    </GlowCard>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const valueColor = payload[0].dataKey === 'score'
      ? (payload[0].value >= 70 ? '#10b981' : payload[0].value >= 40 ? '#f59e0b' : '#f43f5e')
      : (payload[0].dataKey === 'evi'
        ? (payload[0].value >= 3 ? '#f43f5e' : payload[0].value >= 2 ? '#f59e0b' : '#10b981')
        : 'var(--text-primary)')
    return (
      <div style={{
        background: 'rgba(14, 11, 24, 0.85)',
        border: '1px solid rgba(124,58,237,0.25)',
        borderRadius: 10,
        padding: '10px 14px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(124,58,237,0.15)',
        fontFamily: 'JetBrains Mono',
        fontSize: '0.7rem',
        color: 'var(--text-primary)',
        animation: 'fadeIn 0.15s ease',
      }}>
        <div style={{ color: 'var(--text-secondary)', marginBottom: 4, fontSize: '0.6rem', letterSpacing: '0.06em' }}>TRADE #{label}</div>
        <div style={{ color: valueColor, fontWeight: 600, fontSize: '0.85rem' }}>
          {payload[0].value?.toFixed?.(2) ?? payload[0].value}
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.55rem', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {payload[0].dataKey === 'score' ? 'Discipline Score' : 'Emotional Volatility'}
        </div>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t] = await Promise.all([getDashboardStats(), getTrades()])
        setStats(s.data)
        setTrades(t.data)
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div className="label">Loading dashboard...</div>
    </div>
  )

  if (!stats) return <div className="label" style={{ padding: 40 }}>No data yet — log your first trade.</div>

  const scoreColor = stats.discipline_score >= 70 ? 'green' : stats.discipline_score >= 40 ? 'amber' : 'red'
  const pnlColor = stats.net_pnl >= 0 ? 'green' : 'red'
  const todayColor = stats.today_pnl >= 0 ? 'green' : 'red'

  const scoreData = trades.map((t, i) => ({ trade: i + 1, score: t.discipline_score }))
  const eviData = trades.map((t, i) => ({ trade: i + 1, evi: t.evi }))

  // Summary stats for the chart briefing strips
  const scores = scoreData.map(d => d.score)
  const evis = eviData.map(d => d.evi)
  const scoreStats = scores.length ? {
    avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
    min: Math.min(...scores),
    max: Math.max(...scores),
    trend: scores.length >= 2 ? (scores[scores.length - 1] - scores[0] >= 0 ? '↑' : '↓') : '—',
  } : { avg: '—', min: '—', max: '—', trend: '—' }
  const eviStats = evis.length ? {
    avg: (evis.reduce((a, b) => a + b, 0) / evis.length).toFixed(2),
    min: Math.min(...evis).toFixed(2),
    max: Math.max(...evis).toFixed(2),
    high: evis.filter(e => e >= 3).length,
  } : { avg: '—', min: '—', max: '—', high: 0 }

  return (
    <div style={{ maxWidth: '100%' }}>

      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'Khand', fontWeight: 700, fontSize: '1.75rem', color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
          Performance Dashboard
        </h2>
      </div>

      {/* Top Metrics */}
      <div className="grid-metrics" style={{ marginBottom: 20 }}>
        {/* Discipline Score — radial gauge replaces the flat number card */}
        <GlowCard glowColor={scoreColor === 'green' ? 'green' : scoreColor === 'amber' ? 'amber' : 'red'} className="animate-fade-up stagger-1" style={{
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderColor: scoreColor === 'green' ? 'rgba(16,185,129,0.2)' : scoreColor === 'amber' ? 'rgba(245,158,11,0.2)' : 'rgba(244,63,94,0.2)',
        }}>
          <DisciplineGauge value={stats.discipline_score} size={108} />
          <div className="label" style={{ textAlign: 'center', marginTop: 2 }}>Discipline</div>
        </GlowCard>
        <MetricCard label="Total Trades" value={stats.total_trades} sub="all time" color="accent" icon={BarChart2} delay={2} />
        <MetricCard label="Win Rate" value={`${stats.win_rate}%`} sub={stats.win_rate >= 55 ? '↑ Above avg' : '↓ Below avg'} color={stats.win_rate >= 55 ? 'green' : 'amber'} icon={TrendingUp} delay={3} />
        <MetricCard label="Net P&L" value={`${stats.net_pnl >= 0 ? '+' : ''}$${stats.net_pnl}`} color={pnlColor} icon={stats.net_pnl >= 0 ? TrendingUp : TrendingDown} delay={4} glow />
        <MetricCard label="Today's P&L" value={`${stats.today_pnl >= 0 ? '+' : ''}$${stats.today_pnl}`} color={todayColor} icon={Zap} delay={5} />
      </div>

      {/* Charts Row */}
      <div className="grid-charts" style={{ marginBottom: 20 }}>

        {/* Discipline Score Trend — futuristic upgrade */}
        <GlowCard glowColor="purple" className="animate-fade-up stagger-2 chart-scanlines" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="label">Discipline Score Trend</div>
            <span className="badge-green">Live</span>
          </div>

          {/* Stat summary strip — briefing panel */}
          <div style={{
            display: 'flex', gap: 16, marginBottom: 16, padding: '8px 12px',
            background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border)',
          }}>
            {[
              { label: 'AVG', value: scoreStats.avg, color: 'var(--accent)' },
              { label: 'MIN', value: scoreStats.min, color: 'var(--red)' },
              { label: 'MAX', value: scoreStats.max, color: 'var(--green)' },
              { label: 'TREND', value: scoreStats.trend, color: scoreStats.trend === '↑' ? 'var(--green)' : scoreStats.trend === '↓' ? 'var(--red)' : 'var(--text-muted)' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '0.95rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={scoreData}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <filter id="lineGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feFlood floodColor="#7c3aed" floodOpacity="0.6" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <XAxis dataKey="trade" stroke="var(--border)" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <YAxis domain={[0, 100]} stroke="var(--border)" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <Tooltip content={<CustomTooltip />} />
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} />
              {/* Threshold line at 70 — green zone boundary */}
              <ReferenceLine y={70} stroke="#10b981" strokeDasharray="6 4" strokeWidth={1} opacity={0.5}>
                <text x={4} y={66} fill="#10b981" fontSize={9} fontFamily="JetBrains Mono" opacity={0.7}>GOOD</text>
              </ReferenceLine>
              <Area type="monotone" dataKey="score" fill="url(#scoreGrad)" stroke="none" animationDuration={1200} animationEasing="ease-out" animationBegin={600} />
              <Line
                type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2.5}
                dot={{ fill: '#7c3aed', r: 3, strokeWidth: 0 }}
                activeDot={{
                  r: 5, fill: '#a78bfa', stroke: '#7c3aed', strokeWidth: 2,
                  filter: 'url(#lineGlow)',
                }}
                filter="url(#lineGlow)"
                animationDuration={1200} animationEasing="ease-out" animationBegin={600}
              />
            </LineChart>
          </ResponsiveContainer>
        </GlowCard>

        {/* EVI Chart — futuristic upgrade */}
        <GlowCard glowColor="purple" className="animate-fade-up stagger-3 chart-scanlines" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="label">Emotional Volatility Index</div>
            <span className="badge-amber">EVI</span>
          </div>

          {/* Stat summary strip — briefing panel */}
          <div style={{
            display: 'flex', gap: 16, marginBottom: 16, padding: '8px 12px',
            background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border)',
          }}>
            {[
              { label: 'AVG', value: eviStats.avg, color: 'var(--accent)' },
              { label: 'MIN', value: eviStats.min, color: 'var(--green)' },
              { label: 'MAX', value: eviStats.max, color: 'var(--red)' },
              { label: 'HIGH FLAGS', value: eviStats.high, color: eviStats.high > 0 ? 'var(--red)' : 'var(--text-muted)' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '0.95rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={eviData}>
              <defs>
                {/* Per-zone vertical gradients — lighter top → darker bottom */}
                <linearGradient id="eviRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.35} />
                </linearGradient>
                <linearGradient id="eviAmber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.35} />
                </linearGradient>
                <linearGradient id="eviGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.35} />
                </linearGradient>
                {/* Bar glow filter — same technique as the line */}
                <filter id="barGlow">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feFlood floodColor="#a78bfa" floodOpacity="0.35" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <XAxis dataKey="trade" stroke="var(--border)" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <YAxis stroke="var(--border)" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,58,237,0.06)' }} />
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} vertical={false} />
              {/* Zone threshold lines */}
              <ReferenceLine y={2} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1} opacity={0.4} />
              <ReferenceLine y={3} stroke="#f43f5e" strokeDasharray="4 4" strokeWidth={1} opacity={0.4} />
              <Bar dataKey="evi" radius={[6, 6, 0, 0]} filter="url(#barGlow)" animationDuration={800} animationEasing="ease-out" animationBegin={600}>
                {eviData.map((entry, index) => (
                  <Cell key={index} fill={entry.evi >= 3 ? 'url(#eviRed)' : entry.evi >= 2 ? 'url(#eviAmber)' : 'url(#eviGreen)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlowCard>
      </div>

      {/* Today Summary */}
      <GlowCard glowColor="purple" className="animate-fade-up stagger-4" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="label">Today's Session</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'var(--green)', letterSpacing: '0.08em' }}>TRADING DAY</span>
          </div>
        </div>
        <div className="grid-summary">
          {[
            { label: 'Trades Today', value: stats.today_trades, color: 'var(--accent)' },
            { label: 'Daily Loss', value: `$${stats.daily_loss}`, color: 'var(--red)' },
            { label: 'Avg RDI', value: stats.avg_rdi, color: 'var(--amber)' },
            { label: 'Avg EVI', value: stats.avg_evi, color: 'var(--accent)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding: '16px', background: 'var(--bg-base)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div className="label" style={{ marginBottom: 8 }}>{label}</div>
              <div className="metric-num" style={{ fontSize: '1.4rem', color }}>{value}</div>
            </div>
          ))}
        </div>
      </GlowCard>

      {/* keyframes spin/pulse are defined in index.css — no inline duplicate needed */}
    </div>
  )
}
