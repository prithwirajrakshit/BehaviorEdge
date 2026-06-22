import { useEffect, useRef, useState } from 'react'

// Tiny local classnames joiner — avoids pulling in clsx/tailwind-merge
// just for this one component.
function cx(...args) {
  return args.filter(Boolean).join(' ')
}

/**
 * Animated, blurred radial-gradient blob background.
 * Tuned to BehaviorEdge's purple "Luminary" palette by default.
 *
 * Usage:
 *   <BackgroundGradientAnimation>
 *     <div className="absolute inset-0 z-10 flex items-center justify-center">
 *       ...your foreground content...
 *     </div>
 *   </BackgroundGradientAnimation>
 */
export function BackgroundGradientAnimation({
  gradientBackgroundStart = 'var(--bg-base)',
  gradientBackgroundEnd = '#150a2e',
  firstColor = '124, 58, 237',   // --accent
  secondColor = '167, 139, 250', // --accent-light
  thirdColor = '109, 40, 217',   // deep purple
  fourthColor = '244, 63, 94',   // --red, used sparingly
  fifthColor = '16, 185, 129',   // --green, used sparingly
  pointerColor = '167, 139, 250',
  size = '80%',
  blendingValue = 'hard-light',
  children,
  className,
  interactive = true,
  containerClassName,
}) {
  const interactiveRef = useRef(null)

  const [curX, setCurX] = useState(0)
  const [curY, setCurY] = useState(0)
  const [tgX, setTgX] = useState(0)
  const [tgY, setTgY] = useState(0)

  useEffect(() => {
    document.body.style.setProperty('--gradient-background-start', gradientBackgroundStart)
    document.body.style.setProperty('--gradient-background-end', gradientBackgroundEnd)
    document.body.style.setProperty('--first-color', firstColor)
    document.body.style.setProperty('--second-color', secondColor)
    document.body.style.setProperty('--third-color', thirdColor)
    document.body.style.setProperty('--fourth-color', fourthColor)
    document.body.style.setProperty('--fifth-color', fifthColor)
    document.body.style.setProperty('--pointer-color', pointerColor)
    document.body.style.setProperty('--size', size)
    document.body.style.setProperty('--blending-value', blendingValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function move() {
      if (!interactiveRef.current) return
      setCurX(curX + (tgX - curX) / 20)
      setCurY(curY + (tgY - curY) / 20)
      interactiveRef.current.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`
    }
    move()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tgX, tgY])

  const handleMouseMove = (event) => {
    if (interactiveRef.current) {
      const rect = interactiveRef.current.getBoundingClientRect()
      setTgX(event.clientX - rect.left)
      setTgY(event.clientY - rect.top)
    }
  }

  const [isSafari, setIsSafari] = useState(false)
  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent))
  }, [])

  return (
    <div
      className={cx(
        'h-full w-full absolute inset-0 overflow-hidden top-0 left-0',
        '[background:linear-gradient(40deg,var(--gradient-background-start),var(--gradient-background-end))]',
        containerClassName
      )}
    >
      <svg className="hidden">
        <defs>
          <filter id="behaviorEdgeBlurMe">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div className={cx('relative', className)}>{children}</div>

      <div
        className={cx(
          'gradients-container h-full w-full blur-lg',
          isSafari ? 'blur-2xl' : '[filter:url(#behaviorEdgeBlurMe)_blur(40px)]'
        )}
      >
        <div
          className={cx(
            '[background:radial-gradient(circle_at_center,_rgba(var(--first-color),_0.8)_0,_rgba(var(--first-color),_0)_50%)_no-repeat]',
            '[mix-blend-mode:var(--blending-value)] absolute w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]',
            '[transform-origin:center_center]',
            'animate-first opacity-100'
          )}
        />
        <div
          className={cx(
            '[background:radial-gradient(circle_at_center,_rgba(var(--second-color),_0.8)_0,_rgba(var(--second-color),_0)_50%)_no-repeat]',
            '[mix-blend-mode:var(--blending-value)] absolute w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]',
            '[transform-origin:calc(50%-400px)]',
            'animate-second opacity-100'
          )}
        />
        <div
          className={cx(
            '[background:radial-gradient(circle_at_center,_rgba(var(--third-color),_0.8)_0,_rgba(var(--third-color),_0)_50%)_no-repeat]',
            '[mix-blend-mode:var(--blending-value)] absolute w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]',
            '[transform-origin:calc(50%+400px)]',
            'animate-third opacity-100'
          )}
        />
        <div
          className={cx(
            '[background:radial-gradient(circle_at_center,_rgba(var(--fourth-color),_0.6)_0,_rgba(var(--fourth-color),_0)_50%)_no-repeat]',
            '[mix-blend-mode:var(--blending-value)] absolute w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]',
            '[transform-origin:calc(50%-200px)]',
            'animate-fourth opacity-40'
          )}
        />
        <div
          className={cx(
            '[background:radial-gradient(circle_at_center,_rgba(var(--fifth-color),_0.6)_0,_rgba(var(--fifth-color),_0)_50%)_no-repeat]',
            '[mix-blend-mode:var(--blending-value)] absolute w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]',
            '[transform-origin:calc(50%-800px)_calc(50%+800px)]',
            'animate-fifth opacity-60'
          )}
        />

        {interactive && (
          <div
            ref={interactiveRef}
            onMouseMove={handleMouseMove}
            className={cx(
              '[background:radial-gradient(circle_at_center,_rgba(var(--pointer-color),_0.8)_0,_rgba(var(--pointer-color),_0)_50%)_no-repeat]',
              '[mix-blend-mode:var(--blending-value)] absolute w-full h-full -top-1/2 -left-1/2',
              'opacity-50'
            )}
          />
        )}
      </div>
    </div>
  )
}
