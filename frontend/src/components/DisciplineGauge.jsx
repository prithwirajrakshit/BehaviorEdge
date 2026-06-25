import { useEffect, useState } from 'react'

/**
 * DisciplineGauge
 * An SVG arc gauge (F1-dashboard style) for the discipline score. The arc
 * fills from 0 → value on mount, color-coded by score:
 *   ≥70 green (#10b981) | ≥40 amber (#f59e0b) | <40 red (#f43f5e)
 * A glow on the arc and a centered score readout finish it.
 *
 * The arc is a 270° sweep (top gap), drawn with stroke-dasharray/offset.
 * Animation: starts at full offset (empty) and transitions to the target
 * offset over ~1.2s — eased, so it feels like a real gauge settling.
 *
 * Props: value (0-100), size (default 120)
 */
export function DisciplineGauge({ value = 0, size = 120 }) {
  const clamped = Math.max(0, Math.min(100, value))
  const color = clamped >= 70 ? '#10b981' : clamped >= 40 ? '#f59e0b' : '#f43f5e'

  const stroke = 10
  const radius = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  // 270° sweep, leaving a 90° gap at the bottom
  const circumference = 2 * Math.PI * radius
  const sweepFraction = 0.75
  const arcLength = circumference * sweepFraction
  // Offset so the arc starts at ~135° (top-left) and ends at ~45° (top-right)
  const rotation = 135

  // Target fill offset for the given value
  const fillFraction = (clamped / 100) * sweepFraction
  const targetOffset = arcLength * (1 - fillFraction)

  // Animate from empty (full offset) to target after mount
  const [offset, setOffset] = useState(arcLength)

  useEffect(() => {
    const t = setTimeout(() => setOffset(targetOffset), 80)
    return () => clearTimeout(t)
  }, [targetOffset])

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <svg width={size} height={size} style={{ transform: `rotate(${rotation}deg)`, overflow: 'visible' }}>
        {/* Track — full arc background */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={0}
          opacity={0.5}
        />
        {/* Fill — animated value arc */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
      </svg>

      {/* Centered readout — counter-rotated text stays upright */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: "'Khand', sans-serif",
          fontWeight: 700,
          fontSize: size * 0.32,
          lineHeight: 1,
          color,
          textShadow: `0 0 12px ${color}66`,
        }}>
          {clamped}
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: size * 0.09,
          color: 'var(--text-secondary)',
          letterSpacing: '0.08em',
          marginTop: 2,
        }}>
          / 100
        </div>
      </div>
    </div>
  )
}

export default DisciplineGauge
