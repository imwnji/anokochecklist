/**
 * Sketchbook-style outlines: dashed lines that look drawn with a pencil.
 *
 * `PencilFilters` defines the shared SVG filter once (render it near the app root):
 * a low-frequency displacement makes the line wobble like a hand-drawn stroke, and a
 * fine noise mask breaks it up like graphite on paper grain.
 */
export function PencilFilters() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
      <filter id="pencil" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="wobble" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="wobble"
          scale="2.6"
          xChannelSelector="R"
          yChannelSelector="G"
          result="drawn"
        />
        <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="9" result="grain" />
        <feColorMatrix
          in="grain"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.5 1.55"
          result="grainMask"
        />
        <feComposite in="drawn" in2="grainMask" operator="in" />
      </filter>
    </svg>
  )
}

interface SketchBorderProps {
  /** Corner radius in px, or e.g. '50%' for a circle. */
  radius?: number | string
  /** Stroke colour (defaults to graphite). */
  color?: string
  strokeWidth?: number
  dash?: string
  className?: string
}

/**
 * Pencil-drawn dashed outline that fills its (position: relative) parent. A second,
 * fainter stroke slightly off-register mimics a line traced over twice.
 */
export function SketchBorder({
  radius = 16,
  color = 'var(--color-graphite)',
  strokeWidth = 1.6,
  dash = '9 5',
  className = '',
}: SketchBorderProps) {
  return (
    <svg
      className={`pointer-events-none absolute inset-[1px] h-[calc(100%-2px)] w-[calc(100%-2px)] overflow-visible ${className}`}
      style={{ filter: 'url(#pencil)' }}
      aria-hidden
      focusable="false"
    >
      <rect
        width="100%"
        height="100%"
        rx={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={dash}
        strokeLinecap="round"
      />
      <rect
        x="0.8"
        y="-0.6"
        width="100%"
        height="100%"
        rx={radius}
        fill="none"
        stroke={color}
        strokeOpacity={0.35}
        strokeWidth={strokeWidth * 0.7}
        strokeDasharray={dash}
        strokeDashoffset={4}
        strokeLinecap="round"
      />
    </svg>
  )
}
