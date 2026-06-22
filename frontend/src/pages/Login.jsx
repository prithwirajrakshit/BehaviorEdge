import { useState } from 'react'
import { login, signup } from '../api/client'
import { ElegantShape } from '../components/ElegantShape'
import logo from '../assets/behavioredge-logo.png'

export default function Login({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      const res = isSignup
        ? await signup(form)
        : await login({ username: form.username, password: form.password })
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('username', form.username)
      onLogin()
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed')
    }
    setLoading(false)
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ background: 'var(--bg-base)' }}>

      {/* Subtle background gradient wash */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/[0.05] via-transparent to-purple-500/[0.05] blur-3xl" />

      {/* Floating geometric shapes — theme-matched */}
      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-violet-500/[0.15]"
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
        />
        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-purple-500/[0.15]"
          className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
        />
        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-fuchsia-500/[0.12]"
          className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
        />
        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-indigo-400/[0.12]"
          className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
        />
        <ElegantShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          gradient="from-violet-400/[0.10]"
          className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
        />
      </div>

      {/* Top & bottom vignette for depth */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, var(--bg-base) 0%, transparent 20%, transparent 80%, var(--bg-base) 100%)' }} />

      {/* Main content */}
      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 10, padding: 24 }} className="animate-fade-up">

        {/* Header — Premium Branding */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>

          {/* Logo with layered glow backdrop */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            minHeight: 130,
          }}>
            {/* Outer soft glow ring */}
            <div style={{
              position: 'absolute',
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(192,38,211,0.12) 0%, rgba(124,58,237,0.07) 50%, transparent 72%)',
              pointerEvents: 'none',
              animation: 'pulse-glow 4s ease-in-out infinite',
            }} />
            {/* Inner concentrated glow */}
            <div style={{
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(192,38,211,0.20) 0%, rgba(124,58,237,0.12) 55%, transparent 75%)',
              pointerEvents: 'none',
              filter: 'blur(8px)',
            }} />
            <img
              src={logo}
              alt="Behavior Edge"
              style={{
                width: 120,
                height: 'auto',
                objectFit: 'contain',
                display: 'block',
                position: 'relative',
                filter: 'drop-shadow(0 8px 32px rgba(192,38,211,0.5)) drop-shadow(0 2px 12px rgba(124,58,237,0.3))',
              }}
            />
          </div>

          {/* Brand Name — large, gradient, unmissable */}
          <h1 style={{
            fontFamily: "'Khand', sans-serif",
            fontSize: '2rem',
            fontWeight: 700,
            letterSpacing: '0.18em',
            margin: '0 0 6px 0',
            lineHeight: 1.1,
            background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 40%, #a78bfa 65%, #7c3aed 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textTransform: 'uppercase',
          }}>
            Behavior Edge
          </h1>

          {/* Pill badge with shimmer */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(42,178,158,0.08))',
            border: '1px solid rgba(124,58,237,0.22)',
            borderRadius: 999, padding: '5px 18px', marginBottom: 14,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Shimmer sweep */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)',
              backgroundSize: '250% 100%',
              animation: 'shimmer 3.5s ease-in-out infinite',
            }} />
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'var(--accent-light)',
              boxShadow: '0 0 6px var(--accent), 0 0 12px rgba(124,58,237,0.3)',
            }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem',
              color: 'var(--accent-light)', letterSpacing: '0.14em',
              textTransform: 'uppercase', position: 'relative',
            }}>
              Behavioral Risk Regulation
            </span>
          </div>

          {/* Tagline */}
          <p style={{
            fontFamily: "'Hind', sans-serif", fontSize: '0.82rem',
            color: 'var(--text-secondary)', letterSpacing: '0.04em',
            margin: 0, fontWeight: 300,
          }}>
            AI-powered trading psychology platform
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(14, 11, 24, 0.8)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '28px', position: 'relative', overflow: 'hidden',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        }}>
          {/* Top purple accent line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', opacity: 0.6 }} />

          {/* Tab Toggle — pill style */}
          <div style={{
            display: 'flex', background: 'var(--bg-base)', borderRadius: 999,
            padding: 3, marginBottom: 24, border: '1px solid var(--border)',
          }}>
            {['Login', 'Sign Up'].map((t, i) => (
              <button key={t} onClick={() => setIsSignup(i === 1)} style={{
                flex: 1, padding: '8px', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontFamily: 'Space Grotesk', fontSize: '0.8rem', fontWeight: 600,
                transition: 'all 0.2s',
                background: (i === 0 && !isSignup) || (i === 1 && isSignup)
                  ? 'linear-gradient(135deg, #6d28d9, #7c3aed)' : 'transparent',
                color: (i === 0 && !isSignup) || (i === 1 && isSignup)
                  ? 'white' : 'var(--text-secondary)',
                boxShadow: (i === 0 && !isSignup) || (i === 1 && isSignup)
                  ? '0 2px 12px rgba(124,58,237,0.3)' : 'none',
              }}>
                {t}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div className="label" style={{ marginBottom: 6 }}>Username</div>
              <input name="username" value={form.username} onChange={handle}
                className="input-field" placeholder="Enter username"
                onKeyDown={e => e.key === 'Enter' && submit()} />
            </div>

            {isSignup && (
              <div>
                <div className="label" style={{ marginBottom: 6 }}>Email</div>
                <input name="email" value={form.email} onChange={handle}
                  className="input-field" placeholder="Enter email"
                  onKeyDown={e => e.key === 'Enter' && submit()} />
              </div>
            )}

            <div>
              <div className="label" style={{ marginBottom: 6 }}>Password</div>
              <input name="password" type="password" value={form.password} onChange={handle}
                className="input-field" placeholder="Enter password"
                onKeyDown={e => e.key === 'Enter' && submit()} />
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: 14, padding: '10px 14px', borderRadius: 10,
              background: 'var(--red-glow)', border: '1px solid rgba(244,63,94,0.25)',
              fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: 'var(--red)',
            }}>{error}</div>
          )}

          <button onClick={submit} disabled={loading} className="btn-primary"
            style={{ width: '100%', marginTop: 20, padding: '14px', fontSize: '0.88rem' }}>
            {loading ? 'Authenticating...' : isSignup ? 'Create Account →' : 'Sign In →'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontFamily: 'JetBrains Mono', fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: 24, letterSpacing: '0.1em' }}>
          BEHAVIOREDGE © 2026
        </p>
      </div>
    </div>
  )
}
