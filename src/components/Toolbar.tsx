import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'

interface Props {
  hideDone: boolean
  onToggleHideDone: () => void
  onReset: () => void
  muted: boolean
  onToggleMute: () => void
}

/** Pencil-style icon buttons in the top-right corner. */
export function Toolbar({ hideDone, onToggleHideDone, onReset, muted, onToggleMute }: Props) {
  return (
    <div className="no-drag fixed right-3 top-3 z-40 flex items-center gap-1">
      <IconButton
        label={hideDone ? '완료한 할 일 보이기' : '완료한 할 일 숨기기'}
        pressed={hideDone}
        onClick={onToggleHideDone}
      >
        {/* eye / eye with a slash */}
        <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
        <circle cx="12" cy="12" r="2.8" />
        {hideDone && <path d="M4 4l16 16" />}
      </IconButton>
      <ResetButton onReset={onReset} />
      <IconButton label={muted ? '소리 켜기' : '소리 끄기'} pressed={muted} onClick={onToggleMute}>
        <path d="M4 9v6h4l5 4V5L8 9H4z" />
        {muted ? (
          <path d="M17 9l5 6M22 9l-5 6" />
        ) : (
          <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
        )}
      </IconButton>
    </div>
  )
}

function IconButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string
  pressed?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition hover:text-ink ${
        pressed ? 'text-sage-deep' : 'text-ink-soft'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: 'url(#pencil)' }}
        aria-hidden
      >
        {children}
      </svg>
    </button>
  )
}

/**
 * Resets everything (sticker sheet and all to-dos). Wiping is not undoable, so the
 * first click only arms it ("초기화?"); a second click within 3 s does the reset.
 */
function ResetButton({ onReset }: { onReset: () => void }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const id = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(id)
  }, [armed])

  return (
    <div className="flex items-center">
      <AnimatePresence>
        {armed && (
          <motion.span
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            className="mr-1 whitespace-nowrap text-sm text-[#a5573f]"
          >
            모두 초기화할까요?
          </motion.span>
        )}
      </AnimatePresence>
      <IconButton
        label={armed ? '한 번 더 누르면 스티커와 할 일이 모두 초기화돼요' : '모두 초기화'}
        pressed={armed}
        onClick={() => {
          if (armed) {
            setArmed(false)
            onReset()
          } else setArmed(true)
        }}
      >
        <path d="M20 11a8 8 0 1 0-2.3 5.7" />
        <path d="M20 4v7h-7" />
      </IconButton>
    </div>
  )
}
