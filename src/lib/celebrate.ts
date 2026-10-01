import confetti from 'canvas-confetti'

const COLORS = ['#ff4fa3', '#ffd23f', '#3ddc97', '#4dabff', '#a66bff', '#ff8a3d', '#ffffff']

/** The big, loud particle explosion fired when an item is completed. */
export function fireCelebration(reduced = false) {
  if (reduced) {
    void confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.6 },
      colors: COLORS,
      disableForReducedMotion: false,
    })
    return
  }
  const base = { colors: COLORS, zIndex: 60, ticks: 260 }

  // Centre explosion
  void confetti({
    ...base,
    particleCount: 160,
    spread: 360,
    startVelocity: 48,
    origin: { x: 0.5, y: 0.5 },
    scalar: 1.1,
  })
  // Star sparks
  void confetti({
    ...base,
    particleCount: 50,
    spread: 360,
    startVelocity: 30,
    shapes: ['star'],
    scalar: 1.6,
    origin: { x: 0.5, y: 0.5 },
  })
  // Side cannons
  const cannons = (delay: number) =>
    setTimeout(() => {
      void confetti({
        ...base,
        particleCount: 70,
        angle: 60,
        spread: 60,
        startVelocity: 70,
        origin: { x: 0, y: 0.9 },
      })
      void confetti({
        ...base,
        particleCount: 70,
        angle: 120,
        spread: 60,
        startVelocity: 70,
        origin: { x: 1, y: 0.9 },
      })
    }, delay)
  cannons(150)
  cannons(450)
}

/** Small burst exactly where the sticker lands. */
export function fireLandingBurst(rect: DOMRect, reduced = false) {
  const x = (rect.left + rect.width / 2) / window.innerWidth
  const y = (rect.top + rect.height / 2) / window.innerHeight
  void confetti({
    colors: COLORS,
    zIndex: 60,
    particleCount: reduced ? 15 : 45,
    spread: 360,
    startVelocity: 22,
    gravity: 0.9,
    ticks: 120,
    scalar: 0.8,
    origin: { x, y },
  })
}
