import { describe, expect, it } from 'vitest'
import { checklistReducer, initialState } from './checklistReducer'
import { DEFAULT_STICKER_ID } from './defaultStickers'

const add = (text: string, id: string, stickerId = DEFAULT_STICKER_ID) =>
  checklistReducer(initialState, { type: 'add', text, stickerId, id, now: 1 })

describe('checklistReducer', () => {
  it('adds trimmed items and ignores blank ones', () => {
    const s = add('  우유 사기  ', 'a')
    expect(s.items).toEqual([
      { id: 'a', text: '우유 사기', done: false, stickerId: DEFAULT_STICKER_ID, createdAt: 1 },
    ])
    expect(checklistReducer(s, { type: 'add', text: '   ', stickerId: DEFAULT_STICKER_ID })).toBe(s)
  })

  it('toggles done, edits and removes', () => {
    let s = add('a', 'a')
    s = checklistReducer(s, { type: 'setDone', id: 'a', done: true })
    expect(s.items[0].done).toBe(true)
    s = checklistReducer(s, { type: 'edit', id: 'a', text: 'b', stickerId: 'default-horn' })
    expect(s.items[0]).toMatchObject({ text: 'b', stickerId: 'default-horn', done: true })
    expect(checklistReducer(s, { type: 'edit', id: 'a', text: ' ' })).toBe(s)
    s = checklistReducer(s, { type: 'remove', id: 'a' })
    expect(s.items).toHaveLength(0)
  })

  it('falls back to the default sticker when a custom sticker is removed', () => {
    let s = checklistReducer(initialState, {
      type: 'addSticker',
      sticker: { id: 'custom-1', name: 'me', src: 'data:', custom: true },
    })
    s = checklistReducer(s, { type: 'add', text: 'x', stickerId: 'custom-1', id: 'x' })
    s = checklistReducer(s, { type: 'removeSticker', id: 'custom-1' })
    expect(s.customStickers).toHaveLength(0)
    expect(s.items[0].stickerId).toBe(DEFAULT_STICKER_ID)
  })
})
