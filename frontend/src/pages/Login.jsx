import { useState, useEffect, useRef } from 'react'
import { login, signup, forgotPassword, verifyOtp, resetPassword } from '../api/client'
import { ElegantShape } from '../components/ElegantShape'
import logo from '../assets/behavioredge-logo.png'

export default function Login({ onLogin }) {
  // ── View state machine ────────────────────────
  // 'login' | 'signup' | 'forgot' | 'verify-otp' | 'reset-password' | 'success'
  const [view, setView] = useState('login')

  // ── Auth form state ───────────────────────────
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // ── Forgot-password flow state ────────────────
  const [forgotEmail, setForgotEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otpCooldown, setOtpCooldown] = useState(0)
  const cooldownRef = useRef(null)

  // ── OTP resend cooldown timer ─────────────────
  useEffect(() => {
    if (otpCooldown <= 0) {
      clearInterval(cooldownRef.current)
      return
    }
    cooldownRef.current = setInterval(() => {
      setOtpCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(cooldownRef.current)
  }, [otpCooldown])

  // ── Success auto-redirect ─────────────────────
  useEffect(() => {
    if (view !== 'success') return
    const timer = setTimeout(() => {
      resetForgotState()
      setView('login')
    }, 2500)
    return () => clearTimeout(timer)
  }, [view])

  // ── Helpers ───────────────────────────────────
  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const resetForgotState = () => {
    setForgotEmail('')
    setOtp('')
    setResetToken('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setOtpCooldown(0)
  }

  const switchView = (v) => {
    setError('')
    setView(v)
  }

  // ── Auth handlers ─────────────────────────────
  const submitAuth = async () => {
    setError('')
    setLoading(true)
    try {
      const isSignup = view === 'signup'
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

  // ── Forgot-password handlers ──────────────────
  const handleForgotSubmit = async () => {
    setError('')
    if (!forgotEmail.trim()) { setError('Please enter your email'); return }
    setLoading(true)
    try {
      await forgotPassword({ email: forgotEmail.trim() })
      setOtpCooldown(60)
      switchView('verify-otp')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP')
    }
    setLoading(false)
  }

  const handleResendOtp = async () => {
    if (otpCooldown > 0) return
    setError('')
    setLoading(true)
    try {
      await forgotPassword({ email: forgotEmail.trim() })
      setOtpCooldown(60)
      setOtp('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend OTP')
    }
    setLoading(false)
  }

  const handleVerifyOtp = async () => {
    setError('')
    if (!otp.trim() || otp.trim().length !== 6) { setError('Please enter a valid 6-digit OTP'); return }
    setLoading(true)
    try {
      const res = await verifyOtp({ email: forgotEmail.trim(), otp: otp.trim() })
      setResetToken(res.data.reset_token)
      switchView('reset-password')
    } catch (err) {
      setError(err.response?.data?.detail || 'OTP verification failed')
    }
    setLoading(false)
  }

  const handleResetPassword = async () => {
    setError('')
    if (!newPassword) { setError('Please enter a new password'); return }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await resetPassword({ reset_token: resetToken, new_password: newPassword })
      switchView('success')
    } catch (err) {
      setError(err.response?.data?.detail || 'Password reset failed')
    }
    setLoading(false)
  }

  // ── Shared styles ─────────────────────────────
  const labelStyle = { marginBottom: 6 }
  const backLinkStyle = {
    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem',
    color: 'var(--accent-light)', cursor: 'pointer',
    border: 'none', background: 'none', padding: 0,
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
  }
  const stepTitleStyle = {
    fontFamily: "'Inter', sans-serif", fontSize: '1.1rem', fontWeight: 700,
    color: 'var(--text-primary)', margin: '0 0 4px 0', textAlign: 'center',
  }
  const stepDescStyle = {
    fontFamily: "'Inter', sans-serif", fontSize: '0.8rem',
    color: 'var(--text-secondary)', margin: '0 0 20px 0', textAlign: 'center', lineHeight: 1.5,
  }

  // ── Determine card title for login/signup tabs ─
  const showAuthTabs = view === 'login' || view === 'signup'

  // ── Render ────────────────────────────────────
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
            {/* Outer soft glow — static radial glow only (no pulsing border) */}
            <div style={{
              position: 'absolute',
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(192,38,211,0.12) 0%, rgba(124,58,237,0.07) 50%, transparent 72%)',
              pointerEvents: 'none',
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
            fontFamily: "'Instrument Serif', Georgia, serif",
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
            fontFamily: "'Inter', sans-serif", fontSize: '0.82rem',
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

          {/* ═══════════════════════════════════════ */}
          {/* LOGIN / SIGNUP TABS                    */}
          {/* ═══════════════════════════════════════ */}
          {showAuthTabs && (
            <>
              {/* Tab Toggle — pill style */}
              <div style={{
                display: 'flex', background: 'var(--bg-base)', borderRadius: 999,
                padding: 3, marginBottom: 24, border: '1px solid var(--border)',
              }}>
                {['Login', 'Sign Up'].map((t, i) => (
                  <button key={t} onClick={() => switchView(i === 0 ? 'login' : 'signup')} style={{
                    flex: 1, padding: '8px', borderRadius: 999, border: 'none', cursor: 'pointer',
                    fontFamily: 'Inter', fontSize: '0.8rem', fontWeight: 600,
                    transition: 'all 0.2s',
                    background: (i === 0 && view === 'login') || (i === 1 && view === 'signup')
                      ? 'linear-gradient(135deg, #6d28d9, #7c3aed)' : 'transparent',
                    color: (i === 0 && view === 'login') || (i === 1 && view === 'signup')
                      ? 'white' : 'var(--text-secondary)',
                    boxShadow: (i === 0 && view === 'login') || (i === 1 && view === 'signup')
                      ? '0 2px 12px rgba(124,58,237,0.3)' : 'none',
                  }}>
                    {t}
                  </button>
                ))}
              </div>

              {/* Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div className="label" style={labelStyle}>Username</div>
                  <input name="username" value={form.username} onChange={handle}
                    className="input-field" placeholder="Enter username"
                    onKeyDown={e => e.key === 'Enter' && submitAuth()} />
                </div>

                {view === 'signup' && (
                  <div>
                    <div className="label" style={labelStyle}>Email</div>
                    <input name="email" value={form.email} onChange={handle}
                      className="input-field" placeholder="Enter email"
                      onKeyDown={e => e.key === 'Enter' && submitAuth()} />
                  </div>
                )}

                <div>
                  <div className="label" style={labelStyle}>Password</div>
                  <input name="password" type="password" value={form.password} onChange={handle}
                    className="input-field" placeholder="Enter password"
                    onKeyDown={e => e.key === 'Enter' && submitAuth()} />
                </div>
              </div>

              {error && (
                <div style={{
                  marginTop: 14, padding: '10px 14px', borderRadius: 10,
                  background: 'var(--red-glow)', border: '1px solid rgba(244,63,94,0.25)',
                  fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: 'var(--red)',
                }}>{error}</div>
              )}

              <button onClick={submitAuth} disabled={loading} className="btn-primary"
                style={{ width: '100%', marginTop: 20, padding: '14px', fontSize: '0.88rem' }}>
                {loading ? 'Authenticating...' : view === 'signup' ? 'Create Account →' : 'Sign In →'}
              </button>

              {/* Forgot Password link — only on login view */}
              {view === 'login' && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button
                    onClick={() => { resetForgotState(); switchView('forgot') }}
                    style={{
                      ...backLinkStyle,
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-light)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* STEP 1 — FORGOT PASSWORD (Enter Email) */}
          {/* ═══════════════════════════════════════ */}
          {view === 'forgot' && (
            <>
              {/* Step indicator */}
              <StepIndicator current={1} />

              <p style={stepTitleStyle}>Forgot Password</p>
              <p style={stepDescStyle}>
                Enter the email address linked to your account and we'll send you a verification code.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div className="label" style={labelStyle}>Email Address</div>
                  <input
                    value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                    className="input-field" placeholder="you@example.com" type="email"
                    onKeyDown={e => e.key === 'Enter' && handleForgotSubmit()}
                    autoFocus
                  />
                </div>
              </div>

              {error && <ErrorBanner message={error} />}

              <button onClick={handleForgotSubmit} disabled={loading} className="btn-primary"
                style={{ width: '100%', marginTop: 20, padding: '14px', fontSize: '0.88rem' }}>
                {loading ? 'Sending OTP…' : 'Send OTP →'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button onClick={() => switchView('login')} style={backLinkStyle}>
                  ← Back to Login
                </button>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* STEP 2 — VERIFY OTP                    */}
          {/* ═══════════════════════════════════════ */}
          {view === 'verify-otp' && (
            <>
              <StepIndicator current={2} />

              <p style={stepTitleStyle}>Verify OTP</p>
              <p style={stepDescStyle}>
                We sent a 6-digit code to <strong style={{ color: 'var(--accent-light)' }}>{forgotEmail}</strong>. Enter it below.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div className="label" style={labelStyle}>Verification Code</div>
                  <input
                    value={otp}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setOtp(val)
                    }}
                    className="input-field"
                    placeholder="000000"
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    style={{
                      textAlign: 'center',
                      letterSpacing: '0.4em',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '1.4rem',
                      fontWeight: 600,
                    }}
                    onKeyDown={e => e.key === 'Enter' && otp.length === 6 && handleVerifyOtp()}
                    autoFocus
                  />
                </div>
              </div>

              {error && <ErrorBanner message={error} />}

              <button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6} className="btn-primary"
                style={{ width: '100%', marginTop: 20, padding: '14px', fontSize: '0.88rem' }}>
                {loading ? 'Verifying…' : 'Verify →'}
              </button>

              {/* Resend & Back row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <button onClick={() => switchView('forgot')} style={backLinkStyle}>
                  ← Back
                </button>
                <button
                  onClick={handleResendOtp}
                  disabled={otpCooldown > 0 || loading}
                  style={{
                    ...backLinkStyle,
                    color: otpCooldown > 0 ? 'var(--text-muted)' : 'var(--accent-light)',
                    opacity: otpCooldown > 0 ? 0.5 : 1,
                    cursor: otpCooldown > 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* STEP 3 — RESET PASSWORD                */}
          {/* ═══════════════════════════════════════ */}
          {view === 'reset-password' && (
            <>
              <StepIndicator current={3} />

              <p style={stepTitleStyle}>Set New Password</p>
              <p style={stepDescStyle}>
                Choose a strong new password for your account.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div className="label" style={labelStyle}>New Password</div>
                  <input
                    type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className="input-field" placeholder="At least 6 characters"
                    onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                    autoFocus
                  />
                </div>
                <div>
                  <div className="label" style={labelStyle}>Confirm Password</div>
                  <input
                    type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="input-field" placeholder="Re-enter your password"
                    onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                  />
                </div>
              </div>

              {error && <ErrorBanner message={error} />}

              <button onClick={handleResetPassword} disabled={loading} className="btn-primary"
                style={{ width: '100%', marginTop: 20, padding: '14px', fontSize: '0.88rem' }}>
                {loading ? 'Resetting…' : 'Reset Password →'}
              </button>
            </>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* STEP 4 — SUCCESS                       */}
          {/* ═══════════════════════════════════════ */}
          {view === 'success' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              {/* Animated checkmark */}
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
                background: 'var(--green-glow)',
                border: '2px solid var(--green)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'successPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <p style={{ ...stepTitleStyle, color: 'var(--green)', marginBottom: 8 }}>
                Password Reset Successful!
              </p>
              <p style={{ ...stepDescStyle, marginBottom: 0 }}>
                Your password has been updated. Redirecting to login…
              </p>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontFamily: 'JetBrains Mono', fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: 24, letterSpacing: '0.1em' }}>
          BEHAVIOREDGE © 2026
        </p>
      </div>

      {/* Keyframe for success checkmark pop */}
      <style>{`
        @keyframes successPop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}


/* ─── Sub-components ──────────────────────────── */

/** Compact 3-step progress indicator */
function StepIndicator({ current }) {
  const steps = ['Email', 'Verify', 'Reset']
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 0, marginBottom: 24,
    }}>
      {steps.map((label, i) => {
        const stepNum = i + 1
        const isActive = stepNum === current
        const isDone = stepNum < current
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
            {/* Connector line (before step, skip first) */}
            {i > 0 && (
              <div style={{
                width: 36, height: 2,
                background: isDone ? 'var(--accent)' : 'var(--border)',
                transition: 'background 0.3s',
              }} />
            )}
            {/* Step dot + label */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.3s',
                background: isActive
                  ? 'linear-gradient(135deg, #6d28d9, #7c3aed)'
                  : isDone ? 'var(--accent)' : 'var(--bg-base)',
                border: `1.5px solid ${isActive || isDone ? 'var(--accent)' : 'var(--border)'}`,
                color: isActive || isDone ? '#fff' : 'var(--text-muted)',
                boxShadow: isActive ? '0 0 12px rgba(124,58,237,0.4)' : 'none',
              }}>
                {isDone ? '✓' : stepNum}
              </div>
              <span style={{
                fontSize: '0.6rem', fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: isActive ? 'var(--accent-light)' : isDone ? 'var(--text-secondary)' : 'var(--text-muted)',
                transition: 'color 0.3s',
              }}>
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Reusable error banner */
function ErrorBanner({ message }) {
  return (
    <div style={{
      marginTop: 14, padding: '10px 14px', borderRadius: 10,
      background: 'var(--red-glow)', border: '1px solid rgba(244,63,94,0.25)',
      fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: 'var(--red)',
    }}>
      {message}
    </div>
  )
}
