import { useRef, useState } from 'react'
import { imageFileToStickerSrc } from '../lib/imageToSticker'
import { newId } from '../lib/checklistReducer'
import type { Sticker } from '../types'
import { GlassSticker } from './GlassSticker'

interface Props {
  stickers: Sticker[]
  selectedId: string
  onSelect: (id: string) => void
  onUpload: (sticker: Sticker) => void
  onRemove: (id: string) => void
}

export function StickerPicker({ stickers, selectedId, onSelect, onUpload, onRemove }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      const src = await imageFileToStickerSrc(file)
      const sticker: Sticker = {
        id: `custom-${newId()}`,
        name: file.name.replace(/\.[^.]+$/, '') || '내 스티커',
        src,
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
      <div className="flex flex-wrap items-center gap-3" role="radiogroup" aria-label="스티커 선택">
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
                className={`rounded-[32%] p-1 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 ${
                  selected
                    ? 'scale-110 ring-2 ring-fuchsia-500 ring-offset-2 ring-offset-white/40'
                    : 'opacity-80 hover:opacity-100'
                }`}
              >
                <GlassSticker sticker={s} size={44} />
              </button>
              {s.custom && (
                <button
                  type="button"
                  onClick={() => onRemove(s.id)}
                  aria-label={`${s.name} 스티커 삭제`}
                  className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-[var(--ink)] text-[11px] font-bold text-white shadow group-hover:flex group-focus-within:flex"
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
          className="flex h-[52px] items-center gap-1.5 rounded-2xl border-2 border-dashed border-fuchsia-300 px-3 text-sm font-bold text-fuchsia-600 transition hover:border-fuchsia-500 hover:bg-white/50 disabled:opacity-50"
        >
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
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </div>
  )
}
