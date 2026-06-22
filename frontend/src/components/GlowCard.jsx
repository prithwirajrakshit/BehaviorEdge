import { useEffect, useRef } from 'react'

// spread: 0 locks the glow to a single fixed hue — no rainbow shift as the cursor moves
const glowColorMap = {
  blue: { base: 220, spread: 0 },
  purple: { base: 322, spread: 0 },   // pinkish-magenta — the Luminary signature glow
  pink: { base: 322, spread: 0 },
  green: { base: 150, spread: 0 },
  red: { base: 350, spread: 0 },
  orange: { base: 30, spread: 0 },
  violet: { base: 322, spread: 0 },
}

/**
 * GlowCard — a spotlight-following card with a glowing cursor-tracked border.
 *
 * Props:
 *  - children: card content
 *  - className: extra classes
 *  - glowColor: 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'violet'
 *  - width / height: inline sizing overrides
 */
export function GlowCard({
  children,
  className = '',
  style = {},
  glowColor = 'purple',
  width,
  height,
}) {
  const cardRef = useRef(null)

  useEffect(() => {
    let frameId;
    const syncPointer = (e) => {
      if (frameId) cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(() => {
        if (!cardRef.current) return
        const rect = cardRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const xp = (x / rect.width).toFixed(2)
        const yp = (y / rect.height).toFixed(2)
        cardRef.current.style.setProperty('--x', x.toFixed(2))
        cardRef.current.style.setProperty('--xp', xp)
        cardRef.current.style.setProperty('--y', y.toFixed(2))
        cardRef.current.style.setProperty('--yp', yp)
      })
    }
    document.addEventListener('pointermove', syncPointer, { passive: true })
    return () => {
      document.removeEventListener('pointermove', syncPointer)
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [])

  const { base, spread } = glowColorMap[glowColor] || glowColorMap.purple

  const inlineStyles = {
    '--base': base,
    '--spread': spread,
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
      hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.06)), transparent
    )`,
    backgroundColor: 'var(--backdrop, transparent)',
    backgroundSize: 'calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))',
    backgroundPosition: '50% 50%',
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
