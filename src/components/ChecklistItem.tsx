import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import type { ChecklistItem as Item, Sticker } from '../types'
import { DomeSticker } from './DomeSticker'
import { SketchBorder } from './Sketch'
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
      className="paper grid grid-cols-[1fr_auto] items-stretch rounded-2xl"
    >
      <SketchBorder radius={16} />
      {/* Left: text + edit / delete */}
      <div className="flex min-w-0 flex-col justify-center gap-2 p-4">
        {editing ? (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <SketchBorder radius={12} />
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
                className="w-full rounded-xl bg-transparent px-3 py-2 text-ink outline-none focus:bg-paper/50"
              />
            </div>
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
                className="relative rounded-xl bg-sage px-3 py-1.5 text-sm font-bold text-white hover:bg-sage-deep"
              >
                <SketchBorder radius={12} color="var(--color-sage-deep)" />
                저장
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="relative rounded-xl px-3 py-1.5 text-sm font-bold text-ink-soft hover:text-ink"
              >
                <SketchBorder radius={12} />
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
                className="relative rounded-lg px-2.5 py-1 text-xs font-bold text-ink-soft transition hover:bg-oat/60 hover:text-ink"
              >
                <SketchBorder radius={8} strokeWidth={1.3} dash="5 4" />
                수정
              </button>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="relative rounded-lg px-2.5 py-1 text-xs font-bold text-[#a5573f] transition hover:bg-oat/60"
              >
                <SketchBorder radius={8} strokeWidth={1.3} dash="5 4" color="#a5573f" />
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
        className="group flex w-24 items-center justify-center rounded-r-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage sm:w-28"
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
            // Only the spot where the sticker goes is marked, with a pencil-dashed circle.
            <div className="relative flex h-full w-full items-center justify-center">
              <SketchBorder
                radius="50%"
                color={landing ? 'var(--color-sage-deep)' : 'var(--color-graphite)'}
                className={landing ? '' : 'opacity-60 transition-opacity group-hover:opacity-100'}
              />
              {!landing && (
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  className="opacity-40 transition-opacity group-hover:opacity-70"
                  style={{ filter: 'url(#pencil)' }}
                  aria-hidden
                >
                  <path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    fill="none"
                    stroke="var(--color-graphite)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          )}
        </div>
      </button>
    </motion.li>
  )
}
