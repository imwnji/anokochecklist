import type { ChecklistState } from '../types'
import { createInitialState } from './checklistReducer'

// v2: blank-row checklist with a sticker sheet (v1 data is not migrated).
const KEY = 'anoko.checklist.v2'

export function loadState(): ChecklistState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw) as Partial<ChecklistState>
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      customStickers: Array.isArray(parsed.customStickers) ? parsed.customStickers : [],
      stock: parsed.stock && typeof parsed.stock === 'object' ? parsed.stock : {},
    }
  } catch {
    return createInitialState()
  }
}

/** Returns false when the browser refused to store (e.g. quota exceeded). */
export function saveState(state: ChecklistState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
