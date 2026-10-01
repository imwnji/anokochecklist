import { useEffect, useMemo, useReducer, useState } from 'react'
import { checklistReducer } from '../lib/checklistReducer'
import { DEFAULT_STICKERS } from '../lib/defaultStickers'
import { loadState, saveState } from '../lib/storage'
import type { Sticker } from '../types'

export function useChecklist() {
  const [state, dispatch] = useReducer(checklistReducer, undefined, loadState)
  const [storageFull, setStorageFull] = useState(false)

  useEffect(() => {
    setStorageFull(!saveState(state))
  }, [state])

  const stickers = useMemo(() => [...DEFAULT_STICKERS, ...state.customStickers], [state.customStickers])
  const stickerById = useMemo(() => {
    const map = new Map<string, Sticker>(stickers.map((s) => [s.id, s]))
    return (id: string) => map.get(id) ?? DEFAULT_STICKERS[0]
  }, [stickers])

  return { state, dispatch, stickers, stickerById, storageFull }
}
