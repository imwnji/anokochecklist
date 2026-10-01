const OUT = 320
/** Empty space around the artwork, so the die-cut margin fits inside the canvas. */
const PAD = 0.14
/** Die-cut margin around the artwork, relative to the output size. */
const MARGIN = 0.035
/** Max per-channel distance from the border colour that still counts as background. */
const BG_TOLERANCE = 40

export interface ProcessedSticker {
  src: string
  shape: string
}

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('이미지를 읽을 수 없어요.'))
    el.src = url
  })

const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('캔버스를 사용할 수 없어요.')
  return [c, ctx] as const
}

/**
 * If the image has no transparency but a plain, uniform background (like a scan or a
 * drawing on a solid colour), flood-fill that background away from the borders.
 */
export function removeUniformBackground(img: ImageData): void {
  const { width: w, height: h, data } = img
  const border: number[] = []
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x)
  for (let y = 0; y < h; y++) border.push(y * w, y * w + w - 1)

  // Already transparent around the edges → nothing to do.
  const transparent = border.filter((i) => data[i * 4 + 3] < 200).length
  if (transparent > border.length * 0.3) return

  // Most common (quantised) border colour is the background candidate.
  const counts = new Map<number, number>()
  for (const i of border) {
    const key = ((data[i * 4] >> 4) << 8) | ((data[i * 4 + 1] >> 4) << 4) | (data[i * 4 + 2] >> 4)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const [key] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  const bg = [((key >> 8) << 4) + 8, (((key >> 4) & 15) << 4) + 8, ((key & 15) << 4) + 8]
  const isBg = (i: number) =>
    Math.abs(data[i * 4] - bg[0]) < BG_TOLERANCE &&
    Math.abs(data[i * 4 + 1] - bg[1]) < BG_TOLERANCE &&
    Math.abs(data[i * 4 + 2] - bg[2]) < BG_TOLERANCE

  // A busy photo has no single background colour — keep it whole.
  if (border.filter(isBg).length < border.length * 0.6) return

  const seen = new Uint8Array(w * h)
  const stack = border.filter(isBg)
  for (const i of stack) seen[i] = 1
  while (stack.length) {
    const i = stack.pop()!
    data[i * 4 + 3] = 0
    const x = i % w
    const next = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]
    for (const n of next) {
      if (n >= 0 && n < w * h && !seen[n] && isBg(n)) {
        seen[n] = 1
        stack.push(n)
      }
    }
  }
}

/**
 * Turns an uploaded image into a die-cut sticker: background removed (when it is a
 * plain colour), artwork centred on a padded square canvas, plus a silhouette mask that
 * follows the artwork's outline with a small margin.
 */
export async function imageFileToSticker(file: File): Promise<ProcessedSticker> {
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일만 업로드할 수 있어요.')

  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const fit = Math.min(1, (OUT * (1 - 2 * PAD)) / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.max(1, Math.round(img.naturalWidth * fit))
    const h = Math.max(1, Math.round(img.naturalHeight * fit))

    const [cut, cutCtx] = canvas(w, h)
    cutCtx.drawImage(img, 0, 0, w, h)
    const pixels = cutCtx.getImageData(0, 0, w, h)
    removeUniformBackground(pixels)
    cutCtx.putImageData(pixels, 0, 0)

    const scale = (OUT * (1 - 2 * PAD)) / Math.max(w, h)
    const [art, artCtx] = canvas(OUT, OUT)
    const dw = w * scale
    const dh = h * scale
    artCtx.drawImage(cut, (OUT - dw) / 2, (OUT - dh) / 2, dw, dh)

    // Silhouette: dilate the artwork's alpha by stamping it around a circle, then paint white.
    const [shape, shapeCtx] = canvas(OUT, OUT)
    const r = OUT * MARGIN
    for (let a = 0; a < 32; a++) {
      const t = (a / 32) * Math.PI * 2
      shapeCtx.drawImage(art, Math.cos(t) * r, Math.sin(t) * r)
      shapeCtx.drawImage(art, Math.cos(t) * r * 0.5, Math.sin(t) * r * 0.5)
    }
    shapeCtx.drawImage(art, 0, 0)
    shapeCtx.globalCompositeOperation = 'source-in'
    shapeCtx.fillStyle = '#fff'
    shapeCtx.fillRect(0, 0, OUT, OUT)

    const encode = (c: HTMLCanvasElement) => {
      // WebP keeps transparency and is much smaller than PNG; fall back if unsupported.
      const webp = c.toDataURL('image/webp', 0.86)
      return webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/png')
    }
    return { src: encode(art), shape: encode(shape) }
  } finally {
    URL.revokeObjectURL(url)
  }
}
