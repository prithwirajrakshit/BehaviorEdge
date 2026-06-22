import { useEffect, useState } from 'react'
import { getDashboardStats, getTrades } from '../api/client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Activity, Target, Zap, BarChart2 } from 'lucide-react'
import { GlowCard } from '../components/GlowCard'

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
    return (
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '8px 12px',
        fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: 'var(--text-primary)',
      }}>
        <div style={{ color: 'var(--text-secondary)', marginBottom: 2 }}>Trade #{label}</div>
        <div>{payload[0].value?.toFixed?.(2) ?? payload[0].value}</div>
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

  return (
    <div style={{ maxWidth: '100%' }}>

      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'Khand', fontWeight: 700, fontSize: '1.75rem', color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
          Performance Dashboard
        </h2>
      </div>

      {/* Top Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        <MetricCard label="Discipline Score" value={`${stats.discipline_score}`} sub="out of 100" color={scoreColor} icon={Target} delay={1} glow />
        <MetricCard label="Total Trades" value={stats.total_trades} sub="all time" color="accent" icon={BarChart2} delay={2} />
        <MetricCard label="Win Rate" value={`${stats.win_rate}%`} sub={stats.win_rate >= 55 ? '↑ Above avg' : '↓ Below avg'} color={stats.win_rate >= 55 ? 'green' : 'amber'} icon={TrendingUp} delay={3} />
        <MetricCard label="Net P&L" value={`${stats.net_pnl >= 0 ? '+' : ''}$${stats.net_pnl}`} color={pnlColor} icon={stats.net_pnl >= 0 ? TrendingUp : TrendingDown} delay={4} glow />
        <MetricCard label="Today's P&L" value={`${stats.today_pnl >= 0 ? '+' : ''}$${stats.today_pnl}`} color={todayColor} icon={Zap} delay={5} />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>

        {/* Discipline Score Trend */}
        <GlowCard glowColor="purple" className="animate-fade-up stagger-2" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div className="label">Discipline Score Trend</div>
            <span className="badge-green">Live</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={scoreData}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="trade" stroke="var(--border)" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <YAxis domain={[0, 100]} stroke="var(--border)" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 3, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </GlowCard>

        {/* EVI Chart */}
        <GlowCard glowColor="purple" className="animate-fade-up stagger-3" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div className="label">Emotional Volatility Index</div>
            <span className="badge-amber">EVI</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={eviData}>
              <XAxis dataKey="trade" stroke="var(--border)" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <YAxis stroke="var(--border)" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="evi" radius={[4, 4, 0, 0]}>
                {eviData.map((entry, index) => (
                  <Cell key={index} fill={entry.evi >= 3 ? 'var(--red)' : entry.evi >= 2 ? 'var(--amber)' : 'var(--green)'} opacity={0.8} />
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }`}</style>
    </div>
  )
}
