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
    <form onSubmit={submit} className="glass-panel rounded-3xl p-4 sm:p-5">
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="할 일을 입력하세요"
          aria-label="새 체크리스트 항목"
          maxLength={200}
          className="min-w-0 flex-1 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-base text-[var(--ink)] shadow-inner outline-none placeholder:text-[var(--ink-soft)] focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-300"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="shrink-0 rounded-2xl bg-gradient-to-b from-fuchsia-500 to-violet-600 px-5 font-bold text-white shadow-[0_8px_18px_-8px_rgb(124_58_237/0.8),inset_0_1px_0_rgb(255_255_255/0.4)] transition active:translate-y-px disabled:opacity-40"
        >
          추가
        </button>
      </div>
      <p className="mb-2 mt-4 text-xs font-bold tracking-widest text-[var(--ink-soft)] uppercase">Sticker</p>
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
