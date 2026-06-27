import React from 'react';

/**
 * NeonButton — Pinkish rose neon pill button
 *
 * Props:
 *   variant : 'default' | 'ghost'   (default = pink solid, ghost = transparent border)
 *   size    : 'sm' | 'default' | 'lg'
 *   neon    : boolean (default true) — show animated glow lines on hover
 *   All standard <button> HTML attributes are forwarded.
 */
const NeonButton = React.forwardRef(function NeonButton(
  { className = '', variant = 'default', size = 'default', neon = true, children, disabled, ...props },
  ref
) {
  const baseClass = [
    'btn-neon',
    variant === 'ghost' ? 'btn-neon-ghost' : '',
    size === 'sm' ? 'btn-neon-sm' : '',
    size === 'lg' ? 'btn-neon-lg' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button ref={ref} className={baseClass} disabled={disabled} {...props}>
      {/* Top neon line */}
      {neon && <span className="btn-neon-line btn-neon-line-top" aria-hidden="true" />}
      {children}
      {/* Bottom neon line */}
      {neon && <span className="btn-neon-line btn-neon-line-bottom" aria-hidden="true" />}
    </button>
  );
});

NeonButton.displayName = 'NeonButton';

export { NeonButton };
export default NeonButton;
