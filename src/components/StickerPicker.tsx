import { useRef, useState } from 'react'
import { imageFileToSticker } from '../lib/imageToSticker'
import { newId } from '../lib/checklistReducer'
import type { Sticker } from '../types'
import { DomeSticker } from './DomeSticker'
import { SketchBorder } from './Sketch'

interface Props {
  /** DOM id, used to find where a sticker flies out from. */
  id?: string
  stickers: Sticker[]
  selectedId: string
  onSelect: (id: string) => void
  onUpload: (sticker: Sticker) => void
  onRemove: (id: string) => void
}

export function StickerPicker({ id, stickers, selectedId, onSelect, onUpload, onRemove }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
    <div>
      <div id={id} className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="스티커 선택">
        {stickers.map((s) => {
          const selected = s.id === selectedId
          return (
            <div key={s.id} className="group relative">
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                title={s.name}
                onClick={() => onSelect(s.id)}
                data-sticker-id={s.id}
                className={`relative flex items-center justify-center rounded-2xl p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage ${
                  selected ? 'bg-sage-soft/70' : 'opacity-75 hover:bg-oat/60 hover:opacity-100'
                }`}
              >
                {selected && <SketchBorder radius={16} color="var(--color-sage-deep)" />}
                <DomeSticker sticker={s} size={52} />
              </button>
              {s.custom && (
                <button
                  type="button"
                  onClick={() => onRemove(s.id)}
                  aria-label={`${s.name} 스티커 삭제`}
                  className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-sheet text-[12px] font-bold text-ink-soft shadow-sm group-hover:flex group-focus-within:flex hover:text-ink"
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
          className="relative ml-1 flex h-[52px] items-center gap-1.5 rounded-2xl px-3 text-sm font-bold text-ink-soft transition hover:text-sage-deep disabled:opacity-50"
        >
          <SketchBorder radius={16} />
          <span className="text-lg leading-none">＋</span>
          {busy ? '처리 중…' : '이미지 업로드'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="mt-2 text-sm text-[#a5573f]">{error}</p>}
    </div>
  )
}
