import { animate, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { Sticker } from '../types'
import { DomeSticker } from './DomeSticker'
import { SLOT_SIZE } from './ChecklistItem'

/** How much bigger the sticker gets at the closest point of the swoosh. */
const ZOOM = 2.8

export interface Burst {
  id: string
  itemId: string
  sticker: Sticker
  /** Bounding rect of the completion slot the sticker sticks to. */
  target: DOMRect
}

interface Props {
  bursts: Burst[]
  onPop: (burst: Burst) => void
  onLanded: (burst: Burst) => void
}

/**
 * Layer above the page for the stick animation. It sits outside the list so the
 * zoomed sticker isn't clipped by the row.
 */
export function StickerOverlay({ bursts, onPop, onLanded }: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {bursts.map((b) => (
        <SwooshSticker key={b.id} burst={b} onPop={onPop} onLanded={onLanded} />
      ))}
    </div>
  )
}

/** Right above its slot: swoosh up towards the viewer, then straight back down onto the slot. */
function SwooshSticker({
  burst,
  onPop,
  onLanded,
}: {
  burst: Burst
  onPop: (b: Burst) => void
  onLanded: (b: Burst) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  // Keep latest callbacks without restarting the animation.
  const cb = useRef({ onPop, onLanded })
  cb.current = { onPop, onLanded }
  // StrictMode mounts effects twice in dev: start the sequence only once,
  // and keep it running across the simulated remount.
  const started = useRef(false)
  const mounted = useRef(false)
  // Rendered at the zoomed size (crisp) and scaled down to the slot size.
  const [big] = useState(SLOT_SIZE * ZOOM)
  const rest = 1 / ZOOM

  useEffect(() => {
    mounted.current = true
    if (started.current) return () => void (mounted.current = false)
    started.current = true
    const el = ref.current!
    const run = async () => {
      cb.current.onPop(burst)
      if (reduced) {
        cb.current.onLanded(burst)
        return
      }
      // 1) Swoosh closer to the viewer
      await animate(
        el,
        {
          scale: [rest, 1],
          y: [0, -24],
          rotate: [0, -7],
          filter: [
            'drop-shadow(0 2px 2px rgb(90 70 40 / 0.3))',
            'drop-shadow(0 40px 30px rgb(90 70 40 / 0.28))',
          ],
        },
        { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
      )
      if (!mounted.current) return
      // 2) …and straight back down onto the slot
      await animate(
        el,
        {
          scale: rest,
          y: 0,
          rotate: 0,
          filter: 'drop-shadow(0 1px 1px rgb(90 70 40 / 0.3))',
        },
        { duration: 0.24, ease: [0.55, 0, 0.9, 0.4] },
      )
      if (!mounted.current) return
      cb.current.onLanded(burst)
    }
    void run()
    return () => void (mounted.current = false)
  }, [])

  const { target } = burst
  return (
    <motion.div
      ref={ref}
      className="absolute"
      style={{
        left: target.left + (target.width - big) / 2,
        top: target.top + (target.height - big) / 2,
        width: big,
        height: big,
        scale: rest,
        willChange: 'transform, filter',
      }}
    >
      <DomeSticker sticker={burst.sticker} size={big} />
    </motion.div>
  )
}
