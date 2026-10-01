import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { useCallback, useState } from 'react'
import { soundManager } from './audio/SoundManager'
import { ChecklistItem, SLOT_SIZE } from './components/ChecklistItem'
import { Clock } from './components/Clock'
import { EDGE_STYLE, PencilFilters, Surface } from './components/Sketch'
import { StickerOverlay, type Burst } from './components/StickerOverlay'
import { STICKER_SHEET_ID, StickerSheet } from './components/StickerSheet'
import { VideoPopup, pickVideo, type VideoPopupState } from './components/VideoPopup'
import { useChecklist } from './hooks/useChecklist'
import { STICKERS_PER_KIND, newId, stockOf } from './lib/checklistReducer'
import { DEFAULT_STICKER_ID } from './lib/defaultStickers'

export default function App() {
  const { state, dispatch, stickers, stickerById, storageFull } = useChecklist()
  const [selectedId, setSelectedId] = useState(DEFAULT_STICKER_ID)
  const [bursts, setBursts] = useState<Burst[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [videoPopup, setVideoPopup] = useState<VideoPopupState | null>(null)
  const [justLanded, setJustLanded] = useState<Set<string>>(new Set())
  const [muted, setMuted] = useState(soundManager.muted)
  const sheetNudge = useAnimationControls()

  const left = (id: string) => stockOf(state, id)
  // The chosen kind, or — once it runs out (or is deleted) — the next kind still on the sheet.
  const activeSticker =
    [stickers.find((s) => s.id === selectedId), ...stickers].find((s) => s && left(s.id) > 0) ?? null

  const landingIds = new Set(bursts.map((b) => b.itemId))
  const written = state.items.filter((i) => i.text)
  const doneCount = written.filter((i) => i.done).length
  const progress = written.length ? doneCount / written.length : 0

  const handleToggle = (id: string, slotRect: DOMRect) => {
    const item = state.items.find((i) => i.id === id)
    if (!item || landingIds.has(id)) return
    // Inside the click, so browsers let audio start.
    soundManager.unlock()
    if (item.done) {
      // Peeling it back off the to-do.
      soundManager.playPeel(true)
      dispatch({ type: 'uncheck', id })
      return
    }
    if (!item.text) return
    if (!activeSticker) {
      // Sheet is empty: nudge it so the refresh buttons get noticed.
      void sheetNudge.start({ x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.35 } })
      return
    }
    // Peel the left-most remaining copy of the active kind off the sheet.
    const copy = document.querySelector(
      `#${STICKER_SHEET_ID} [data-sticker-id="${activeSticker.id}"][data-copy="${STICKERS_PER_KIND - left(activeSticker.id)}"]`,
    )
    if (activeSticker.sound) soundManager.preload(activeSticker.sound)
    // warm the HTTP cache so the clip is ready when the sticker lands
    if (activeSticker.video) void fetch(pickVideo(activeSticker.video)).catch(() => {})
    const from = copy?.getBoundingClientRect()
    const visible = from && from.bottom > 0 && from.top < window.innerHeight
    dispatch({ type: 'complete', id, stickerId: activeSticker.id })
    setBursts((b) => [
      ...b,
      { id: newId(), itemId: id, sticker: activeSticker, from: visible ? from : undefined, target: slotRect },
    ])
  }

  const handlePop = useCallback((_: Burst) => {
    soundManager.playPeel()
  }, [])

  const handleLanded = useCallback((burst: Burst) => {
    soundManager.playStick(burst.sticker.sound, { fadeIn: burst.sticker.soundFadeIn ?? true })
    if (burst.sticker.video) setVideoPopup({ key: burst.id, video: burst.sticker.video })
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
  }, [])

  const toggleMute = () => {
    soundManager.setMuted(!muted)
    setMuted(!muted)
  }

  return (
    <>
      <PencilFilters />
      <button
        type="button"
        onClick={toggleMute}
        aria-pressed={muted}
        aria-label={muted ? '소리 켜기' : '소리 끄기'}
        className="fixed right-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition hover:text-ink"
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
          <path d="M4 9v6h4l5 4V5L8 9H4z" />
          {muted ? (
            <path d="M17 9l5 6M22 9l-5 6" />
          ) : (
            <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
          )}
        </svg>
      </button>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pb-16 pt-14">
        <Clock />

        {/* 1. Sticker sheet */}
        <motion.div animate={sheetNudge}>
          <StickerSheet
            stickers={stickers}
            stockOf={left}
            selectedId={activeSticker?.id ?? ''}
            // same size as the stickers stuck on the list
            size={SLOT_SIZE}
            onSelect={setSelectedId}
            onRestock={(id) => dispatch({ type: 'restock', stickerId: id })}
            onUpload={(sticker) => dispatch({ type: 'addSticker', sticker })}
            onRemove={(id) => dispatch({ type: 'removeSticker', id })}
          />
        </motion.div>

        {/* 2. Gauge */}
        <div
          className="relative isolate h-4"
          role="progressbar"
          aria-label="완료한 할 일"
          aria-valuemin={0}
          aria-valuemax={written.length}
          aria-valuenow={doneCount}
        >
          <Surface fill="bg-beige/60" radius={999} />
          <motion.div
            className="h-full rounded-full bg-sage"
            style={{ filter: EDGE_STYLE === 'paper' ? 'url(#paper-edge)' : undefined }}
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
          />
        </div>

        {storageFull && (
          <p className="relative isolate px-4 py-2 text-sm text-[#a5573f]">
            <Surface fill="bg-oat" radius={16} pencilColor="#a5573f" />
            브라우저 저장 공간이 부족해 변경 사항이 저장되지 않았어요. 업로드한 스티커 일부를 삭제해주세요.
          </p>
        )}

        {/* 3. To-do list: one panel */}
        <section className="relative isolate px-3 pb-3 pt-4 sm:px-4" aria-label="할 일 목록">
          <Surface fill="bg-oat" radius={36} />
          <ul className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {state.items.map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  sticker={stickerById(item.stickerId ?? DEFAULT_STICKER_ID)}
                  landing={landingIds.has(item.id)}
                  justLanded={justLanded.has(item.id)}
                  onToggle={handleToggle}
                  editing={editingId === item.id}
                  onStartEdit={setEditingId}
                  onCommit={(id, text, next) => {
                    dispatch({ type: 'edit', id, text })
                    if (next) {
                      // Enter: carry on in the next blank row below, if there is one.
                      const from = state.items.findIndex((i) => i.id === id)
                      const blank = state.items.slice(from + 1).find((i) => !i.text && !i.done)
                      setEditingId(blank?.id ?? null)
                    } else {
                      // Blur: only close if focus didn't already move on to another row.
                      setEditingId((cur) => (cur === id ? null : cur))
                    }
                  }}
                  onCancelEdit={(id) => setEditingId((cur) => (cur === id ? null : cur))}
                  onRemove={(id) => dispatch({ type: 'remove', id })}
                />
              ))}
            </AnimatePresence>
          </ul>
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              onClick={() => dispatch({ type: 'addRow' })}
              aria-label="할 일 칸 추가"
              className="flex h-12 w-12 items-center justify-center rounded-full text-ink transition hover:bg-sheet/60"
            >
              <svg
                viewBox="0 0 24 24"
                width="30"
                height="30"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                style={{ filter: 'url(#pencil)' }}
                aria-hidden
              >
                <path d="M12 4v16M4 12h16" />
              </svg>
            </button>
          </div>
        </section>
      </main>
      <StickerOverlay bursts={bursts} onPop={handlePop} onLanded={handleLanded} />
      <VideoPopup popup={videoPopup} onDone={() => setVideoPopup(null)} />
    </>
  )
}
