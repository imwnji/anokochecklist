const MAX_SIZE = 320

/**
 * Loads an uploaded image, center-crops it to a square and downsizes it so the
 * resulting data URL stays small enough for localStorage.
 */
export async function imageFileToStickerSrc(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일만 업로드할 수 있어요.')

  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('이미지를 읽을 수 없어요.'))
      el.src = url
    })

    const side = Math.min(img.naturalWidth, img.naturalHeight)
    const size = Math.min(MAX_SIZE, side)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('캔버스를 사용할 수 없어요.')
    ctx.drawImage(
      img,
      (img.naturalWidth - side) / 2,
      (img.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size,
    )
    // WebP keeps transparency and is much smaller than PNG; fall back if unsupported.
    const webp = canvas.toDataURL('image/webp', 0.86)
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}
