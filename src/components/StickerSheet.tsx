import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { STICKERS_PER_KIND } from '../lib/checklistReducer'
import type { Sticker } from '../types'
import { DomeSticker } from './DomeSticker'
import { Surface } from './Sketch'

export const STICKER_SHEET_ID = 'sticker-sheet'

interface Props {
  stickers: Sticker[]
  stockOf: (stickerId: string) => number
  selectedId: string
  size: number
  onSelect: (id: string) => void
  onRestock: (id: string) => void
}

/**
 * A sheet of stickers: several copies of each kind. Completing a to-do peels the
 * left-most remaining copy of the selected kind off the sheet, leaving the glossy
 * backing-paper mark behind. An empty kind shows a refresh button that restocks it.
 *
 * Layout: one row of all copies from `md` (768px) up; narrower screens give each kind its own row.
 */
export function StickerSheet({ stickers, stockOf, selectedId, size, onSelect, onRestock }: Props) {
  // Skip the "stuck back on" pop for stickers already on the sheet at first render.
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])

  return (
    <section className="relative isolate px-2 py-5 sm:px-5" aria-label="스티커 판">
      <Surface fill="bg-board" radius={32} />
      <div
        id={STICKER_SHEET_ID}
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 md:flex-nowrap md:gap-x-3"
      >
        {stickers.map((s) => {
          const left = stockOf(s.id)
          const selected = s.id === selectedId
          return (
            <div key={s.id} className="group relative">
              <div
                role="radio"
                aria-checked={selected}
                aria-label={`${s.name} 스티커 (${left}장 남음)`}
                tabIndex={0}
                onClick={() => left > 0 && onSelect(s.id)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && left > 0) {
                    e.preventDefault()
                    onSelect(s.id)
                  }
                }}
                className="group/kind relative isolate flex cursor-pointer rounded-[22px] px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage"
              >
                {selected && (
                  <Surface fill="bg-sage-soft/80" radius={22} pencilColor="var(--color-sage-deep)" />
                )}
                {Array.from({ length: STICKERS_PER_KIND }, (_, i) => (
                  <div
                    key={i}
                    className="relative"
                    style={{ width: size, height: size }}
                    data-sticker-id={s.id}
                    data-copy={i}
                  >
                    {/* glossy backing paper left behind once a sticker is peeled */}
                    <img
                      src={s.shape ?? s.src}
                      alt=""
                      draggable={false}
                      className="absolute inset-0 h-full w-full object-contain opacity-70"
                    />
                    <AnimatePresence initial={false}>
                      {/* peeled from the left, so the remaining copies are the right-most ones */}
                      {i >= STICKERS_PER_KIND - left && (
                        <motion.div
                          key="sticker"
                          className="absolute inset-0"
                          initial={ready ? { scale: 0.4, opacity: 0, rotate: -12 } : false}
                          animate={{ scale: 1, opacity: 1, rotate: 0 }}
                          // Peeled copies vanish at once: the flying sticker takes over.
                          exit={{ opacity: 0, transition: { duration: 0 } }}
                          transition={{ type: 'spring', bounce: 0.5, duration: 0.5, delay: i * 0.06 }}
                        >
                          <DomeSticker sticker={s} size={size} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {left === 0 && (
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRestock(s.id)
                    }}
                    aria-label={`${s.name} 스티커 다시 채우기`}
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', bounce: 0.5, duration: 0.5 }}
                    className="absolute left-1/2 top-1/2 -ml-5 -mt-5 flex h-10 w-10 items-center sm:-ml-6 sm:-mt-6 sm:h-12 sm:w-12 justify-center rounded-full text-sage-deep isolate"
                  >
                    <Surface
                      fill="bg-sheet shadow-[0_3px_8px_-3px_rgb(90_70_40/0.35)]"
                      radius="50%"
                      pencilColor="var(--color-sage-deep)"
                    />
                    <svg
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ filter: 'url(#pencil)' }}
                      aria-hidden
                    >
                      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
                      <path d="M20 4v7h-7" />
                    </svg>
                  </motion.button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
