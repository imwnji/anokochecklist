import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

export interface VideoPopupState {
  key: string
  video: { mp4: string; webm: string }
}

/** H.264 MP4 where supported (Safari, Chrome, Edge…), VP9 WebM otherwise (e.g. Linux Chromium). */
export const pickVideo = (v: { mp4: string; webm: string }) =>
  document.createElement('video').canPlayType('video/mp4; codecs="avc1.640028"') ? v.mp4 : v.webm

interface Props {
  popup: VideoPopupState | null
  onDone: () => void
}

/**
 * Shows a character clip in the middle of the screen with its background removed.
 *
 * The clips are "stacked alpha" MP4s (top half = colour, bottom half = alpha mask), made
 * from the original videos by cutting the characters out along their ink outlines with a
 * soft, paper-like edge. They're composited onto a canvas each frame, which works in every
 * browser (including iOS Safari, which can't play VP9-with-alpha WebM). Muted: the sticker's
 * own sound clip already plays alongside.
 */
export function CutoutVideoPopup({ popup, onDone }: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center p-4" aria-hidden>
      <AnimatePresence>
        {popup && <CutoutVideo key={popup.key} src={pickVideo(popup.video)} onDone={onDone} />}
      </AnimatePresence>
    </div>
  )
}

function CutoutVideo({ src, onDone }: { src: string; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.src = src
    const scratch = document.createElement('canvas')
    const sctx = scratch.getContext('2d', { willReadFrequently: true })!
    let raf = 0
    let stopped = false

    const draw = () => {
      if (stopped) return
      const w = video.videoWidth
      const h = video.videoHeight / 2
      if (w && h) {
        if (canvas.width !== w) {
          canvas.width = scratch.width = w
          canvas.height = h
          scratch.height = h * 2
        }
        sctx.drawImage(video, 0, 0)
        const colour = sctx.getImageData(0, 0, w, h)
        const mask = sctx.getImageData(0, h, w, h).data
        const px = colour.data
        for (let i = 3; i < px.length; i += 4) px[i] = mask[i - 3]
        ctx.putImageData(colour, 0, 0)
      }
      raf = requestAnimationFrame(draw)
    }
    video.addEventListener('playing', () => {
      cancelAnimationFrame(raf)
      draw()
    })
    video.addEventListener('ended', () => done.current())
    video.addEventListener('error', () => done.current())
    void video.play().catch(() => done.current())

    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [src])

  return (
    <motion.canvas
      ref={canvasRef}
      className="pointer-events-auto w-[min(88vw,560px)] cursor-pointer"
      // slightly see-through, so it floats over the page rather than covering it
      initial={{ opacity: 0, scale: 0.9, y: 12 }}
      animate={{ opacity: 0.92, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.35 } }}
      transition={{ type: 'spring', bounce: 0.35, duration: 0.5 }}
      onClick={() => done.current()}
      title="닫기"
    />
  )
}
