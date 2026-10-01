import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import type { ChecklistItem as Item, Sticker } from '../types'
import { DomeSticker } from './DomeSticker'
import { StickerPicker } from './StickerPicker'

export const SLOT_SIZE = 64

interface Props {
  item: Item
  sticker: Sticker
  stickers: Sticker[]
  /** Sticker is currently flying towards this slot. */
  landing: boolean
  /** Sticker just landed — play the squash + sheen. */
  justLanded: boolean
  onToggle: (id: string, slotRect: DOMRect) => void
  onEdit: (id: string, text: string, stickerId: string) => void
  onRemove: (id: string) => void
  onUploadSticker: (sticker: Sticker) => void
  onRemoveSticker: (id: string) => void
}

export function ChecklistItem({
  item,
  sticker,
  stickers,
  landing,
  justLanded,
  onToggle,
  onEdit,
  onRemove,
  onUploadSticker,
  onRemoveSticker,
}: Props) {
  const slotRef = useRef<HTMLDivElement>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.text)
  const [draftSticker, setDraftSticker] = useState(item.stickerId)

  const startEdit = () => {
    setDraft(item.text)
    setDraftSticker(item.stickerId)
    setEditing(true)
  }
  const save = () => {
    if (!draft.trim()) return
    onEdit(item.id, draft, draftSticker)
    setEditing(false)
  }

  const showSticker = item.done && !landing

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
      className="paper grid grid-cols-[1fr_auto] items-stretch overflow-hidden rounded-2xl"
    >
      {/* Left: text + edit / delete */}
      <div className="flex min-w-0 flex-col justify-center gap-2 p-4">
        {editing ? (
          <div className="flex flex-col gap-3">
            <input
              autoFocus
              value={draft}
              maxLength={200}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save()
                if (e.key === 'Escape') setEditing(false)
              }}
              aria-label="항목 수정"
              className="rounded-xl border border-line bg-paper/60 px-3 py-2 text-ink outline-none focus:border-sage focus:bg-sheet"
            />
            <StickerPicker
              stickers={stickers}
              selectedId={draftSticker}
              onSelect={setDraftSticker}
              onUpload={onUploadSticker}
              onRemove={onRemoveSticker}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={save}
                className="rounded-xl bg-sage px-3 py-1.5 text-sm font-bold text-white hover:bg-sage-deep"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-xl border border-line bg-sheet px-3 py-1.5 text-sm font-bold text-ink-soft"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <>
            <p
              className={`break-words text-lg font-bold leading-snug transition-colors ${
                item.done ? 'text-ink-soft line-through decoration-sage decoration-2' : 'text-ink'
              }`}
            >
              {item.text}
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={startEdit}
                className="rounded-lg border border-line px-2.5 py-1 text-xs font-bold text-ink-soft transition hover:bg-oat hover:text-ink"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="rounded-lg border border-line px-2.5 py-1 text-xs font-bold text-[#a5573f] transition hover:bg-oat"
              >
                삭제
              </button>
            </div>
          </>
        )}
      </div>

      {/* Right: completion cell */}
      <button
        type="button"
        aria-pressed={item.done}
        aria-label={item.done ? `${item.text} 완료 취소` : `${item.text} 완료하기`}
        disabled={landing}
        onClick={() => slotRef.current && onToggle(item.id, slotRef.current.getBoundingClientRect())}
        className={`flex w-24 items-center justify-center border-l border-dashed border-line transition-colors sm:w-28 ${
          item.done ? 'bg-sage-soft/60' : 'bg-oat/50 hover:bg-oat'
        } focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-sage`}
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
              className={`h-full w-full rounded-full border-2 border-dashed ${
                landing ? 'border-sage bg-sage-soft/50' : 'border-beige'
              } flex items-center justify-center text-2xl font-black text-beige`}
            >
              {!landing && '✓'}
            </div>
          )}
        </div>
      </button>
    </motion.li>
  )
}
