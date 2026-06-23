import { useEffect, useRef } from 'react'

/**
 * GlowCard
 * A card with a cursor-tracking spotlight glow on its background and border.
 *
 * Behavior ported from the reference implementation:
 *  - Pointer position is tracked globally and written to CSS vars on the card
 *    (--x/--y in client coords, --xp/--yp as 0–1 viewport fractions).
 *  - backgroundAttachment: 'fixed' is used so the gradient is anchored to the
 *    viewport, which is what makes the spotlight appear to "trace" smoothly
 *    across a card's border as the cursor moves, rather than jumping to be
 *    relative to the card on every render.
 *  - Hue is computed from --xp so the glow has a tiny living drift across the
 *    screen, but --spread is kept at 0 so it stays anchored to the theme's
 *    purple rather than sweeping across unrelated hues.
 *
 * Color is intentionally NOT a prop here — every card on the site pulls the
 * same fixed theme purple from index.css (see [data-glow] rules) so the
 * glow always matches --accent, no matter how many cards are on screen.
 */
export function GlowCard({
  children,
  className = '',
  style = {},
  size = 'md',       // 'sm' | 'md' | 'lg' | 'full' — sets a sensible min-height, never forces aspect ratio
  width,
  height,
  as: Tag = 'div',
  ...rest
}) {
  const cardRef = useRef(null)
  const innerRef = useRef(null)

  useEffect(() => {
    const syncPointer = (e) => {
      const { clientX: x, clientY: y } = e
      if (!cardRef.current) return
      cardRef.current.style.setProperty('--x', x.toFixed(2))
      cardRef.current.style.setProperty('--xp', (x / window.innerWidth).toFixed(2))
      cardRef.current.style.setProperty('--y', y.toFixed(2))
      cardRef.current.style.setProperty('--yp', (y / window.innerHeight).toFixed(2))
    }
    document.addEventListener('pointermove', syncPointer, { passive: true })
    return () => document.removeEventListener('pointermove', syncPointer)
  }, [])

  const inlineStyles = {
    '--base': '262',          // theme purple hue, matches --accent (#7c3aed) in index.css
    '--spread': '0',          // 0 = hue stays fixed at --base; no sweeping across other colors
    '--radius': '16',         // matches .card's 16px radius elsewhere on the site
    '--border': '1.5',
    '--backdrop': 'var(--bg-card)',
    '--backup-border': 'var(--border)',
    '--size': '220',
    '--outer': '1',
    '--saturation': '85',
    '--lightness': '65',
    '--bg-spot-opacity': '0.10',
    '--border-spot-opacity': '0.9',
    '--border-light-opacity': '0.25',
    '--border-size': 'calc(var(--border, 1.5) * 1px)',
    '--spotlight-size': 'calc(var(--size, 220) * 1px)',
    '--hue': 'calc(var(--base) + (var(--xp, 0.5) * var(--spread, 0)))',
    backgroundImage: `radial-gradient(
      var(--spotlight-size) var(--spotlight-size) at
      calc(var(--x, -999) * 1px)
      calc(var(--y, -999) * 1px),
      hsl(var(--hue) calc(var(--saturation) * 1%) calc(var(--lightness) * 1%) / var(--bg-spot-opacity)), transparent
    )`,
    backgroundColor: 'var(--backdrop, transparent)',
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
    <Tag
      ref={cardRef}
      data-glow
      data-glow-size={size}
      style={inlineStyles}
      className={`glow-card glow-card--${size} ${className}`}
      {...rest}
    >
      <div ref={innerRef} data-glow />
      {children}
    </Tag>
  )
}
