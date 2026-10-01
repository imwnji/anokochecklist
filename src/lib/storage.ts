import type { ChecklistState } from '../types'
import { initialState } from './checklistReducer'

const KEY = 'anoko.checklist.v1'

export function loadState(): ChecklistState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw) as Partial<ChecklistState>
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      customStickers: Array.isArray(parsed.customStickers) ? parsed.customStickers : [],
    }
  } catch {
    return initialState
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
