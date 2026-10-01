import { useState, type FormEvent } from 'react'
import type { Sticker } from '../types'
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
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="할 일을 입력하세요"
          aria-label="새 체크리스트 항목"
          maxLength={200}
          className="min-w-0 flex-1 rounded-xl border border-line bg-paper/60 px-4 py-3 text-base text-ink outline-none placeholder:text-ink-soft focus:border-sage focus:bg-sheet"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="shrink-0 rounded-xl bg-sage px-5 font-bold text-white shadow-[inset_0_-2px_0_rgb(0_0_0/0.08)] transition hover:bg-sage-deep active:translate-y-px disabled:bg-beige"
        >
          추가
        </button>
      </div>
      <p className="mb-2 mt-4 text-xs font-bold tracking-widest text-ink-soft uppercase">Sticker</p>
      <StickerPicker
        stickers={stickers}
        selectedId={selectedStickerId}
        onSelect={onSelectSticker}
        onUpload={onUploadSticker}
        onRemove={onRemoveSticker}
      />
    </form>
  )
}
