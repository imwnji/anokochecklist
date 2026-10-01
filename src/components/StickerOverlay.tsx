import { AnimatePresence, animate, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { Sticker } from '../types'
import { GlassSticker } from './GlassSticker'
import { SLOT_SIZE } from './ChecklistItem'

export interface Burst {
  id: string
  itemId: string
  sticker: Sticker
  /** Bounding rect of the completion slot the sticker flies to. */
  target: DOMRect
}

interface Props {
  bursts: Burst[]
  onPop: (burst: Burst) => void
  onLanded: (burst: Burst) => void
}

/** Full-screen layer that hosts the "sticker pops out of the screen, then slaps into place" animation. */
export function StickerOverlay({ bursts, onPop, onLanded }: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {bursts.map((b) => (
        <BurstSticker key={b.id} burst={b} onPop={onPop} onLanded={onLanded} />
      ))}
    </div>
  )
}

function BurstSticker({
  burst,
  onPop,
  onLanded,
}: {
  burst: Burst
  onPop: (b: Burst) => void
  onLanded: (b: Burst) => void
}) {
  const scope = useRef<HTMLDivElement>(null)
  const [showFx, setShowFx] = useState(true)
  const reduced = useReducedMotion()
  // Keep latest callbacks without restarting the animation.
  const cb = useRef({ onPop, onLanded })
  cb.current = { onPop, onLanded }
  // StrictMode mounts effects twice in dev: start the sequence only once,
  // and keep it running across the simulated remount.
  const started = useRef(false)
  const mounted = useRef(false)

  const { target } = burst
  // Geometry is fixed at launch so re-renders never reset the flight.
  const [geo] = useState(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    return {
      dx: vw / 2 - (target.left + target.width / 2),
      dy: vh / 2 - (target.top + target.height / 2),
      bigScale: Math.min(4.2, (Math.min(vw, vh) * 0.42) / SLOT_SIZE),
    }
  })
  const { dx, dy, bigScale } = geo

  useEffect(() => {
    mounted.current = true
    if (started.current) return () => void (mounted.current = false)
    started.current = true
    const el = scope.current!
    const run = async () => {
      cb.current.onPop(burst)
      if (reduced) {
        cb.current.onLanded(burst)
        return
      }
      // 1) Pop out of the screen with an elastic overshoot
      await animate(
        el,
        { scale: [0, 1], rotate: [-35, 0], opacity: [0, 1] },
        { type: 'spring', bounce: 0.55, duration: 0.75 },
      )
      if (!mounted.current) return
      // 2) Hold + wobble for a beat
      await animate(el, { rotate: [0, -8, 6, 0] }, { duration: 0.35, ease: 'easeInOut' })
      if (!mounted.current) return
      setShowFx(false)
      // 3) Fly to the completion slot and slap on
      await animate(
        el,
        { x: 0, y: 0, scale: 1 / bigScale, rotate: [0, 14, 0] },
        { type: 'spring', bounce: 0.3, duration: 0.55 },
      )
      if (!mounted.current) return
      cb.current.onLanded(burst)
    }
    void run()
    return () => void (mounted.current = false)
  }, [])

  const fxSize = SLOT_SIZE * bigScale

  return (
    <>
      <AnimatePresence>
        {showFx && (
          <motion.div
            key="fx"
            className="absolute left-1/2 top-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.2 } }}
            style={{ x: '-50%', y: '-50%' }}
          >
            {/* Rotating rays */}
            <motion.div
              className="burst-rays absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: fxSize * 2.6,
                height: fxSize * 2.6,
                marginLeft: -fxSize * 1.3,
                marginTop: -fxSize * 1.3,
              }}
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: 1, rotate: 120 }}
              transition={{
                scale: { type: 'spring', bounce: 0.4, duration: 0.6 },
                rotate: { duration: 1.6, ease: 'linear' },
              }}
            />
            {/* Shockwave rings */}
            {[0, 0.12].map((delay) => (
              <motion.div
                key={delay}
                className="absolute left-1/2 top-1/2 rounded-full border-[6px] border-white"
                style={{ width: fxSize, height: fxSize, marginLeft: -fxSize / 2, marginTop: -fxSize / 2 }}
                initial={{ scale: 0.3, opacity: 0.9 }}
                animate={{ scale: 2.4, opacity: 0 }}
                transition={{ duration: 0.8, delay, ease: 'easeOut' }}
              />
            ))}
            {/* Headline */}
            <motion.p
              className="absolute left-1/2 whitespace-nowrap bg-gradient-to-b from-yellow-300 via-pink-500 to-violet-600 bg-clip-text text-5xl font-black italic tracking-tight text-transparent drop-shadow-[0_4px_0_rgb(255_255_255)] sm:text-7xl"
              style={{ top: fxSize / 2 + 12, x: '-50%' }}
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: -4 }}
              transition={{ type: 'spring', bounce: 0.6, duration: 0.6, delay: 0.15 }}
            >
              COMPLETE!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        ref={scope}
        className="absolute"
        style={{
          // Rendered at full pop size (crisp) and scaled down to the slot on landing.
          left: target.left + (target.width - fxSize) / 2,
          top: target.top + (target.height - fxSize) / 2,
          width: fxSize,
          height: fxSize,
          x: dx,
          y: dy,
          scale: 0,
          willChange: 'transform',
          filter: 'drop-shadow(0 30px 30px rgb(60 20 120 / 0.35))',
        }}
      >
        <GlassSticker sticker={burst.sticker} size={fxSize} />
      </motion.div>
    </>
  )
}
