import { useEffect, useRef } from 'react'

/**
 * GlowCard
 * A card with a single cursor-tracking spotlight glow — a soft glow on the
 * background plus a matching bright trace along the border, both anchored
 * to the cursor's position relative to THIS card.
 *
 * Everything here uses one coordinate system: --x/--y, the cursor position
 * relative to the card's own top-left corner, with default background
 * attachment ('scroll'). That keeps the gradient's "at" position locked to
 * the element's own box no matter where the card sits on the page or how
 * wide it is.
 *
 * An earlier version of this tried to use background-attachment:fixed with
 * viewport coordinates for the border trace, on the theory that it would
 * make the edge-trace smoother. In practice that doesn't render reliably
 * once a card has padding/mask/border-radius and isn't perfectly square —
 * it produced a glow that stayed near the viewport corner nearest the cursor
 * rather than tracking the card. Card-local coordinates for both layers is
 * the version that's actually been verified to track correctly on cards of
 * any width/position, including this app's full-width chart panels.
 *
 * glowColor maps to this app's real theme tokens (see index.css :root) so a
 * status card (e.g. a rejected trade, negative P&L) reads correctly at a
 * glance instead of always glowing the default purple.
 */
const GLOW_COLORS = {
  purple: { hue: 262, saturation: 83, lightness: 65 }, // var(--accent)
  green:  { hue: 160, saturation: 84, lightness: 55 }, // var(--green)
  red:    { hue: 350, saturation: 89, lightness: 65 }, // var(--red)
  orange: { hue: 38,  saturation: 92, lightness: 60 }, // var(--amber)
  amber:  { hue: 38,  saturation: 92, lightness: 60 }, // alias of orange — matches var(--amber)
  blue:   { hue: 217, saturation: 91, lightness: 65 },
  pink:   { hue: 322, saturation: 100, lightness: 65 }, // magenta/pink accent, not in index.css theme tokens
}

export function GlowCard({
  children,
  className = '',
  style = {},
  size = 'md',       // 'sm' | 'md' | 'lg' | 'full' — sets a sensible min-height, never forces aspect ratio
  glowColor = 'purple', // 'purple' | 'green' | 'red' | 'orange' | 'amber' | 'blue' | 'pink' — matches index.css theme tokens (pink is a standalone accent, not a theme token)
  width,
  height,
  as: Tag = 'div',
  ...rest
}) {
  const cardRef = useRef(null)
  const { hue, saturation, lightness } = GLOW_COLORS[glowColor] || GLOW_COLORS.purple

  useEffect(() => {
    const syncPointer = (e) => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      cardRef.current.style.setProperty('--x', `${x.toFixed(2)}px`)
      cardRef.current.style.setProperty('--y', `${y.toFixed(2)}px`)
    }
    document.addEventListener('pointermove', syncPointer, { passive: true })
    return () => document.removeEventListener('pointermove', syncPointer)
  }, [])

  const inlineStyles = {
    '--hue': hue,
    '--saturation': saturation,
    '--lightness': lightness,
    '--radius': '16',          // matches .card's 16px radius elsewhere on the site
    '--border': '1.5',
    '--backdrop': 'var(--bg-card)',
    '--backup-border': 'var(--border)',
    '--size': '150',
    '--bg-spot-opacity': '0.30',
    '--border-spot-opacity': '0.9',
    '--bloom-opacity': '0.50',
    '--border-size': 'calc(var(--border, 1.5) * 1px)',
    '--spotlight-size': 'calc(var(--size, 220) * 1px)',
    // Card-relative spotlight on the card's own background.
    backgroundImage: `radial-gradient(
      var(--spotlight-size) var(--spotlight-size) at var(--x, -999px) var(--y, -999px),
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
      <div data-glow-bloom />
      {children}
    </Tag>
  )
}
