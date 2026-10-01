import type { ChecklistItem, ChecklistState, Sticker } from '../types'
import { DEFAULT_STICKER_ID } from './defaultStickers'

export type ChecklistAction =
  | { type: 'add'; text: string; stickerId: string; id?: string; now?: number }
  | { type: 'remove'; id: string }
  | { type: 'edit'; id: string; text: string; stickerId?: string }
  | { type: 'setDone'; id: string; done: boolean }
  | { type: 'addSticker'; sticker: Sticker }
  | { type: 'removeSticker'; id: string }

export const initialState: ChecklistState = { items: [], customStickers: [] }

export const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

export function checklistReducer(state: ChecklistState, action: ChecklistAction): ChecklistState {
  switch (action.type) {
    case 'add': {
      const text = action.text.trim()
      if (!text) return state
      const item: ChecklistItem = {
        id: action.id ?? newId(),
        text,
        done: false,
        stickerId: action.stickerId,
        createdAt: action.now ?? Date.now(),
      }
      return { ...state, items: [...state.items, item] }
    }
    case 'remove':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) }
    case 'edit': {
      const text = action.text.trim()
      if (!text) return state
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, text, stickerId: action.stickerId ?? i.stickerId } : i,
        ),
      }
    }
    case 'setDone':
      return {
        ...state,
        items: state.items.map((i) => (i.id === action.id ? { ...i, done: action.done } : i)),
      }
    case 'addSticker':
      return { ...state, customStickers: [...state.customStickers, action.sticker] }
    case 'removeSticker':
      return {
        ...state,
        customStickers: state.customStickers.filter((s) => s.id !== action.id),
        // Items that used the removed sticker fall back to the default one.
        items: state.items.map((i) =>
          i.stickerId === action.id ? { ...i, stickerId: DEFAULT_STICKER_ID } : i,
        ),
      }
  }
}
