import { useState, useEffect, useRef } from 'react'
import { sendMessage, getChatHistory, clearChatHistory } from '../api/client'
import { Send, Trash2, Brain } from 'lucide-react'

const QUICK_PROMPTS = [
  "What patterns do you see in my trades?",
  "Am I showing signs of revenge trading?",
  "How is my emotional volatility trending?",
  "What should I focus on improving?",
]

export default function AICoach() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { getChatHistory().then(r => setMessages(r.data)) }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput(''); setLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: msg, id: Date.now() }])
    try {
      const res = await sendMessage({ role: 'user', content: msg })
      setMessages(prev => [...prev, res.data])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ AI Coach unavailable. Check your API key configuration.', id: Date.now() }])
    }
    setLoading(false)
  }

  const clear = async () => { await clearChatHistory(); setMessages([]) }

  return (
    <div style={{ maxWidth: '100%', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>

      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 500, fontSize: '2.2rem', color: 'var(--text-primary)', letterSpacing: '0.02em', margin: 0 }}>
            AI Behavioral Coach
          </h2>
        </div>
        <button onClick={clear} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
          background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer',
          fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: 'var(--text-secondary)',
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'var(--red-glow)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent' }}
        >
          <Trash2 size={12} /> Clear History
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, marginBottom: 12 }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--accent-dim)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={24} color="var(--accent)" />
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>Your behavioral coach is ready</div>
            <div className="label">Ask about your trading psychology, patterns, or biases</div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id || i} className="animate-fade-up" style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
            {msg.role === 'assistant' && (
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-dim)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0, marginTop: 4 }}>
                <Brain size={13} color="var(--accent)" />
              </div>
            )}
            <div style={{
              maxWidth: '78%', padding: '12px 16px', borderRadius: 14,
              fontFamily: 'Inter', fontSize: '0.875rem', lineHeight: 1.6,
              ...(msg.role === 'user' ? {
                background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
                color: 'white', borderBottomRightRadius: 4,
                boxShadow: '0 4px 16px rgba(124,58,237,0.2)',
              } : {
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', borderBottomLeftRadius: 4,
                borderLeft: '2px solid var(--accent)',
              })
            }}>
              {msg.role === 'assistant' && (
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: 'var(--accent)', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  BehaviorEdge AI
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-dim)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0 }}>
              <Brain size={13} color="var(--accent)" />
            </div>
            <div style={{ padding: '14px 18px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, borderBottomLeftRadius: 4, borderLeft: '2px solid var(--accent)' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {QUICK_PROMPTS.map((qp, i) => (
          <button key={i} onClick={() => send(qp)} style={{
            padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'JetBrains Mono', fontSize: '0.65rem', letterSpacing: '0.02em',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-card)' }}
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 10 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask your behavioral coach..."
          className="input-field" style={{ flex: 1 }} />
        <button onClick={() => send()} disabled={loading || !input.trim()}
          className="btn-primary" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Send size={14} />
        </button>
      </div>

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }`}</style>
    </div>
  )
}
