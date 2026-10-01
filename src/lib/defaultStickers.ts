import type { Sticker } from '../types'
import fluffy from '../assets/stickers/sticker-fluffy.png'
import horn from '../assets/stickers/sticker-horn.png'

// Background-removed character art (transparent PNG, 320×320).
export const DEFAULT_STICKERS: Sticker[] = [
  { id: 'default-fluffy', name: '복슬이', src: fluffy },
  { id: 'default-horn', name: '뿔이', src: horn },
]

export const DEFAULT_STICKER_ID = DEFAULT_STICKERS[0].id
