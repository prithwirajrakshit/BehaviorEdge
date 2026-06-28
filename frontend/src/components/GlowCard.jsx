import { useEffect, useRef } from 'react'

/**
 * GlowCard
 * A card with a cursor-tracking glow confined to its BORDER only — light
 * traces the edge as the cursor moves, blended like a video overlay
 * (mix-blend-mode: screen, set in index.css). The card body stays dark
 * (no in-body spotlight, no blurred halo/bloom), so the effect reads as
 * light leaking around the edge rather than filling the card.
 *
 * Coordinates are card-local: --x/--y are the cursor position relative to
 * the card's own top-left, with default background attachment ('scroll').
 * That keeps the gradient's "at" position locked to the element's own box
 * no matter where the card sits on the page or how wide it is. This is the
 * version verified to track correctly on cards of any width/position,
 * including this app's full-width chart panels. --xp/--yp (0→1) drive the
 * hue sweep (see --hue calc below).
 *
 * glowColor maps to the uploaded magenta-pink palette by default (deep
 * #71235a → light #df93ca/#e7b8da). Semantic colors (red rejected trade,
 * green P&L) still read correctly at a glance.
 */
// `spread` is the 21st.dev-style hue sweep: as the cursor crosses the card,
// --hue moves from `hue` to `hue + spread`. The default color now tracks the
// uploaded magenta-pink palette (deep #71235a → light #df93ca/#e7b8da, all
// around hue 315–326), so the border glow lives in the pink family. Semantic
// colors keep a small/zero spread so a red "rejected trade" or green P&L card
// still reads correctly at a glance.
const GLOW_COLORS = {
  purple: { hue: 320, saturation: 70, lightness: 65, spread: 30 }, // palette magenta-pink (#df93ca/#e7b8da family) — DEFAULT
  green:  { hue: 160, saturation: 84, lightness: 55, spread: 25 }, // var(--green)
  red:    { hue: 350, saturation: 89, lightness: 65, spread: 20 }, // var(--red)
  orange: { hue: 38,  saturation: 92, lightness: 60, spread: 20 }, // var(--amber)
  amber:  { hue: 38,  saturation: 92, lightness: 60, spread: 20 }, // alias of orange — matches var(--amber)
  blue:   { hue: 217, saturation: 91, lightness: 65, spread: 40 },
  pink:   { hue: 322, saturation: 75, lightness: 70, spread: 20 }, // palette light pink (#df93ca family)
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
  const { hue, saturation, lightness, spread } = GLOW_COLORS[glowColor] || GLOW_COLORS.purple

  useEffect(() => {
    const syncPointer = (e) => {
      if (!cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      // Normalized cursor position (0→1) across the card's own box, used to
      // drive the hue sweep (purple→pink) via the --hue calc in inlineStyles.
      const xp = rect.width  > 0 ? Math.min(Math.max(x / rect.width,  0), 1) : 0.5
      const yp = rect.height > 0 ? Math.min(Math.max(y / rect.height, 0), 1) : 0.5
      const el = cardRef.current
      el.style.setProperty('--x', `${x.toFixed(2)}px`)
      el.style.setProperty('--y', `${y.toFixed(2)}px`)
      el.style.setProperty('--xp', xp.toFixed(3))
      el.style.setProperty('--yp', yp.toFixed(3))
    }
    document.addEventListener('pointermove', syncPointer, { passive: true })
    return () => document.removeEventListener('pointermove', syncPointer)
  }, [])

  const inlineStyles = {
    // --hue is a live calc: cursor X sweeps hue from --hue-base to
    // --hue-base + --spread (e.g. deep pink → light pink across the palette).
    // Border-only: the card body is left untouched (dark), so the glow reads
    // as light tracing the edge, not a fill inside the card.
    '--hue-base': hue,
    '--spread': spread,
    '--xp': '0.5',
    '--yp': '0.5',
    '--hue': 'calc(var(--hue-base) + (var(--xp, 0.5) * var(--spread, 0)))',
    '--saturation': saturation,
    '--lightness': lightness,
    '--radius': '16',          // matches .card's 16px radius elsewhere on the site
    '--border': '1.5',
    '--backdrop': 'var(--bg-card)',
    '--backup-border': 'var(--border)',
    '--size': '150',
    '--border-spot-opacity': '0.9',
    '--bg-spot-opacity': '0.30',
    '--bloom-opacity': '0.50',
    '--border-size': 'calc(var(--border, 1.5) * 1px)',
    '--spotlight-size': 'calc(var(--size, 200) * 1px)',
    // No in-body spotlight — body uses the solid card backdrop so only the
    // border traces (index.css ::before/::after) light up under the cursor.
    backgroundColor: 'var(--backdrop, transparent)',
    border: 'var(--border-size) solid var(--backup-border)',
    position: 'relative',
    touchAction: 'pan-y',
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
      {children}
    </Tag>
  )
}
