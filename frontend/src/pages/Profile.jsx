import { useState, useEffect, useRef } from 'react'
import {
  getProfile, saveProfile, getRules, addRule, updateRule, deleteRule,
  getMe, updateMe, changePassword, uploadAvatar, deleteAvatar
} from '../api/client'
import {
  Save, DollarSign, Percent, TrendingUp, CheckCircle, Plus, Trash2,
  Pencil, X, Shield, Camera, User, Mail, MapPin, Globe, Twitter,
  Lock, Eye, EyeOff, AlertCircle, BarChart2
} from 'lucide-react'
import { GlowCard } from '../components/GlowCard'

const STYLES = ['Scalping', 'Day Trading', 'Swing Trading', 'Position Trading']
const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional']
const TABS = ['Identity', 'Risk Settings', 'Trading Rules', 'Security']

export default function Profile() {
  const [activeTab, setActiveTab] = useState('Identity')
  const [loading, setLoading] = useState(true)

  // Identity state
  const [me, setMe] = useState(null)
  const [identity, setIdentity] = useState({ full_name: '', bio: '', location: '', website: '', twitter: '', experience_level: 'Intermediate', email: '' })
  const [identitySaving, setIdentitySaving] = useState(false)
  const [identitySaved, setIdentitySaved] = useState(false)
  const [identityError, setIdentityError] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarRef = useRef(null)

  // Risk state
  const [form, setForm] = useState({ capital: 10000, risk_percent: 1.0, daily_max_loss: 300, trading_style: 'Day Trading' })
  const [riskSaving, setRiskSaving] = useState(false)
  const [riskSaved, setRiskSaved] = useState(false)
  const [riskError, setRiskError] = useState('')

  // Rules state
  const [rules, setRules] = useState([])
  const [newRule, setNewRule] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [addingRule, setAddingRule] = useState(false)

  // Password state
  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' })
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwResult, setPwResult] = useState(null)

  const username = localStorage.getItem('username') || 'Trader'
  const plannedRisk = (form.capital * form.risk_percent / 100).toFixed(2)

  useEffect(() => {
    Promise.all([getProfile(), getRules(), getMe()]).then(([p, r, m]) => {
      setForm(p.data)
      setRules(r.data)
      setMe(m.data)
      setIdentity({
        full_name: m.data.full_name || '',
        bio: m.data.bio || '',
        location: m.data.location || '',
        website: m.data.website || '',
        twitter: m.data.twitter || '',
        experience_level: m.data.experience_level || 'Intermediate',
        email: m.data.email || '',
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // ── Identity ──
  const saveIdentity = async () => {
    setIdentityError(''); setIdentitySaving(true); setIdentitySaved(false)
    try {
      const res = await updateMe(identity)
      setMe(res.data)
      setIdentitySaved(true)
      setTimeout(() => setIdentitySaved(false), 3000)
    } catch (e) { setIdentityError(e.response?.data?.detail || 'Failed to save') }
    setIdentitySaving(false)
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await uploadAvatar(fd)
      setMe(res.data)
    } catch (e) { setIdentityError('Avatar upload failed') }
    setAvatarUploading(false)
  }

  const handleDeleteAvatar = async () => {
    try {
      const res = await deleteAvatar()
      setMe(res.data)
    } catch {}
  }

  // ── Risk ──
  const handleRisk = (e) => setForm({ ...form, [e.target.name]: e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value })

  const saveRisk = async () => {
    setRiskError(''); setRiskSaving(true); setRiskSaved(false)
    try {
      await saveProfile(form)
      setRiskSaved(true)
      setTimeout(() => setRiskSaved(false), 3000)
    } catch (e) { setRiskError(e.response?.data?.detail || 'Failed to save') }
    setRiskSaving(false)
  }

  // ── Rules ──
  const handleAddRule = async () => {
    if (!newRule.trim()) return
    setAddingRule(true)
    try { const res = await addRule({ rule_text: newRule.trim() }); setRules(p => [...p, res.data]); setNewRule('') } catch {}
    setAddingRule(false)
  }
  const handleEditSave = async (id) => {
    if (!editText.trim()) return
    try { const res = await updateRule(id, { rule_text: editText.trim() }); setRules(p => p.map(r => r.id === id ? res.data : r)); setEditingId(null) } catch {}
  }
  const handleDelete = async (id) => {
    try { await deleteRule(id); setRules(p => p.filter(r => r.id !== id)) } catch {}
  }

  // ── Password ──
  const handlePwChange = async () => {
    if (pw.new_password !== pw.confirm) { setPwResult({ ok: false, msg: 'New passwords do not match' }); return }
    if (pw.new_password.length < 6) { setPwResult({ ok: false, msg: 'Password must be at least 6 characters' }); return }
    setPwSaving(true); setPwResult(null)
    try {
      await changePassword({ current_password: pw.current_password, new_password: pw.new_password })
      setPwResult({ ok: true, msg: 'Password changed successfully' })
      setPw({ current_password: '', new_password: '', confirm: '' })
    } catch (e) { setPwResult({ ok: false, msg: e.response?.data?.detail || 'Failed to change password' }) }
    setPwSaving(false)
  }

  // ── Helpers ──
  const avatarSrc = me?.avatar_url ? `http://127.0.0.1:8000${me.avatar_url}` : null
  const initials = (me?.full_name || username).split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div className="label">Loading profile...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth: '100%' }}>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Khand', fontWeight: 700, fontSize: '1.75rem', color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
          Trader Profile
        </h2>
      </div>

      {/* Profile Hero Card */}
      <GlowCard glowColor="purple" className="animate-fade-up stagger-1" style={{ padding: '28px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>

          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: avatarSrc ? 'transparent' : 'linear-gradient(135deg, #6d28d9, #c026d3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', fontFamily: 'Khand', fontWeight: 700, color: 'white',
              boxShadow: '0 0 24px rgba(192,38,211,0.35)',
              overflow: 'hidden', border: '2px solid rgba(124,58,237,0.4)',
            }}>
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials
              }
            </div>
            {/* Upload button */}
            <button
              onClick={() => avatarRef.current?.click()}
              disabled={avatarUploading}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6d28d9, #c026d3)',
                border: '2px solid var(--bg-card)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 0 8px rgba(192,38,211,0.4)',
              }}>
              <Camera size={13} color="white" />
            </button>
            <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          </div>

          {/* Identity info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ fontFamily: 'Khand', fontWeight: 700, fontSize: '1.4rem', color: 'var(--text-primary)' }}>
                {me?.full_name || username}
              </div>
              <span className="badge-green">PRO</span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: 'var(--accent-light)', marginBottom: 8 }}>@{username}</div>
            {me?.bio && <div style={{ fontFamily: 'Hind', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>{me.bio}</div>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {me?.location && <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} />{me.location}</span>}
              {me?.experience_level && <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}><BarChart2 size={10} />{me.experience_level}</span>}
              {me?.website && <a href={me.website} target="_blank" rel="noreferrer" style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}><Globe size={10} />{me.website.replace(/^https?:\/\//, '')}</a>}
              {me?.twitter && <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: 4 }}><Twitter size={10} />@{me.twitter}</span>}
            </div>
          </div>

          {/* Stats mini */}
          <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
            {[
              { label: 'Member since', value: me?.created_at ? new Date(me.created_at).getFullYear() : '—' },
              { label: 'Trading rules', value: rules.length },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div className="metric-num" style={{ fontSize: '1.4rem', color: 'var(--accent-light)' }}>{value}</div>
                <div className="label" style={{ fontSize: '0.58rem', marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Avatar actions */}
        {avatarSrc && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={() => avatarRef.current?.click()} style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'var(--accent-light)', background: 'var(--accent-dim)', border: '1px solid rgba(124,58,237,0.25)', padding: '5px 12px', borderRadius: 999, cursor: 'pointer' }}>
              Change photo
            </button>
            <button onClick={handleDeleteAvatar} style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'var(--red)', background: 'var(--red-glow)', border: '1px solid rgba(244,63,94,0.2)', padding: '5px 12px', borderRadius: 999, cursor: 'pointer' }}>
              Remove photo
            </button>
          </div>
        )}
        {avatarUploading && <div className="label" style={{ marginTop: 8 }}>Uploading...</div>}
      </GlowCard>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 4 }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '9px', borderRadius: 8, cursor: 'pointer',
            fontFamily: 'JetBrains Mono', fontSize: '0.7rem', letterSpacing: '0.04em',
            transition: 'all 0.15s',
            background: activeTab === tab ? 'linear-gradient(135deg, #6d28d9, #7c3aed)' : 'transparent',
            border: 'none',
            color: activeTab === tab ? 'white' : 'var(--text-secondary)',
            boxShadow: activeTab === tab ? '0 2px 12px rgba(124,58,237,0.3)' : 'none',
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── IDENTITY TAB ── */}
      {activeTab === 'Identity' && (
        <GlowCard glowColor="purple" className="animate-fade-up" style={{ padding: 24 }}>
          <div className="label" style={{ marginBottom: 20 }}>Personal Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            <div>
              <div className="label" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><User size={10} /> Full Name</div>
              <input value={identity.full_name} onChange={e => setIdentity(p => ({ ...p, full_name: e.target.value }))} className="input-field" placeholder="Your full name" />
            </div>

            <div>
              <div className="label" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={10} /> Email</div>
              <input value={identity.email} onChange={e => setIdentity(p => ({ ...p, email: e.target.value }))} className="input-field" placeholder="your@email.com" type="email" />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div className="label" style={{ marginBottom: 6 }}>Bio</div>
              <textarea
                value={identity.bio}
                onChange={e => setIdentity(p => ({ ...p, bio: e.target.value }))}
                placeholder="Tell others about your trading background..."
                rows={3}
                style={{
                  width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '12px 16px', color: 'var(--text-primary)',
                  fontFamily: 'Hind', fontSize: '0.875rem', outline: 'none', resize: 'vertical',
                  transition: 'border-color 0.2s', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div>
              <div className="label" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={10} /> Location</div>
              <input value={identity.location} onChange={e => setIdentity(p => ({ ...p, location: e.target.value }))} className="input-field" placeholder="City, Country" />
            </div>

            <div>
              <div className="label" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><BarChart2 size={10} /> Experience Level</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {EXPERIENCE_LEVELS.map(lvl => (
                  <button key={lvl} onClick={() => setIdentity(p => ({ ...p, experience_level: lvl }))} style={{
                    padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                    fontFamily: 'JetBrains Mono', fontSize: '0.6rem', transition: 'all 0.15s',
                    background: identity.experience_level === lvl ? 'var(--accent-dim)' : 'var(--bg-base)',
                    border: `1px solid ${identity.experience_level === lvl ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
                    color: identity.experience_level === lvl ? 'var(--accent-light)' : 'var(--text-secondary)',
                  }}>{lvl}</button>
                ))}
              </div>
            </div>

            <div>
              <div className="label" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><Globe size={10} /> Website</div>
              <input value={identity.website} onChange={e => setIdentity(p => ({ ...p, website: e.target.value }))} className="input-field" placeholder="https://yoursite.com" />
            </div>

            <div>
              <div className="label" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><Twitter size={10} /> Twitter / X</div>
              <input value={identity.twitter} onChange={e => setIdentity(p => ({ ...p, twitter: e.target.value }))} className="input-field" placeholder="username (no @)" />
            </div>
          </div>

          {identityError && <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'var(--red-glow)', border: '1px solid rgba(244,63,94,0.25)', fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--red)' }}>{identityError}</div>}

          <button onClick={saveIdentity} disabled={identitySaving} className="btn-primary" style={{ marginTop: 20, padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 8 }}>
            {identitySaved ? <><CheckCircle size={14} /> Saved!</> : identitySaving ? 'Saving...' : <><Save size={14} /> Save Changes</>}
          </button>
        </GlowCard>
      )}

      {/* ── RISK SETTINGS TAB ── */}
      {activeTab === 'Risk Settings' && (
        <GlowCard glowColor="purple" className="animate-fade-up" style={{ padding: 24 }}>

          {/* Live risk preview */}
          <div style={{ padding: '14px 18px', marginBottom: 20, background: 'var(--accent-dim)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 24 }}>
            <div>
              <div className="label" style={{ fontSize: '0.58rem', marginBottom: 3 }}>Planned Risk Per Trade</div>
              <div className="metric-num" style={{ fontSize: '1.4rem', color: 'var(--accent-light)' }}>${plannedRisk}</div>
            </div>
            <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              {form.capital.toLocaleString()} × {form.risk_percent}% = <span style={{ color: 'var(--accent-light)' }}>${plannedRisk}</span>
            </div>
          </div>

          <div className="label" style={{ marginBottom: 16 }}>Risk Parameters</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div>
              <div className="label" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><DollarSign size={10} /> Capital ($)</div>
              <input name="capital" type="number" value={form.capital} onChange={handleRisk} className="input-field" min={0} step={500} />
            </div>
            <div>
              <div className="label" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><Percent size={10} /> Risk Per Trade (%)</div>
              <input name="risk_percent" type="number" value={form.risk_percent} onChange={handleRisk} className="input-field" min={0.1} max={10} step={0.1} />
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ height: 3, flex: 1, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, transition: 'all 0.3s', width: `${Math.min(form.risk_percent * 10, 100)}%`, background: form.risk_percent <= 1 ? 'var(--green)' : form.risk_percent <= 2 ? 'var(--amber)' : 'var(--red)' }} />
                </div>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: form.risk_percent <= 1 ? 'var(--green)' : form.risk_percent <= 2 ? 'var(--amber)' : 'var(--red)' }}>
                  {form.risk_percent <= 1 ? 'LOW' : form.risk_percent <= 2 ? 'MODERATE' : 'HIGH'}
                </span>
              </div>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><DollarSign size={10} /> Max Daily Loss ($)</div>
              <input name="daily_max_loss" type="number" value={form.daily_max_loss} onChange={handleRisk} className="input-field" min={0} step={50} />
            </div>
            <div>
              <div className="label" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><TrendingUp size={10} /> Trading Style</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {STYLES.map(s => (
                  <button key={s} type="button" onClick={() => setForm(f => ({ ...f, trading_style: s }))} style={{
                    padding: '9px 6px', borderRadius: 8, cursor: 'pointer',
                    fontFamily: 'JetBrains Mono', fontSize: '0.65rem', transition: 'all 0.15s',
                    background: form.trading_style === s ? 'var(--accent-dim)' : 'var(--bg-base)',
                    border: `1px solid ${form.trading_style === s ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
                    color: form.trading_style === s ? 'var(--accent-light)' : 'var(--text-secondary)',
                  }}>{s}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Risk summary */}
          <div style={{ marginTop: 20, padding: '14px 16px', background: 'var(--bg-base)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div className="label" style={{ marginBottom: 10, fontSize: '0.6rem' }}>Risk Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Per Trade Risk', value: `$${plannedRisk}`, color: 'var(--accent-light)' },
                { label: 'Daily Loss Limit', value: `$${form.daily_max_loss}`, color: 'var(--amber)' },
                { label: 'Max Daily Trades', value: Math.floor(form.daily_max_loss / parseFloat(plannedRisk)) || '∞', color: 'var(--green)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div className="metric-num" style={{ fontSize: '1.1rem', color }}>{value}</div>
                  <div className="label" style={{ fontSize: '0.58rem', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {riskError && <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'var(--red-glow)', border: '1px solid rgba(244,63,94,0.25)', fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--red)' }}>{riskError}</div>}

          <button onClick={saveRisk} disabled={riskSaving} className="btn-primary" style={{ marginTop: 20, padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 8 }}>
            {riskSaved ? <><CheckCircle size={14} /> Saved!</> : riskSaving ? 'Saving...' : <><Save size={14} /> Save Risk Settings</>}
          </button>
        </GlowCard>
      )}

      {/* ── TRADING RULES TAB ── */}
      {activeTab === 'Trading Rules' && (
        <GlowCard glowColor="purple" className="animate-fade-up" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={14} color="var(--green)" />
              </div>
              <div>
                <div style={{ fontFamily: 'Hind', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Trading Rules</div>
                <div className="label" style={{ fontSize: '0.58rem', marginTop: 1 }}>{rules.length} rule{rules.length !== 1 ? 's' : ''} defined</div>
              </div>
            </div>
            <span className={rules.length > 0 ? 'badge-green' : 'badge-amber'}>{rules.length > 0 ? 'ACTIVE' : 'EMPTY'}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {rules.length === 0 && (
              <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', fontSize: '0.75rem' }}>
                No rules yet — add your first trading rule below
              </div>
            )}
            {rules.map((rule, i) => (
              <div key={rule.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 10 }}>
                <div style={{ minWidth: 22, height: 22, borderRadius: 6, marginTop: 1, background: 'var(--accent-dim)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: 'var(--accent-light)', fontWeight: 700 }}>
                  {i + 1}
                </div>
                {editingId === rule.id ? (
                  <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                    <input value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleEditSave(rule.id); if (e.key === 'Escape') setEditingId(null) }} className="input-field" style={{ flex: 1, padding: '6px 12px', fontSize: '0.82rem' }} autoFocus />
                    <button onClick={() => handleEditSave(rule.id)} style={{ padding: '6px 12px', borderRadius: 7, cursor: 'pointer', border: 'none', background: 'var(--green-glow)', color: 'var(--green)', fontFamily: 'JetBrains Mono', fontSize: '0.7rem' }}>Save</button>
                    <button onClick={() => setEditingId(null)} style={{ padding: '6px 8px', borderRadius: 7, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)' }}><X size={12} /></button>
                  </div>
                ) : (
                  <>
                    <span style={{ flex: 1, fontFamily: 'Hind', fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5, paddingTop: 2 }}>{rule.rule_text}</span>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => { setEditingId(rule.id); setEditText(rule.rule_text) }} style={{ width: 28, height: 28, borderRadius: 7, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; e.currentTarget.style.color = 'var(--accent-light)'; e.currentTarget.style.background = 'var(--accent-dim)' }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent' }}><Pencil size={11} /></button>
                      <button onClick={() => handleDelete(rule.id)} style={{ width: 28, height: 28, borderRadius: 7, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'var(--red-glow)' }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent' }}><Trash2 size={11} /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newRule} onChange={e => setNewRule(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddRule()} placeholder="e.g. Never risk more than 1% per trade" className="input-field" style={{ flex: 1 }} />
            <button onClick={handleAddRule} disabled={addingRule || !newRule.trim()} className="btn-primary" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              <Plus size={14} /> Add Rule
            </button>
          </div>
        </GlowCard>
      )}

      {/* ── SECURITY TAB ── */}
      {activeTab === 'Security' && (
        <GlowCard glowColor="purple" className="animate-fade-up" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={14} color="var(--accent-light)" />
            </div>
            <div>
              <div style={{ fontFamily: 'Hind', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Change Password</div>
              <div className="label" style={{ fontSize: '0.58rem', marginTop: 1 }}>Minimum 6 characters</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 480 }}>
            {[
              { label: 'Current Password', key: 'current_password', show: 'current' },
              { label: 'New Password', key: 'new_password', show: 'new' },
              { label: 'Confirm New Password', key: 'confirm', show: 'confirm' },
            ].map(({ label, key, show }) => (
              <div key={key}>
                <div className="label" style={{ marginBottom: 6 }}>{label}</div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw[show] ? 'text' : 'password'}
                    value={pw[key]}
                    onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                    className="input-field"
                    style={{ paddingRight: 44 }}
                    placeholder="••••••••"
                  />
                  <button
                    onClick={() => setShowPw(p => ({ ...p, [show]: !p[show] }))}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                    {showPw[show] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {key === 'confirm' && pw.confirm && pw.new_password !== pw.confirm && (
                  <div style={{ marginTop: 4, fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={10} /> Passwords do not match
                  </div>
                )}
              </div>
            ))}
          </div>

          {pwResult && (
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: pwResult.ok ? 'var(--green-glow)' : 'var(--red-glow)', border: `1px solid ${pwResult.ok ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`, fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: pwResult.ok ? 'var(--green)' : 'var(--red)' }}>
              {pwResult.ok ? '✅ ' : '⚠️ '}{pwResult.msg}
            </div>
          )}

          <button
            onClick={handlePwChange}
            disabled={pwSaving || !pw.current_password || !pw.new_password || pw.new_password !== pw.confirm}
            className="btn-primary"
            style={{ marginTop: 20, padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 8 }}>
            {pwSaving ? 'Changing...' : <><Lock size={14} /> Change Password</>}
          </button>

          {/* Account info */}
          <div style={{ marginTop: 32, padding: '14px 16px', background: 'var(--bg-base)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div className="label" style={{ marginBottom: 12, fontSize: '0.6rem' }}>Account Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Username', value: `@${username}` },
                { label: 'Email', value: me?.email || '—' },
                { label: 'Account Created', value: me?.created_at ? new Date(me.created_at).toLocaleDateString() : '—' },
                { label: 'Account Type', value: 'PRO Trader' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="label" style={{ fontSize: '0.58rem', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </GlowCard>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
