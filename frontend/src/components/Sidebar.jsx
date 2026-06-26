import { LayoutDashboard, TrendingUp, Bot, Calendar, LogOut, Activity, User, BookOpen } from 'lucide-react'

const navItems = [
  { id: 'dashboard', label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'trade',     label: 'Trade Logger', icon: TrendingUp },
  { id: 'coach',     label: 'AI Coach',     icon: Bot },
  { id: 'calendar',  label: 'Calendar',     icon: Calendar },
  { id: 'journal',   label: 'Journal',      icon: BookOpen },
  { id: 'profile',   label: 'Profile',      icon: User },
]

export default function Sidebar({ page, setPage, onLogout }) {
  const username = localStorage.getItem('username') || 'Trader'

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, height: '100%', width: '240px',
      backgroundColor: 'rgba(14, 11, 24, 0.97)',
      backdropFilter: 'blur(20px)',
      display: 'flex', flexDirection: 'column',
      zIndex: 100,
      borderRight: '1px solid rgba(124,58,237,0.4)',
      // Always-on ambient pink/purple glow — bleeds outward into the main content area
      boxShadow: '0 0 50px 4px rgba(124,58,237,0.18), inset -40px 0 60px -50px rgba(124,58,237,0.25)',
    }}>
      {/* Bright glowing line on the right edge — static, always visible */}
      <div style={{
        position: 'absolute', top: 0, right: -1, width: 2, height: '100%',
        background: 'linear-gradient(180deg, transparent 0%, rgba(124,58,237,0.9) 15%, rgba(232,121,249,0.9) 50%, rgba(124,58,237,0.9) 85%, transparent 100%)',
        boxShadow: '0 0 20px 3px rgba(124,58,237,0.6)',
        pointerEvents: 'none',
      }} />

      {/* Soft top glow wash */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 200,
        background: 'radial-gradient(ellipse at top left, rgba(124,58,237,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/logo-64.png"
            alt="BehaviorEdge"
            style={{
              width: 38, height: 38,
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 8px rgba(192,38,211,0.6))',
            }}
          />
          <div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Behavior<span style={{ color: 'var(--accent-light)' }}>Edge</span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 8, fontFamily: 'JetBrains Mono', fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Risk Regulation Platform
        </div>
      </div>

      {/* User Badge */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.58rem', color: 'var(--text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Session</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.75rem', color: 'white',
            boxShadow: '0 0 10px rgba(124,58,237,0.3)',
          }}>
            {username[0].toUpperCase()}
          </div>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>{username}</div>
          <div style={{ marginLeft: 'auto' }}>
            <span className="badge-green">LIVE</span>
          </div>
        </div>
      </div>

      {/* Nav — pill style */}
      <nav style={{ flex: 1, padding: '14px 12px' }}>
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = page === id
          return (
            <button key={id} onClick={() => setPage(id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px', borderRadius: 999, marginBottom: 4,
              background: active ? 'linear-gradient(135deg, #6d28d9, #7c3aed)' : 'transparent',
              border: active ? 'none' : '1px solid transparent',
              color: active ? 'white' : 'var(--text-secondary)',
              fontFamily: 'Hind', fontWeight: active ? 600 : 400, fontSize: '0.875rem',
              cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
              boxShadow: active ? '0 0 20px rgba(124,58,237,0.25)' : 'none',
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; e.currentTarget.style.color = 'var(--accent-light)' }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}}
            >
              <Icon size={15} />
              {label}
              {active && <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.8)', boxShadow: '0 0 6px white' }} />}
            </button>
          )
        })}
      </nav>

      {/* System Status */}
      <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={11} color="var(--green)" />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
            All systems operational
          </span>
        </div>
      </div>

      {/* Logout */}
      <div style={{ padding: '12px' }}>
        <button onClick={onLogout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', borderRadius: 999,
          background: 'transparent', border: '1px solid transparent',
          color: 'var(--text-muted)', fontFamily: 'Hind', fontSize: '0.875rem',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.08)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'transparent' }}
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
