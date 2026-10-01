import { describe, expect, it } from 'vitest'
import { STICKERS_PER_KIND, checklistReducer, createInitialState, stockOf } from './checklistReducer'
import { DEFAULT_STICKER_ID } from './defaultStickers'
import type { ChecklistState } from '../types'

const base = (): ChecklistState => ({ items: [], customStickers: [], stock: {} })
const withRow = (text = 'a') => {
  let s = checklistReducer(base(), { type: 'addRow', id: 'a', now: 1 })
  s = checklistReducer(s, { type: 'edit', id: 'a', text })
  return s
}

describe('checklistReducer', () => {
  it('starts with five blank rows and a full sheet', () => {
    const s = createInitialState()
    expect(s.items).toHaveLength(5)
    expect(s.items.every((i) => i.text === '' && !i.done)).toBe(true)
    expect(stockOf(s, DEFAULT_STICKER_ID)).toBe(STICKERS_PER_KIND)
  })

  it('adds blank rows, edits (trimmed, may be cleared) and removes', () => {
    let s = withRow('  우유 사기  ')
    expect(s.items[0]).toEqual({ id: 'a', text: '우유 사기', done: false, createdAt: 1 })
    s = checklistReducer(s, { type: 'edit', id: 'a', text: '  ' })
    expect(s.items[0].text).toBe('')
    s = checklistReducer(s, { type: 'remove', id: 'a' })
    expect(s.items).toHaveLength(0)
  })

  it('completing peels one sticker off the sheet; unchecking does not return it', () => {
    let s = withRow()
    s = checklistReducer(s, { type: 'complete', id: 'a', stickerId: 'default-horn' })
    expect(s.items[0]).toMatchObject({ done: true, stickerId: 'default-horn' })
    expect(stockOf(s, 'default-horn')).toBe(STICKERS_PER_KIND - 1)
    s = checklistReducer(s, { type: 'uncheck', id: 'a' })
    expect(s.items[0]).toMatchObject({ done: false, stickerId: undefined })
    expect(stockOf(s, 'default-horn')).toBe(STICKERS_PER_KIND - 1)
  })

  it('refuses to complete blank rows or with an empty sheet, and restocks', () => {
    const blank = checklistReducer(base(), { type: 'addRow', id: 'b' })
    expect(checklistReducer(blank, { type: 'complete', id: 'b', stickerId: 'x' })).toBe(blank)
    const empty = { ...withRow(), stock: { x: 0 } }
    expect(checklistReducer(empty, { type: 'complete', id: 'a', stickerId: 'x' })).toBe(empty)
    expect(stockOf(checklistReducer(empty, { type: 'restock', stickerId: 'x' }), 'x')).toBe(STICKERS_PER_KIND)
  })

  it('falls back to the default sticker when a custom sticker is removed', () => {
    let s = checklistReducer(withRow(), {
      type: 'addSticker',
      sticker: { id: 'custom-1', name: 'me', src: 'data:', custom: true },
    })
    s = checklistReducer(s, { type: 'complete', id: 'a', stickerId: 'custom-1' })
    s = checklistReducer(s, { type: 'removeSticker', id: 'custom-1' })
    expect(s.customStickers).toHaveLength(0)
    expect(s.stock['custom-1']).toBeUndefined()
    expect(s.items[0].stickerId).toBe(DEFAULT_STICKER_ID)
  })
})
