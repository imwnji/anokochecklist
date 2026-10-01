import type { Sticker } from '../types'

interface Props {
  sticker: Sticker
  /** Rendered size in px. */
  size?: number
  className?: string
  /** Plays a one-shot light sweep across the glass. */
  sheen?: boolean
}

/** Renders any image as a convex, translucent 3D glass sticker. */
export function GlassSticker({ sticker, size = 64, className = '', sheen = false }: Props) {
  return (
    <div
      className={`glass-sticker ${sticker.custom ? 'glass-sticker--photo' : ''} ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${sticker.name} 스티커`}
    >
      <img className="glass-sticker__img" src={sticker.src} alt="" draggable={false} />
      {sheen && <span className="glass-sticker__sheen" aria-hidden />}
    </div>
  )
}
