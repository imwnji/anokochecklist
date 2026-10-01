import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import type { ChecklistItem as Item, Sticker } from '../types'
import { DomeSticker } from './DomeSticker'
import { SketchBorder } from './Sketch'

export const SLOT_SIZE = 60

interface Props {
  item: Item
  /** The sticker stuck on this item (when done). */
  sticker: Sticker
  /** Sticker is currently flying towards this slot. */
  landing: boolean
  /** Sticker just landed — play the squash + sheen. */
  justLanded: boolean
  onToggle: (id: string, slotRect: DOMRect) => void
  onEdit: (id: string, text: string) => void
  onRemove: (id: string) => void
}

/** One to-do row: a borderless rounded pill (tap to write in it) and the sticker spot. */
export function ChecklistItem({ item, sticker, landing, justLanded, onToggle, onEdit, onRemove }: Props) {
  const slotRef = useRef<HTMLDivElement>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.text)

  const startEdit = () => {
    if (item.done) return
    setDraft(item.text)
    setEditing(true)
  }
  const save = () => {
    onEdit(item.id, draft)
    setEditing(false)
  }

  const blank = !item.text
  const showSticker = item.done && !landing

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30, transition: { duration: 0.18 } }}
      className="flex items-center gap-3"
    >
      {/* The to-do itself: a pill with no outline */}
      {editing ? (
        <div className="relative flex h-16 min-w-0 flex-1 items-center rounded-full bg-sheet pl-6 pr-2 ring-2 ring-sage/60">
          <input
            autoFocus
            value={draft}
            maxLength={120}
            placeholder="할 일"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
              if (e.key === 'Escape') setEditing(false)
            }}
            aria-label="할 일 입력"
            className="min-w-0 flex-1 bg-transparent text-lg font-bold text-ink outline-none placeholder:font-normal placeholder:text-ink-soft/60"
          />
          <button
            type="button"
            // Keep the input from blurring (and saving) before the delete goes through.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onRemove(item.id)}
            aria-label="이 칸 지우기"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-ink-soft transition hover:bg-oat hover:text-[#a5573f]"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          aria-label={blank ? '빈 칸, 눌러서 할 일 쓰기' : `${item.text}, 눌러서 고치기`}
          className={`flex h-16 min-w-0 flex-1 items-center rounded-full bg-sheet px-6 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage ${
            item.done ? 'cursor-default' : 'hover:bg-sheet/70'
          }`}
        >
          <span
            className={`truncate text-lg font-bold ${
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
            <motion.div
              key={justLanded ? 'landed' : 'static'}
              initial={justLanded ? { scaleX: 1.35, scaleY: 0.7 } : false}
              animate={{ scaleX: 1, scaleY: 1 }}
              transition={{ type: 'spring', stiffness: 700, damping: 12 }}
            >
              <DomeSticker sticker={sticker} size={SLOT_SIZE} sheen={justLanded} />
            </motion.div>
          ) : (
            <div
              className={`relative h-full w-full transition-opacity ${
                landing ? '' : blank ? 'opacity-30' : 'opacity-60 group-hover:opacity-100'
              }`}
            >
              <SketchBorder
                radius="50%"
                color={landing ? 'var(--color-sage-deep)' : 'var(--color-graphite)'}
              />
            </div>
          )}
        </div>
      </button>
    </motion.li>
  )
}
