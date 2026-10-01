import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { soundManager } from './audio/SoundManager'
import { ChecklistInput } from './components/ChecklistInput'
import { ChecklistItem } from './components/ChecklistItem'
import { StickerOverlay, type Burst } from './components/StickerOverlay'
import { useChecklist } from './hooks/useChecklist'
import { newId } from './lib/checklistReducer'
import { DEFAULT_STICKER_ID } from './lib/defaultStickers'

export default function App() {
  const { state, dispatch, stickers, stickerById, storageFull } = useChecklist()
  const [selectedStickerId, setSelectedStickerId] = useState(DEFAULT_STICKER_ID)
  const [bursts, setBursts] = useState<Burst[]>([])
  const [justLanded, setJustLanded] = useState<Set<string>>(new Set())
  const [muted, setMuted] = useState(soundManager.muted)
  const reduced = useReducedMotion() ?? false
  const shake = useAnimationControls()

  // If the selected custom sticker gets deleted, fall back to the default one.
  useEffect(() => {
    if (!stickers.some((s) => s.id === selectedStickerId)) setSelectedStickerId(DEFAULT_STICKER_ID)
  }, [stickers, selectedStickerId])

  const landingIds = new Set(bursts.map((b) => b.itemId))
  const doneCount = state.items.filter((i) => i.done).length
  const total = state.items.length

  const handleToggle = (id: string, slotRect: DOMRect) => {
    const item = state.items.find((i) => i.id === id)
    if (!item || landingIds.has(id)) return
    if (item.done) {
      soundManager.playTick(false)
      dispatch({ type: 'setDone', id, done: false })
      return
    }
    dispatch({ type: 'setDone', id, done: true })
    setBursts((b) => [
      ...b,
      { id: newId(), itemId: id, sticker: stickerById(item.stickerId), target: slotRect },
    ])
  }

  const handlePop = useCallback((_: Burst) => {
    soundManager.playCelebration()
  }, [])

  const handleLanded = useCallback(
    (burst: Burst) => {
      soundManager.playStick()
      setBursts((b) => b.filter((x) => x.id !== burst.id))
      setJustLanded((s) => new Set(s).add(burst.itemId))
      setTimeout(
        () =>
          setJustLanded((s) => {
            const next = new Set(s)
            next.delete(burst.itemId)
            return next
          }),
        1000,
      )
      if (!reduced)
        void shake.start({ x: [0, -8, 7, -5, 3, 0], y: [0, 4, -3, 2, 0], transition: { duration: 0.35 } })
    },
    [reduced, shake],
  )

  const toggleMute = () => {
    soundManager.setMuted(!muted)
    setMuted(!muted)
  }

  return (
    <>
      <motion.main animate={shake} className="mx-auto w-full max-w-2xl px-4 pb-24 pt-10 sm:pt-14">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-ink sm:text-5xl">
              Anoko <span className="text-sage">Checklist</span>
            </h1>
            <p className="mt-1 text-sm font-bold text-ink-soft">
              {total === 0 ? '오늘 할 일을 추가해보세요' : `${doneCount} / ${total} 완료`}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleMute}
            aria-pressed={muted}
            aria-label={muted ? '소리 켜기' : '소리 끄기'}
            className="paper flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-soft transition hover:text-ink"
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M4 9v6h4l5 4V5L8 9H4z" />
              {muted ? (
                <path d="M17 9l5 6M22 9l-5 6" />
              ) : (
                <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
              )}
            </svg>
          </button>
        </header>

        {total > 0 && (
          <div
            className="mb-6 h-2.5 overflow-hidden rounded-full border border-line bg-oat"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={doneCount}
          >
            <motion.div
              className="h-full rounded-full bg-sage"
              animate={{ width: `${(doneCount / total) * 100}%` }}
              transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
            />
          </div>
        )}

        <ChecklistInput
          stickers={stickers}
          selectedStickerId={selectedStickerId}
          onSelectSticker={setSelectedStickerId}
          onUploadSticker={(sticker) => dispatch({ type: 'addSticker', sticker })}
          onRemoveSticker={(id) => dispatch({ type: 'removeSticker', id })}
          onAdd={(text) => {
            soundManager.playTick()
            dispatch({ type: 'add', text, stickerId: selectedStickerId })
          }}
        />

        {storageFull && (
          <p className="mt-3 rounded-xl border border-line bg-oat px-3 py-2 text-sm text-[#a5573f]">
            브라우저 저장 공간이 부족해 변경 사항이 저장되지 않았어요. 업로드한 스티커 일부를 삭제해주세요.
          </p>
        )}

        <div className="mb-2 mt-8 grid grid-cols-[1fr_auto] px-4 text-xs font-bold tracking-widest text-ink-soft uppercase">
          <span>To do</span>
          <span className="w-24 text-center sm:w-28">Done</span>
        </div>

        <ul className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {state.items.map((item) => (
              <ChecklistItem
                key={item.id}
                item={item}
                sticker={stickerById(item.stickerId)}
                stickers={stickers}
                landing={landingIds.has(item.id)}
                justLanded={justLanded.has(item.id)}
                onToggle={handleToggle}
                onEdit={(id, text, stickerId) => dispatch({ type: 'edit', id, text, stickerId })}
                onRemove={(id) => {
                  soundManager.playTick(false)
                  dispatch({ type: 'remove', id })
                }}
                onUploadSticker={(sticker) => dispatch({ type: 'addSticker', sticker })}
                onRemoveSticker={(id) => dispatch({ type: 'removeSticker', id })}
              />
            ))}
          </AnimatePresence>
        </ul>

        {total === 0 && (
          <p className="paper mt-2 rounded-2xl p-8 text-center text-ink-soft">
            아직 항목이 없어요. 위에서 할 일과 스티커를 골라 추가하세요!
          </p>
        )}
      </motion.main>
      {/* Outside the shaking <main> so its transform doesn't break position: fixed */}
      <StickerOverlay bursts={bursts} onPop={handlePop} onLanded={handleLanded} />
    </>
  )
}
