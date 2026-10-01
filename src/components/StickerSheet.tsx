import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { STICKERS_PER_KIND } from '../lib/checklistReducer'
import { imageFileToSticker } from '../lib/imageToSticker'
import { newId } from '../lib/checklistReducer'
import type { Sticker } from '../types'
import { DomeSticker } from './DomeSticker'
import { SketchBorder } from './Sketch'

export const STICKER_SHEET_ID = 'sticker-sheet'

interface Props {
  stickers: Sticker[]
  stockOf: (stickerId: string) => number
  selectedId: string
  size: number
  onSelect: (id: string) => void
  onRestock: (id: string) => void
  onUpload: (sticker: Sticker) => void
  onRemove: (id: string) => void
}

/**
 * A sheet of stickers: several copies of each kind. Completing a to-do peels the
 * right-most remaining copy of the selected kind off the sheet, leaving the glossy
 * backing-paper mark behind. An empty kind shows a refresh button that restocks it.
 */
export function StickerSheet({
  stickers,
  stockOf,
  selectedId,
  size,
  onSelect,
  onRestock,
  onUpload,
  onRemove,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Skip the "stuck back on" pop for stickers already on the sheet at first render.
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      const { src, shape } = await imageFileToSticker(file)
      const sticker: Sticker = {
        id: `custom-${newId()}`,
        name: file.name.replace(/\.[^.]+$/, '') || '내 스티커',
        src,
        shape,
        custom: true,
      }
      onUpload(sticker)
      onSelect(sticker.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : '업로드에 실패했어요.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <section className="relative rounded-[28px] bg-oat px-2 py-3 sm:px-4" aria-label="스티커 판">
      <SketchBorder radius={28} />
      <div
        id={STICKER_SHEET_ID}
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 sm:gap-x-4"
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
                className={`relative flex cursor-pointer rounded-[22px] px-1 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage ${
                  selected ? 'bg-sage-soft/80' : 'hover:bg-sheet/50'
                }`}
              >
                {selected && <SketchBorder radius={22} color="var(--color-sage-deep)" />}
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
                      {i < left && (
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
                    className="absolute left-1/2 top-1/2 -ml-5 -mt-5 flex h-10 w-10 items-center sm:-ml-6 sm:-mt-6 sm:h-12 sm:w-12 justify-center rounded-full bg-sheet text-sage-deep shadow-[0_3px_8px_-3px_rgb(90_70_40/0.35)]"
                  >
                    <SketchBorder radius="50%" color="var(--color-sage-deep)" />
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

              {s.custom && (
                <button
                  type="button"
                  onClick={() => onRemove(s.id)}
                  aria-label={`${s.name} 스티커 삭제`}
                  className="absolute -right-1 -top-1 z-10 hidden h-5 w-5 items-center justify-center rounded-full bg-sheet text-[12px] font-bold text-ink-soft shadow-sm group-hover:flex group-focus-within:flex hover:text-ink"
                >
                  ×
                </button>
              )}
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          aria-label="이미지로 스티커 만들기"
          title="이미지로 스티커 만들기"
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-lg sm:h-10 sm:w-10 sm:text-xl text-ink-soft transition hover:text-sage-deep disabled:opacity-50"
        >
          <SketchBorder radius="50%" strokeWidth={1.3} dash="5 4" />
          {busy ? '…' : '+'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="mt-2 text-center text-sm text-[#a5573f]">{error}</p>}
    </section>
  )
}
