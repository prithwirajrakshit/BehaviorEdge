import { useState, useEffect } from 'react'
import { getCalendar, getMonthlySummary } from '../api/client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { GlowCard } from '../components/GlowCard'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function getDaysInMonth(year, month) { return new Date(year, month, 0).getDate() }
function getFirstWeekday(year, month) { const d = new Date(year, month - 1, 1).getDay(); return d === 0 ? 6 : d - 1 }

export default function Calendar() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [dayData, setDayData] = useState({})
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [cal, sum] = await Promise.all([getCalendar(year, month), getMonthlySummary(year, month)])
        setDayData(cal.data)
        setSummary(sum.data)
      } catch {}
      setLoading(false)
    }
    load()
  }, [year, month])

  const numDays = getDaysInMonth(year, month)
  const firstWeekday = getFirstWeekday(year, month)
  const todayStr = now.toISOString().split('T')[0]

  const prev = () => { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const next = () => { if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1) }

  return (
    <div style={{ maxWidth: '100%' }}>

      {/* Header */}
      <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontFamily: 'Khand', fontWeight: 700, fontSize: '1.75rem', color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
            Trade Calendar
          </h2>
        </div>

        {/* Month Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={prev} style={{
            width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          ><ChevronLeft size={14} /></button>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Hind', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{MONTHS[month - 1]}</div>
            <div className="label" style={{ fontSize: '0.6rem' }}>{year}</div>
          </div>

          <button onClick={next} style={{
            width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          ><ChevronRight size={14} /></button>
        </div>
      </div>

      {/* Calendar Grid */}
      <GlowCard glowColor="purple" className="animate-fade-up stagger-1" style={{ padding: 20, marginBottom: 16 }}>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
          {DAYS.map(d => (
            <div key={d} className="label" style={{ textAlign: 'center', padding: '6px 0', fontSize: '0.6rem' }}>{d}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {Array.from({ length: firstWeekday }).map((_, i) => <div key={`e${i}`} />)}

            {Array.from({ length: numDays }).map((_, i) => {
              const day = i + 1
              const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const data = dayData[dateStr]
              const isToday = dateStr === todayStr

              if (data) {
                const pnl = data.net_pnl
                const isProfit = pnl > 0
                const isLoss = pnl < 0
                const pnlStr = pnl > 0 ? `+$${pnl.toFixed(0)}` : pnl < 0 ? `-$${Math.abs(pnl).toFixed(0)}` : '$0'

                return (
                  <div key={dateStr} style={{
                    borderRadius: 10, padding: '8px 6px', minHeight: 72,
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    background: isProfit ? 'rgba(16,185,129,0.06)' : isLoss ? 'rgba(244,63,94,0.06)' : 'rgba(124,58,237,0.06)',
                    border: `1px solid ${isProfit ? 'rgba(16,185,129,0.25)' : isLoss ? 'rgba(244,63,94,0.25)' : 'rgba(124,58,237,0.25)'}`,
                    transition: 'all 0.15s', cursor: 'default',
                  }}>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{day}</span>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem', marginBottom: 2 }}>{isProfit ? '✅' : isLoss ? '❌' : '⚖️'}</div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', fontWeight: 700, color: isProfit ? 'var(--green)' : isLoss ? 'var(--red)' : 'var(--accent)' }}>{pnlStr}</div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', color: 'var(--text-muted)', marginTop: 2 }}>{data.count}t</div>
                    </div>
                  </div>
                )
              }

              return (
                <div key={dateStr} style={{
                  borderRadius: 10, padding: '8px 6px', minHeight: 72,
                  background: isToday ? 'rgba(124,58,237,0.04)' : 'transparent',
                  border: `1px solid ${isToday ? 'rgba(124,58,237,0.3)' : 'var(--border)'}`,
                }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--accent)' : 'var(--text-muted)' }}>{day}</span>
                  {isToday && <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', color: 'var(--accent)', marginTop: 4, letterSpacing: '0.08em' }}>TODAY</div>}
                </div>
              )
            })}
          </div>
        )}
      </GlowCard>

      {/* Legend */}
      <div className="animate-fade-up stagger-2" style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
        {[['✅', 'Profit day', 'var(--green)'], ['❌', 'Loss day', 'var(--red)'], ['⚖️', 'Breakeven', 'var(--accent)']].map(([icon, label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.8rem' }}>{icon}</span>
            <span className="label" style={{ color, fontSize: '0.6rem' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Monthly Summary */}
      {summary && !summary.message && (
        <GlowCard glowColor="blue" className="animate-fade-up stagger-3" style={{ padding: 22 }}>
          <div className="label" style={{ marginBottom: 16 }}>{MONTHS[month - 1]} {year} Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
            {[
              { label: 'Trading Days', value: summary.trading_days, color: 'var(--accent)' },
              { label: 'Total Trades', value: summary.total_trades, color: 'var(--accent)' },
              { label: 'Profit Days', value: summary.profit_days, color: 'var(--green)' },
              { label: 'Loss Days', value: summary.loss_days, color: 'var(--red)' },
              { label: 'Breakeven', value: summary.even_days, color: 'var(--accent)' },
              { label: 'Month P&L', value: `${summary.month_net_pnl >= 0 ? '+' : ''}$${summary.month_net_pnl}`, color: summary.month_net_pnl >= 0 ? 'var(--green)' : 'var(--red)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center', padding: '14px 8px', background: 'var(--bg-base)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div className="metric-num" style={{ fontSize: '1.4rem', color, marginBottom: 6 }}>{value}</div>
                <div className="label" style={{ fontSize: '0.58rem' }}>{label}</div>
              </div>
            ))}
          </div>
        </GlowCard>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
