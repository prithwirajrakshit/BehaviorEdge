import { useState, useEffect } from 'react'
import { logTrade, getProfile, getRules, preTradeCheck } from '../api/client'
import { CheckCircle, AlertTriangle, TrendingUp, TrendingDown, ShieldCheck, ShieldX, Brain, Lock, Unlock } from 'lucide-react'
import { GlowCard } from '../components/GlowCard'

const EMOTIONS = ['Calm', 'Neutral', 'Anxious', 'Fear', 'Frustrated', 'Overconfident', 'Angry', 'Euphoric']
const EMOTION_RISK = { Calm: 'green', Neutral: 'accent', Anxious: 'amber', Fear: 'amber', Frustrated: 'red', Overconfident: 'red', Angry: 'red', Euphoric: 'red' }
const EMOTION_RISK_LABEL = { Calm: 'LOW', Neutral: 'LOW', Anxious: 'MEDIUM', Fear: 'MEDIUM', Frustrated: 'HIGH', Overconfident: 'HIGH', Angry: 'VERY HIGH', Euphoric: 'VERY HIGH' }

export default function TradeLogger() {
  const [profile, setProfile] = useState(null)
  const [rules, setRules] = useState([])

  // Pre-trade gate state
  const [gateCleared, setGateCleared] = useState(false)
  const [gateResult, setGateResult] = useState(null)
  const [gateLoading, setGateLoading] = useState(false)
  const [preForm, setPreForm] = useState({
    emotion: 'Calm',
    confidence: 7,
    revenge_urge: false,
    setup_validated: false,
  })
  const [checkedRules, setCheckedRules] = useState({})

  // Trade logger state
  const [outcome, setOutcome] = useState('Win')
  const [form, setForm] = useState({ actual_risk: 0, emotion_before: 'Calm', emotion_after: 'Calm', rule_followed: true, pnl_amount: 0 })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getProfile(), getRules()]).then(([p, r]) => {
      setProfile(p.data)
      setRules(r.data)
      setForm(f => ({ ...f, actual_risk: p.data.capital * p.data.risk_percent / 100 }))
    })
  }, [])

  // All rules checked?
  const allRulesChecked = rules.length === 0 || rules.every(r => checkedRules[r.id])

  const handleGateSubmit = async () => {
    setGateLoading(true)
    setGateResult(null)
    try {
      const res = await preTradeCheck({
        emotion: preForm.emotion,
        confidence: preForm.confidence,
        revenge_urge: preForm.revenge_urge,
        setup_validated: allRulesChecked && preForm.setup_validated,
      })
      setGateResult(res.data)
      if (res.data.approved) {
        setGateCleared(true)
        setForm(f => ({ ...f, emotion_before: preForm.emotion }))
      }
    } catch (e) {
      const errMsg = e.response?.data?.detail || e.message || 'Server error — please try again';
      setGateResult({ approved: false, block_reasons: [errMsg], ai_assessment: '' })
    }
    setGateLoading(false)
  }

  const handleTrade = async () => {
    setError(''); setLoading(true); setResult(null)
    try {
      const planned_risk = profile ? profile.capital * profile.risk_percent / 100 : 0
      const signed_pnl = outcome === 'Win' ? parseFloat(form.pnl_amount) : -parseFloat(form.pnl_amount)

      const res = await logTrade({
        capital: profile?.capital || 0,
        risk_percent: profile?.risk_percent || 0,
        planned_risk,
        actual_risk: parseFloat(form.actual_risk),
        emotion_before: form.emotion_before,
        emotion_after: form.emotion_after,
        rule_followed: form.rule_followed,
        outcome: outcome.toLowerCase(),
        pnl_amount: signed_pnl,
        rdi: 0, evi: 0, discipline_score: 0,
        daily_loss: outcome === 'Loss' ? parseFloat(form.actual_risk) : 0,
        violations: '[]',
        pre_trade_approved: true,
      })

      const violations = JSON.parse(res.data.violations || '[]')
      setResult({ ...res.data, signed_pnl, violations })
      setGateCleared(false)
      setGateResult(null)
      setCheckedRules({})
      setPreForm({ emotion: 'Calm', confidence: 7, revenge_urge: false, setup_validated: false })
    } catch (e) { setError(e.response?.data?.detail || 'Failed to log trade') }
    setLoading(false)
  }

  const planned = profile ? (profile.capital * profile.risk_percent / 100).toFixed(2) : '0.00'

  return (
    <div style={{ maxWidth: '100%' }}>

      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 500, fontSize: '2.2rem', color: 'var(--text-primary)', letterSpacing: '0.02em', margin: 0 }}>
            Trade Logger
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {gateCleared
              ? <><Unlock size={14} color="var(--green)" /><span className="badge-green">GATE CLEARED</span></>
              : <><Lock size={14} color="var(--amber)" /><span className="badge-amber">GATE REQUIRED</span></>
            }
          </div>
        </div>
      </div>

      {/* ── PRE-TRADE PSYCHOLOGICAL GATE ── */}
      {!gateCleared && (
        <GlowCard glowColor={gateResult?.approved === false ? "red" : "purple"} className="animate-fade-up stagger-1" style={{ padding: 24, marginBottom: 16, borderColor: gateResult?.approved === false ? 'rgba(244,63,94,0.25)' : 'var(--border)' }}>

          {/* Gate header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={16} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>Pre-Trade Psychological Gate</div>
              <div className="label" style={{ fontSize: '0.58rem', marginTop: 1 }}>Complete this before every trade — Module 2</div>
            </div>
          </div>

          {/* Rules checklist */}
          {rules.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="label" style={{ marginBottom: 10 }}>📋 Rule Verification — check each rule you have satisfied</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rules.map((rule, i) => (
                  <div key={rule.id} onClick={() => setCheckedRules(prev => ({ ...prev, [rule.id]: !prev[rule.id] }))}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: checkedRules[rule.id] ? 'rgba(16,185,129,0.05)' : 'var(--bg-base)', border: `1px solid ${checkedRules[rule.id] ? 'rgba(16,185,129,0.25)' : 'var(--border-bright)'}`, borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${checkedRules[rule.id] ? 'var(--green)' : 'var(--text-muted)'}`, background: checkedRules[rule.id] ? 'var(--green-glow)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                      {checkedRules[rule.id] && <CheckCircle size={11} color="var(--green)" />}
                    </div>
                    <span style={{ fontFamily: 'Inter', fontSize: '0.82rem', color: checkedRules[rule.id] ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono', fontSize: '0.65rem', marginRight: 6 }}>{i + 1}</span>
                      {rule.rule_text}
                    </span>
                  </div>
                ))}
              </div>
              {!allRulesChecked && (
                <div style={{ marginTop: 8, fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'var(--amber)' }}>
                  ⚠️ Check all rules before proceeding
                </div>
              )}
            </div>
          )}

          {/* Gate form */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

            {/* Emotion */}
            <div>
              <div className="label" style={{ marginBottom: 6 }}>Current Emotional State</div>
              <div style={{ position: 'relative' }}>
                <select value={preForm.emotion} onChange={e => setPreForm(p => ({ ...p, emotion: e.target.value }))}
                  className="input-field" style={{ appearance: 'none', cursor: 'pointer' }}>
                  {EMOTIONS.map(e => <option key={e}>{e}</option>)}
                </select>
                <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.58rem', color: `var(--${EMOTION_RISK[preForm.emotion]})` }}>{EMOTION_RISK_LABEL[preForm.emotion]}</span>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: `var(--${EMOTION_RISK[preForm.emotion]})`, boxShadow: `0 0 6px var(--${EMOTION_RISK[preForm.emotion]})` }} />
                </div>
              </div>
            </div>

            {/* Confidence slider */}
            <div>
              <div className="label" style={{ marginBottom: 6 }}>Setup Confidence — <span style={{ color: preForm.confidence >= 7 ? 'var(--green)' : preForm.confidence >= 4 ? 'var(--amber)' : 'var(--red)' }}>{preForm.confidence}/10</span></div>
              <input type="range" min={1} max={10} value={preForm.confidence}
                onChange={e => setPreForm(p => ({ ...p, confidence: parseInt(e.target.value) }))}
                style={{ width: '100%', accentColor: preForm.confidence >= 7 ? 'var(--green)' : preForm.confidence >= 4 ? 'var(--amber)' : 'var(--red)', cursor: 'pointer', marginTop: 8 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono', fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: 2 }}>
                <span>Low</span><span>Medium</span><span>High</span>
              </div>
            </div>
          </div>

          {/* Yes/No questions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Trading to recover a recent loss?', key: 'revenge_urge', danger: true },
              { label: 'Setup meets all entry criteria?', key: 'setup_validated', danger: false },
            ].map(({ label, key, danger }) => (
              <div key={key}>
                <div className="label" style={{ marginBottom: 8 }}>{label}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Yes', 'No'].map(opt => {
                    const isYes = opt === 'Yes'
                    const isSelected = preForm[key] === isYes
                    const isGood = (danger && !isYes) || (!danger && isYes)
                    return (
                      <button key={opt} onClick={() => setPreForm(p => ({ ...p, [key]: isYes }))} style={{
                        flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer',
                        fontFamily: 'JetBrains Mono', fontSize: '0.72rem', transition: 'all 0.15s',
                        background: isSelected ? (isGood ? 'var(--green-glow)' : 'var(--red-glow)') : 'var(--bg-base)',
                        border: `1px solid ${isSelected ? (isGood ? 'rgba(16,185,129,0.4)' : 'rgba(244,63,94,0.4)') : 'var(--border)'}`,
                        color: isSelected ? (isGood ? 'var(--green)' : 'var(--red)') : 'var(--text-secondary)',
                      }}>{opt}</button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Run check button */}
          <button onClick={handleGateSubmit} disabled={gateLoading} className="btn-primary"
            style={{ width: '100%', padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Brain size={15} />
            {gateLoading ? 'Analyzing psychological state...' : 'Run Pre-Trade Psychological Check'}
          </button>

          {/* Gate result */}
          {gateResult && (
            <div style={{ marginTop: 16 }}>
              {/* Approved / Blocked banner */}
              <div style={{ padding: '14px 18px', borderRadius: 10, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, background: gateResult.approved ? 'var(--green-glow)' : 'var(--red-glow)', border: `1px solid ${gateResult.approved ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}` }}>
                {gateResult.approved ? <ShieldCheck size={18} color="var(--green)" /> : <ShieldX size={18} color="var(--red)" />}
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '0.8rem', color: gateResult.approved ? 'var(--green)' : 'var(--red)', letterSpacing: '0.05em' }}>
                    {gateResult.approved ? '✅ PSYCHOLOGICAL CHECK PASSED — You may proceed' : '🚫 TRADE NOT RECOMMENDED'}
                  </div>
                  {!gateResult.approved && gateResult.block_reasons.map((r, i) => (
                    <div key={i} style={{ fontFamily: 'Inter', fontSize: '0.78rem', color: 'var(--red)', opacity: 0.85, marginTop: 4 }}>→ {r}</div>
                  ))}
                </div>
              </div>

              {/* AI assessment */}
              {gateResult.ai_assessment && !gateResult.ai_assessment.startsWith('AI Coach unavailable') && (
                <div style={{ padding: '14px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderLeft: '2px solid var(--accent)', borderRadius: 10 }}>
                  <div className="label" style={{ color: 'var(--accent)', marginBottom: 8, fontSize: '0.6rem' }}>🧠 BEHAVIUREDGE AI ASSESSMENT</div>
                  <div style={{ fontFamily: 'Inter', fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{gateResult.ai_assessment}</div>
                </div>
              )}
            </div>
          )}
        </GlowCard>
      )}

      {/* ── TRADE LOGGER (shown after gate cleared) ── */}
      {gateCleared && (
        <>
          {/* Profile strip */}
          {profile && (
            <div className="animate-fade-up stagger-1" style={{ display: 'flex', gap: 24, padding: '12px 18px', marginBottom: 16, background: 'var(--accent-dim)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 10, alignItems: 'center' }}>
              {[
                { label: 'Planned Risk', value: `$${planned}` },
                { label: 'Capital', value: `$${profile.capital.toLocaleString()}` },
                { label: 'Risk %', value: `${profile.risk_percent}%` },
                { label: 'Style', value: profile.trading_style },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="label" style={{ fontSize: '0.58rem', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '0.8rem', color: 'var(--accent)' }}>{value}</div>
                </div>
              ))}
              <div style={{ marginLeft: 'auto' }}>
                <button onClick={() => { setGateCleared(false); setGateResult(null) }} style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'var(--text-secondary)', background: 'transparent', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>
                  ← Back to Gate
                </button>
              </div>
            </div>
          )}

          {/* Outcome selector */}
          <div className="animate-fade-up stagger-2" style={{ marginBottom: 16 }}>
            <div className="label" style={{ marginBottom: 10 }}>Trade Outcome</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {['Win', 'Loss'].map(o => (
                <button key={o} onClick={() => setOutcome(o)} style={{
                  padding: '10px 28px', borderRadius: 10, cursor: 'pointer',
                  fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: outcome === o ? (o === 'Win' ? 'var(--green-glow)' : 'var(--red-glow)') : 'var(--bg-card)',
                  border: `1px solid ${outcome === o ? (o === 'Win' ? 'rgba(16,185,129,0.4)' : 'rgba(244,63,94,0.4)') : 'var(--border)'}`,
                  color: outcome === o ? (o === 'Win' ? 'var(--green)' : 'var(--red)') : 'var(--text-secondary)',
                }}>
                  {o === 'Win' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* Trade form */}
          <GlowCard glowColor="purple" className="animate-fade-up stagger-3" style={{ padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div className="label" style={{ marginBottom: 6 }}>Actual Risk ($)</div>
                <input name="actual_risk" type="number" value={form.actual_risk} onChange={e => setForm(f => ({ ...f, actual_risk: e.target.value }))} className="input-field" />
              </div>
              <div>
                <div className="label" style={{ marginBottom: 6 }}>{outcome === 'Win' ? '💰 Win Amount ($)' : '💸 Loss Amount ($)'}</div>
                <input name="pnl_amount" type="number" value={form.pnl_amount} onChange={e => setForm(f => ({ ...f, pnl_amount: e.target.value }))} className="input-field" />
              </div>
              <div>
                <div className="label" style={{ marginBottom: 6 }}>Emotion Before <span style={{ color: 'var(--text-muted)', fontSize: '0.58rem' }}>(pre-set from gate)</span></div>
                <input value={form.emotion_before} readOnly className="input-field" style={{ opacity: 0.7, cursor: 'not-allowed' }} />
              </div>
              <div>
                <div className="label" style={{ marginBottom: 6 }}>Emotion After</div>
                <div style={{ position: 'relative' }}>
                  <select value={form.emotion_after} onChange={e => setForm(f => ({ ...f, emotion_after: e.target.value }))} className="input-field" style={{ appearance: 'none', cursor: 'pointer' }}>
                    {EMOTIONS.map(e => <option key={e}>{e}</option>)}
                  </select>
                  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 7, height: 7, borderRadius: '50%', background: `var(--${EMOTION_RISK[form.emotion_after]})`, pointerEvents: 'none' }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
              onClick={() => setForm(f => ({ ...f, rule_followed: !f.rule_followed }))}>
              <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${form.rule_followed ? 'var(--green)' : 'var(--border)'}`, background: form.rule_followed ? 'var(--green-glow)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                {form.rule_followed && <CheckCircle size={12} color="var(--green)" />}
              </div>
              <span style={{ fontFamily: 'Inter', fontSize: '0.85rem', color: 'var(--text-primary)' }}>Followed all setup rules during execution</span>
            </div>

            {error && <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--red-glow)', border: '1px solid rgba(244,63,94,0.25)', fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--red)' }}>{error}</div>}

            <button onClick={handleTrade} disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: 20, padding: 14 }}>
              {loading ? 'Analyzing Trade...' : '📤 Log & Analyze Trade'}
            </button>
          </GlowCard>

          {/* Result */}
          {result && (
            <div className="animate-fade-up">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
                {[
                  { label: 'Risk Deviation', value: result.rdi?.toFixed(3), color: result.rdi > 0.2 ? 'red' : 'green', badge: result.rdi > 0.2 ? 'HIGH' : 'OK' },
                  { label: 'Emotional Volatility', value: result.evi?.toFixed(1), color: result.evi >= 3 ? 'red' : result.evi >= 2 ? 'amber' : 'green', badge: result.evi >= 3 ? 'HIGH' : 'STABLE' },
                  { label: 'Trade P&L', value: `${result.signed_pnl >= 0 ? '+' : ''}$${result.signed_pnl}`, color: result.signed_pnl >= 0 ? 'green' : 'red', badge: result.signed_pnl >= 0 ? 'WIN' : 'LOSS' },
                  { label: 'Discipline Score', value: `${result.discipline_score}/100`, color: result.discipline_score >= 70 ? 'green' : result.discipline_score >= 40 ? 'amber' : 'red', badge: result.discipline_score >= 70 ? 'GOOD' : result.discipline_score >= 40 ? 'WARN' : 'LOW' },
                ].map(({ label, value, color, badge }) => (
                  <GlowCard key={label} glowColor={color === 'green' ? 'green' : color === 'red' ? 'red' : 'orange'} style={{ padding: '18px', textAlign: 'center', borderColor: `rgba(${color === 'green' ? '16,185,129' : color === 'red' ? '244,63,94' : '245,158,11'}, 0.2)` }}>
                    <div className="label" style={{ marginBottom: 8 }}>{label}</div>
                    <div className="metric-num" style={{ fontSize: '1.4rem', marginBottom: 6, color: `var(--${color === 'amber' ? 'amber' : color})` }}>{value}</div>
                    <span className={`badge-${color === 'amber' ? 'amber' : color === 'green' ? 'green' : 'red'}`}>{badge}</span>
                  </GlowCard>
                ))}
              </div>

              {result.violations?.length > 0 ? (
                <div style={{ padding: '14px 18px', background: 'var(--red-glow)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <AlertTriangle size={14} color="var(--red)" />
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--red)', fontWeight: 700, letterSpacing: '0.08em' }}>VIOLATIONS DETECTED</span>
                  </div>
                  {result.violations.map((v, i) => <div key={i} style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--red)', opacity: 0.85, marginTop: 4 }}>→ {v}</div>)}
                </div>
              ) : (
                <div style={{ padding: '14px 18px', background: 'var(--green-glow)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={14} color="var(--green)" />
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: 'var(--green)', letterSpacing: '0.05em' }}>CLEAN TRADE — No violations detected</span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
