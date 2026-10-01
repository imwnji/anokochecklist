import { useState, type FormEvent } from 'react'
import type { Sticker } from '../types'
import { SketchBorder } from './Sketch'
import { StickerPicker } from './StickerPicker'

interface Props {
  stickers: Sticker[]
  selectedStickerId: string
  onSelectSticker: (id: string) => void
  onUploadSticker: (sticker: Sticker) => void
  onRemoveSticker: (id: string) => void
  onAdd: (text: string) => void
}

export function ChecklistInput({
  stickers,
  selectedStickerId,
  onSelectSticker,
  onUploadSticker,
  onRemoveSticker,
  onAdd,
}: Props) {
  const [text, setText] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(text)
    setText('')
  }

  return (
    <form onSubmit={submit} className="paper rounded-2xl p-4 sm:p-5">
      <SketchBorder radius={16} />
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <SketchBorder radius={12} />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="할 일을 입력하세요"
            aria-label="새 체크리스트 항목"
            maxLength={200}
            className="w-full rounded-xl bg-transparent px-4 py-3 text-base text-ink outline-none placeholder:text-ink-soft focus:bg-paper/50"
          />
        </div>
        <button
          type="submit"
          disabled={!text.trim()}
          className="relative shrink-0 rounded-xl bg-sage px-5 font-bold text-white transition hover:bg-sage-deep active:translate-y-px disabled:bg-beige"
        >
          <SketchBorder radius={12} color="var(--color-sage-deep)" />
          추가
        </button>
      </div>
      <p className="mb-2 mt-4 text-xs font-bold tracking-widest text-ink-soft uppercase">Sticker</p>
      <StickerPicker
        stickers={stickers}
        id="main-sticker-picker"
        selectedId={selectedStickerId}
        onSelect={onSelectSticker}
        onUpload={onUploadSticker}
        onRemove={onRemoveSticker}
      />
    </form>
  )
}
