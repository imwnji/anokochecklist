import type { Sticker } from '../types'
import fluffy from '../assets/stickers/sticker-fluffy.png'
import fluffyShape from '../assets/stickers/sticker-fluffy-shape.png'
import horn from '../assets/stickers/sticker-horn.png'
import hornShape from '../assets/stickers/sticker-horn-shape.png'

// Background-removed character art + die-cut outline masks (transparent PNG, 360×360).
export const DEFAULT_STICKERS: Sticker[] = [
  // 복슬이 is almost all white, so the same glare reads much stronger on it — tone it down.
  { id: 'default-fluffy', name: '복슬이', src: fluffy, shape: fluffyShape, gloss: 0.55 },
  { id: 'default-horn', name: '뿔이', src: horn, shape: hornShape },
]

export const DEFAULT_STICKER_ID = DEFAULT_STICKERS[0].id
