import { useEffect, useRef } from 'react'

export function GlowCard({
  children,
  className = '',
  style = {},
  glowColor,
  width,
  height,
}) {
  const cardRef = useRef(null)

  useEffect(() => {
    const syncPointer = (e) => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      // Card-relative coords for the background spotlight
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      cardRef.current.style.setProperty('--x', x.toFixed(2))
      cardRef.current.style.setProperty('--y', y.toFixed(2))
      // Viewport-relative for the border pseudo-elements (backgroundAttachment:fixed)
      cardRef.current.style.setProperty('--xv', e.clientX.toFixed(2))
      cardRef.current.style.setProperty('--yv', e.clientY.toFixed(2))
      cardRef.current.style.setProperty('--xp', (e.clientX / window.innerWidth).toFixed(2))
    }
    document.addEventListener('pointermove', syncPointer)
    return () => document.removeEventListener('pointermove', syncPointer)
  }, [])

  const inlineStyles = {
    '--base': '322',
    '--spread': '0',
    '--radius': '14',
    '--border': '1.5',
    '--backdrop': 'var(--bg-card)',
    '--backup-border': 'var(--border)',
    '--size': '180',
    '--outer': '1',
    '--border-size': 'calc(var(--border, 2) * 1px)',
    '--spotlight-size': 'calc(var(--size, 150) * 1px)',
    '--hue': '322',
    // Background spotlight uses card-relative --x/--y, NO backgroundAttachment:fixed
    backgroundImage: `radial-gradient(
      var(--spotlight-size) var(--spotlight-size) at
      calc(var(--x, -999) * 1px)
      calc(var(--y, -999) * 1px),
      hsl(322 100% 70% / 0.07), transparent
    )`,
    backgroundColor: 'var(--backdrop, transparent)',
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
