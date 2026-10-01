import type { Sticker } from '../types'

/**
 * Sticker art, sounds and videos are copyrighted, so they are NOT in the repository.
 * They are read at runtime from `public/media/` (git-ignored), which you keep locally:
 *
 *   public/media/stickers/sticker-fluffy.png, sticker-fluffy-shape.png,
 *                         sticker-horn.png,   sticker-horn-shape.png
 *   public/media/sounds/after-fluffy.mp3, after-horn.mp3
 *   public/media/videos/after-fluffy.{mp4,webm}, after-horn.{mp4,webm}
 *
 * `npm run build` copies the folder into `dist/` as-is, for your own local use.
 */
const media = (path: string) => `${import.meta.env.BASE_URL}media/${path}`

// Background-removed character art + die-cut outline masks (transparent PNG, 360×360),
// plus the clip (sound + cut-out video) that plays right after each sticker lands.
export const DEFAULT_STICKERS: Sticker[] = [
  {
    id: 'default-fluffy',
    name: '복슬이',
    src: media('stickers/sticker-fluffy.png'),
    shape: media('stickers/sticker-fluffy-shape.png'),
    sound: media('sounds/after-fluffy.mp3'),
    soundFadeIn: false,
    video: { mp4: media('videos/after-fluffy.mp4'), webm: media('videos/after-fluffy.webm') },
  },
  {
    id: 'default-horn',
    name: '뿔이',
    src: media('stickers/sticker-horn.png'),
    shape: media('stickers/sticker-horn-shape.png'),
    gloss: 0.6,
    sound: media('sounds/after-horn.mp3'),
    video: { mp4: media('videos/after-horn.mp4'), webm: media('videos/after-horn.webm') },
  },
]

export const DEFAULT_STICKER_ID = DEFAULT_STICKERS[0].id
