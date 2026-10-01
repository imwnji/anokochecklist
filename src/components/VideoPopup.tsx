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
 * Plays the sticker's clip in the middle of the screen, slightly see-through, with its
 * edges fading out softly so it floats on the paper instead of sitting in a hard box.
 * Muted: the sticker's own sound clip already plays alongside.
 */
export function VideoPopup({ popup, onDone }: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center p-4" aria-hidden>
      <AnimatePresence>
        {popup && <Clip key={popup.key} src={pickVideo(popup.video)} onDone={onDone} />}
      </AnimatePresence>
    </div>
  )
}

/** Fades every edge to transparent: two soft gradients, intersected. */
const EDGE_FADE = [
  'linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)',
  'linear-gradient(to bottom, transparent, #000 13%, #000 87%, transparent)',
].join(', ')

function Clip({ src, onDone }: { src: string; onDone: () => void }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    void ref.current?.play().catch(() => onDone())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.video
      ref={ref}
      src={src}
      muted
      playsInline
      preload="auto"
      onEnded={onDone}
      onError={onDone}
      onClick={onDone}
      title="닫기"
      className="pointer-events-auto w-[min(88vw,560px)] cursor-pointer rounded-[32px]"
      style={{
        maskImage: EDGE_FADE,
        WebkitMaskImage: EDGE_FADE,
        maskComposite: 'intersect',
        WebkitMaskComposite: 'source-in',
      }}
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 0.9, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.4 } }}
      transition={{ type: 'spring', bounce: 0.3, duration: 0.55 }}
    />
  )
}
