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
      {/*
        Paper edge: fine fibrous noise nudges only the outline (a flat fill stays flat), then a
        slight blur lets the edge fade softly into the page, like the rim of a paper cut-out.
      */}
      <filter id="paper-edge" x="-4%" y="-25%" width="108%" height="150%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="5" result="fibres" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="fibres"
          scale="4"
          xChannelSelector="R"
          yChannelSelector="G"
          result="rough"
        />
        <feGaussianBlur in="rough" stdDeviation="0.9" />
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
 * Pencil-drawn dashed outline that fills its (position: relative) parent.
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
    </svg>
  )
}

/**
 * How object edges are drawn:
 * - 'paper':  no outline; the fill's edge fades softly with a fibrous paper texture (#paper-edge)
 * - 'pencil': flat fill plus a pencil-drawn dashed outline (the previous look)
 * Switch back to 'pencil' to undo the paper-edge experiment.
 */
export const EDGE_STYLE: 'paper' | 'pencil' = 'paper'

interface SurfaceProps {
  /** Tailwind background class(es) for the fill, e.g. 'bg-oat'. */
  fill: string
  radius: number | string
  /** Outline colour, used in 'pencil' mode only. */
  pencilColor?: string
  className?: string
}

/**
 * Background layer of an object. Put it first inside a `relative isolate` parent: it sits
 * behind the content (z -1), so the edge filter never touches text or stickers.
 */
export function Surface({ fill, radius, pencilColor, className = '' }: SurfaceProps) {
  return (
    <>
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 -z-10 transition-colors ${fill} ${className}`}
        style={{ borderRadius: radius, filter: EDGE_STYLE === 'paper' ? 'url(#paper-edge)' : undefined }}
      />
      {EDGE_STYLE === 'pencil' && <SketchBorder radius={radius} color={pencilColor} />}
    </>
  )
}
