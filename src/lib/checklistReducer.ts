import type { ChecklistItem, ChecklistState, Sticker } from '../types'
import { DEFAULT_STICKER_ID } from './defaultStickers'

/** Copies of each sticker kind on a full sheet. */
export const STICKERS_PER_KIND = 5
/** Empty to-do rows on a fresh checklist. */
export const DEFAULT_ROWS = 5

export type ChecklistAction =
  | { type: 'addRow'; id?: string; now?: number }
  | { type: 'remove'; id: string }
  | { type: 'edit'; id: string; text: string }
  | { type: 'complete'; id: string; stickerId: string }
  | { type: 'uncheck'; id: string }
  | { type: 'restock'; stickerId: string }
  | { type: 'addSticker'; sticker: Sticker }
  | { type: 'removeSticker'; id: string }

export const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

const row = (id = newId(), now = Date.now()): ChecklistItem => ({ id, text: '', done: false, createdAt: now })

export const createInitialState = (): ChecklistState => ({
  items: Array.from({ length: DEFAULT_ROWS }, () => row()),
  customStickers: [],
  stock: {},
})

export const stockOf = (state: Pick<ChecklistState, 'stock'>, stickerId: string) =>
  state.stock[stickerId] ?? STICKERS_PER_KIND

export function checklistReducer(state: ChecklistState, action: ChecklistAction): ChecklistState {
  switch (action.type) {
    case 'addRow':
      return { ...state, items: [...state.items, row(action.id, action.now)] }
    case 'remove':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) }
    case 'edit': {
      const text = action.text.trim()
      return { ...state, items: state.items.map((i) => (i.id === action.id ? { ...i, text } : i)) }
    }
    case 'complete': {
      const item = state.items.find((i) => i.id === action.id)
      const left = stockOf(state, action.stickerId)
      // Nothing to complete, or no sticker of that kind left on the sheet.
      if (!item || item.done || !item.text || left <= 0) return state
      return {
        ...state,
        stock: { ...state.stock, [action.stickerId]: left - 1 },
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, done: true, stickerId: action.stickerId } : i,
        ),
      }
    }
    case 'uncheck':
      // A peeled sticker doesn't go back onto the sheet.
      return {
        ...state,
        items: state.items.map((i) => (i.id === action.id ? { ...i, done: false, stickerId: undefined } : i)),
      }
    case 'restock':
      return { ...state, stock: { ...state.stock, [action.stickerId]: STICKERS_PER_KIND } }
    case 'addSticker':
      return {
        ...state,
        customStickers: [...state.customStickers, action.sticker],
        stock: { ...state.stock, [action.sticker.id]: STICKERS_PER_KIND },
      }
    case 'removeSticker': {
      const stock = { ...state.stock }
      delete stock[action.id]
      return {
        ...state,
        stock,
        customStickers: state.customStickers.filter((s) => s.id !== action.id),
        // Items that used the removed sticker fall back to the default one.
        items: state.items.map((i) =>
          i.stickerId === action.id ? { ...i, stickerId: DEFAULT_STICKER_ID } : i,
        ),
      }
    }
  }
}
