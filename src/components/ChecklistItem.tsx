import { animate, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import type { ChecklistItem as Item, Sticker } from '../types'
import { DomeSticker } from './DomeSticker'
import { EDGE_STYLE, SketchBorder, Surface } from './Sketch'

export const SLOT_SIZE = 60
/**
 * Row minus the 64px sticker spot and 12px gap: the full width on phones, 3/4 of it from `sm` up;
 * the pill + spot pair is centred.
 */
const PILL_WIDTH = 'w-[calc(100%-76px)] sm:w-[calc((100%-76px)*0.75)]'

interface Props {
  item: Item
  /** The sticker stuck on this item (when done). */
  sticker: Sticker
  /** Sticker is currently flying towards this slot. */
  landing: boolean
  /** Sticker just landed — play the squash + light sheen. */
  justLanded: boolean
  onToggle: (id: string, slotRect: DOMRect) => void
  /** This row's pill is the one being written in. */
  editing: boolean
  onStartEdit: (id: string) => void
  /** Save the text; `next` = Enter was pressed, so move on to the next blank row. */
  onCommit: (id: string, text: string, next: boolean) => void
  onCancelEdit: (id: string) => void
  onRemove: (id: string) => void
}

/** One to-do row: a borderless rounded pill (tap to write in it) and the sticker spot. */
export function ChecklistItem({
  item,
  sticker,
  landing,
  justLanded,
  editing,
  onToggle,
  onStartEdit,
  onCommit,
  onCancelEdit,
  onRemove,
}: Props) {
  const slotRef = useRef<HTMLDivElement>(null)
  const startEdit = () => {
    if (!item.done) onStartEdit(item.id)
  }

  const blank = !item.text
  const showSticker = item.done && !landing

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30, transition: { duration: 0.18 } }}
      className="flex items-center justify-center gap-3"
    >
      {/* The to-do itself: a pill with no outline */}
      {editing ? (
        <div className={`relative flex h-10 items-center pl-5 pr-1 ${PILL_WIDTH}`}>
          <PaperFill editing />
          <input
            autoFocus
            defaultValue={item.text}
            maxLength={120}
            placeholder="할 일"
            enterKeyHint="next"
            onBlur={(e) => onCommit(item.id, e.currentTarget.value, false)}
            onKeyDown={(e) => {
              // Ignore the Enter that confirms Korean (IME) composition.
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault()
                onCommit(item.id, e.currentTarget.value, true)
              }
              if (e.key === 'Escape') onCancelEdit(item.id)
            }}
            aria-label="할 일 입력"
            className="relative min-w-0 flex-1 bg-transparent text-lg text-ink outline-none placeholder:font-normal placeholder:text-ink-soft/60"
          />
          <button
            type="button"
            // Keep the input from blurring (and saving) before the delete goes through.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onRemove(item.id)}
            aria-label="이 칸 지우기"
            className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl text-ink-soft transition hover:bg-oat hover:text-[#a5573f]"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          aria-label={blank ? '빈 칸, 눌러서 할 일 쓰기' : `${item.text}, 눌러서 고치기`}
          className={`group/pill relative flex h-10 ${PILL_WIDTH} items-center rounded-full px-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage ${
            item.done ? 'cursor-default' : ''
          }`}
        >
          <PaperFill />
          <span
            className={`relative truncate text-lg ${
              blank
                ? 'font-normal text-ink-soft/50'
                : item.done
                  ? 'text-ink-soft line-through decoration-sage decoration-2'
                  : 'text-ink'
            }`}
          >
            {blank ? '할 일' : item.text}
          </span>
        </button>
      )}

      {/* The sticker spot */}
      <button
        type="button"
        aria-pressed={item.done}
        aria-label={item.done ? `${item.text} 완료 취소` : `${item.text || '빈 칸'} 완료하기`}
        disabled={landing || (blank && !item.done)}
        onClick={() => slotRef.current && onToggle(item.id, slotRef.current.getBoundingClientRect())}
        className="group flex h-16 w-16 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage disabled:cursor-default"
      >
        <div
          ref={slotRef}
          className="relative flex items-center justify-center"
          style={{ width: SLOT_SIZE, height: SLOT_SIZE }}
        >
          {showSticker ? (
            <LandedSticker sticker={sticker} justLanded={justLanded} />
          ) : (
            <div
              className={`relative isolate h-full w-full transition-opacity ${
                landing ? '' : blank ? 'opacity-30' : 'opacity-60 group-hover:opacity-100'
              }`}
            >
              {EDGE_STYLE === 'paper' ? (
                // the spot the sticker goes on: a soft paper disc
                <Surface fill={landing ? 'bg-sage-soft' : 'bg-sheet'} radius="50%" />
              ) : (
                <SketchBorder
                  radius="50%"
                  color={landing ? 'var(--color-sage-deep)' : 'var(--color-graphite)'}
                />
              )}
            </div>
          )}
        </div>
      </button>
    </motion.li>
  )
}

/**
 * The pill's paper: a separate layer so the soft, fibrous `#paper-edge` filter only touches
 * the background (the text stays crisp). While writing, a faint sage tint marks the row.
 */
function PaperFill({ editing = false }: { editing?: boolean }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 rounded-full transition-colors ${
        editing
          ? 'bg-[#fbfcf5] shadow-[0_0_0_2px_rgb(141_187_120/0.45)]'
          : 'bg-sheet group-hover/pill:bg-[#fffef9]'
      }`}
      style={{ filter: 'url(#paper-edge)' }}
    />
  )
}

/**
 * A sticker stuck on a to-do. Right after landing it squashes flat and springs back.
 * Started imperatively: the list's `AnimatePresence initial={false}` would otherwise
 * suppress an `initial` prop on rows that were on screen from the start.
 */
function LandedSticker({ sticker, justLanded }: { sticker: Sticker; justLanded: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!justLanded || !ref.current) return
    const a = animate(
      ref.current,
      { scaleX: [1.35, 1], scaleY: [0.7, 1] },
      { type: 'spring', stiffness: 700, damping: 12 },
    )
    return () => a.stop()
  }, [justLanded])
  return (
    <div ref={ref}>
      <DomeSticker sticker={sticker} size={SLOT_SIZE} sheen={justLanded} />
    </div>
  )
}
