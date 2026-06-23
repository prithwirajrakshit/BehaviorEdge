import { useEffect, useRef } from 'react'

/**
 * GlowCard
 * A card with a cursor-tracking spotlight glow on its background and border.
 *
 * Two coordinate systems are used, and they must NOT be mixed:
 *
 *  1. Card-local (--x/--y): cursor position relative to this card's own
 *     top-left corner. Used for the background spotlight. background-attachment
 *     stays at its default ('scroll'), so the gradient is positioned relative
 *     to the element's own box — this is what makes the glow appear right
 *     under the cursor as it moves over the card, fading out near the edges.
 *
 *  2. Viewport-fixed (--xv/--yv): raw clientX/clientY. Used only by the
 *     ::before/::after border-glow pseudo-elements in index.css, which use
 *     background-attachment: fixed. That's what lets the border-trace glow
 *     read correctly across the card's edge as the cursor crosses it, instead
 *     of jumping discontinuously the way a card-local coordinate would if
 *     applied to a fixed-attachment background.
 *
 * Mixing these (e.g. card-local coords on a fixed-attachment background, or
 * vice versa) is what produces a glow that looks like a giant static blob
 * sitting in one spot instead of tracking the cursor — so keep the two
 * separate rather than "simplifying" to one coordinate system.
 *
 * Color is intentionally NOT a prop — every card on the site pulls the same
 * fixed theme purple from index.css so the glow always matches --accent.
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
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()

      // Card-local — drives the background spotlight (default attachment)
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      cardRef.current.style.setProperty('--x', x.toFixed(2))
      cardRef.current.style.setProperty('--y', y.toFixed(2))

      // Viewport-fixed — drives the border-trace pseudo-elements only
      cardRef.current.style.setProperty('--xv', e.clientX.toFixed(2))
      cardRef.current.style.setProperty('--yv', e.clientY.toFixed(2))
      cardRef.current.style.setProperty('--xp', (e.clientX / window.innerWidth).toFixed(2))
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
    // Card-relative spotlight — NO backgroundAttachment:fixed here.
    // Uses --x/--y (card-local), so it tracks the cursor across this card.
    backgroundImage: `radial-gradient(
      var(--spotlight-size) var(--spotlight-size) at
      calc(var(--x, -999) * 1px)
      calc(var(--y, -999) * 1px),
      hsl(var(--hue) calc(var(--saturation) * 1%) calc(var(--lightness) * 1%) / var(--bg-spot-opacity)), transparent
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
