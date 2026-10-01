import { animate, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { Sticker } from '../types'
import { DomeSticker } from './DomeSticker'
import { SLOT_SIZE } from './ChecklistItem'

export interface Burst {
  id: string
  itemId: string
  sticker: Sticker
  /** Where the sticker peels off from (its tile in the sticker list), if visible. */
  from?: DOMRect
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
 * zoomed sticker isn't clipped by anything.
 */
export function StickerOverlay({ bursts, onPop, onLanded }: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {bursts.map((b) => (
        <FlyingSticker key={b.id} burst={b} onPop={onPop} onLanded={onLanded} />
      ))}
    </div>
  )
}

const center = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 })

/**
 * Swooshes out of the sticker list towards the viewer (very close, very big),
 * then without pausing swooshes away into the completion slot.
 */
function FlyingSticker({
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

  // Flight geometry is fixed at launch so re-renders never reset it. The element sits on
  // the slot; x/y are offsets from there. It is rendered at the closest (biggest) size so
  // it stays crisp, and scaled down everywhere else.
  const [geo] = useState(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const big = Math.round(Math.min(vw, vh) * 0.55)
    const end = center(burst.target)
    const fromRect = burst.from ?? burst.target
    const start = center(fromRect)
    // Closest point: between the list and the slot, pulled towards the middle of the screen.
    const apex = {
      x: ((start.x + end.x) / 2 + vw / 2) / 2,
      y: ((start.y + end.y) / 2 + vh / 2) / 2,
    }
    return {
      big,
      start: { x: start.x - end.x, y: start.y - end.y, scale: fromRect.width / big },
      apex: { x: apex.x - end.x, y: apex.y - end.y },
      endScale: SLOT_SIZE / big,
    }
  })
  const { big, start, apex, endScale } = geo

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
      // 1) Swoosh out of the list, right up to the viewer
      await animate(
        el,
        {
          x: [start.x, apex.x],
          y: [start.y, apex.y],
          scale: [start.scale, 1],
          rotate: [0, -8],
          filter: [
            'drop-shadow(0 2px 2px rgb(90 70 40 / 0.3))',
            'drop-shadow(0 50px 40px rgb(90 70 40 / 0.25))',
          ],
        },
        // ends still moving, so there is no pause at the closest point
        { duration: 0.3, ease: [0.2, 0.85, 0.55, 0.92] },
      )
      if (!mounted.current) return
      // 2) …and straight on, swooshing away into the slot
      await animate(
        el,
        {
          x: 0,
          y: 0,
          scale: endScale,
          rotate: 0,
          filter: 'drop-shadow(0 1px 1px rgb(90 70 40 / 0.3))',
        },
        { duration: 0.34, ease: [0.4, 0.1, 0.8, 0.45] },
      )
      if (!mounted.current) return
      cb.current.onLanded(burst)
    }
    void run()
    return () => void (mounted.current = false)
  }, [])

  const end = center(burst.target)
  return (
    <motion.div
      ref={ref}
      className="absolute"
      style={{
        left: end.x - big / 2,
        top: end.y - big / 2,
        width: big,
        height: big,
        x: start.x,
        y: start.y,
        scale: start.scale,
        willChange: 'transform, filter',
      }}
    >
      <DomeSticker sticker={burst.sticker} size={big} />
    </motion.div>
  )
}
