import type { Sticker } from '../types'
import fluffy from '../assets/stickers/sticker-fluffy.png'
import fluffyShape from '../assets/stickers/sticker-fluffy-shape.png'
import horn from '../assets/stickers/sticker-horn.png'
import hornShape from '../assets/stickers/sticker-horn-shape.png'
import fluffySound from '../assets/sounds/after-fluffy.mp3'
import hornSound from '../assets/sounds/after-horn.mp3'
import fluffyMp4 from '../assets/videos/after-fluffy.mp4'
import fluffyWebm from '../assets/videos/after-fluffy.webm'
import hornMp4 from '../assets/videos/after-horn.mp4'
import hornWebm from '../assets/videos/after-horn.webm'

// Background-removed character art + die-cut outline masks (transparent PNG, 360×360),
// plus the clip (sound + cut-out video) that plays right after each sticker lands.
export const DEFAULT_STICKERS: Sticker[] = [
  {
    id: 'default-fluffy',
    name: '복슬이',
    src: fluffy,
    shape: fluffyShape,
    sound: fluffySound,
    soundFadeIn: false,
    video: { mp4: fluffyMp4, webm: fluffyWebm },
  },
  {
    id: 'default-horn',
    name: '뿔이',
    src: horn,
    shape: hornShape,
    gloss: 0.6,
    sound: hornSound,
    video: { mp4: hornMp4, webm: hornWebm },
  },
]

export const DEFAULT_STICKER_ID = DEFAULT_STICKERS[0].id
