import { useEffect, useRef } from 'react'

// Single pinkish-purple color, spread=0 means no hue shift as cursor moves
const GLOW_BASE = 322   // hsl 322 = pinkish-magenta
const GLOW_SPREAD = 0

export function GlowCard({
  children,
  className = '',
  style = {},
  glowColor,  // kept for API compat but ignored — always pink-purple
  width,
  height,
}) {
  const cardRef = useRef(null)

  useEffect(() => {
    const syncPointer = (e) => {
      if (!cardRef.current) return
      cardRef.current.style.setProperty('--x', e.clientX.toFixed(2))
      cardRef.current.style.setProperty('--xp', (e.clientX / window.innerWidth).toFixed(2))
      cardRef.current.style.setProperty('--y', e.clientY.toFixed(2))
      cardRef.current.style.setProperty('--yp', (e.clientY / window.innerHeight).toFixed(2))
    }
    document.addEventListener('pointermove', syncPointer)
    return () => document.removeEventListener('pointermove', syncPointer)
  }, [])

  const inlineStyles = {
    '--base': GLOW_BASE,
    '--spread': GLOW_SPREAD,
    '--radius': '14',
    '--border': '1.5',
    '--backdrop': 'var(--bg-card)',
    '--backup-border': 'var(--border)',
    '--size': '200',
    '--outer': '1',
    '--border-size': 'calc(var(--border, 2) * 1px)',
    '--spotlight-size': 'calc(var(--size, 150) * 1px)',
    '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
    backgroundImage: `radial-gradient(
      var(--spotlight-size) var(--spotlight-size) at
      calc(var(--x, 0) * 1px)
      calc(var(--y, 0) * 1px),
      hsl(var(--hue, 322) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.08)), transparent
    )`,
    backgroundColor: 'var(--backdrop, transparent)',
    backgroundSize: 'calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))',
    backgroundPosition: '50% 50%',
    backgroundAttachment: 'fixed',
    border: 'var(--border-size) solid var(--backup-border)',
    position: 'relative',
    touchAction: 'none',
    borderRadius: 'calc(var(--radius) * 1px)',
    ...(width !== undefined && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height !== undefined && { height: typeof height === 'number' ? `${height}px` : height }),
    ...style,
  }

  return (
    <div
      ref={cardRef}
      data-glow
      style={inlineStyles}
      className={`glow-card ${className}`}
    >
      <div data-glow />
      {children}
    </div>
  )
}
