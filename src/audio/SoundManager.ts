/**
 * Synthesised sound effects built on the Web Audio API — no audio files needed.
 * The AudioContext is created lazily on the first user gesture (browser autoplay rules).
 */
type Ctor = typeof AudioContext

class SoundManager {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noiseBuffer: AudioBuffer | null = null
  private _muted = false

  get muted() {
    return this._muted
  }

  setMuted(muted: boolean) {
    this._muted = muted
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx.currentTime, 0.02)
  }

  private ensure(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return this.ctx
    }
    const AC: Ctor | undefined =
      typeof window === 'undefined'
        ? undefined
        : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext)
    if (!AC) return null

    const ctx = new AC()
    // Compressor lets the celebration be loud without clipping.
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -14
    comp.knee.value = 10
    comp.ratio.value = 6
    comp.attack.value = 0.003
    comp.release.value = 0.2
    const master = ctx.createGain()
    master.gain.value = this._muted ? 0 : 0.9
    master.connect(comp).connect(ctx.destination)

    const len = ctx.sampleRate
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1

    this.ctx = ctx
    this.master = master
    this.noiseBuffer = buf
    return ctx
  }

  private tone(
    freq: number,
    start: number,
    dur: number,
    { type = 'square', gain = 0.2, slideTo }: { type?: OscillatorType; gain?: number; slideTo?: number } = {},
  ) {
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur)
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(gain, start + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.connect(g).connect(this.master!)
    osc.start(start)
    osc.stop(start + dur + 0.05)
  }

  private noise(
    start: number,
    dur: number,
    {
      gain = 0.3,
      filter = 'highpass',
      freq = 4000,
      sweepTo,
    }: {
      gain?: number
      filter?: BiquadFilterType
      freq?: number
      sweepTo?: number
    } = {},
  ) {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    src.loop = true
    const f = ctx.createBiquadFilter()
    f.type = filter
    f.frequency.setValueAtTime(freq, start)
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, start + dur)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, start)
    g.gain.exponentialRampToValueAtTime(gain, start + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    src.connect(f).connect(g).connect(this.master!)
    src.start(start)
    src.stop(start + dur + 0.05)
  }

  /** Big, noisy "you did it!" fanfare: whoosh + pop + arpeggio + cymbal crash + sparkles. */
  playCelebration() {
    const ctx = this.ensure()
    if (!ctx || this._muted) return
    const t = ctx.currentTime + 0.01

    // Rising whoosh
    this.noise(t, 0.35, { filter: 'bandpass', freq: 400, sweepTo: 6000, gain: 0.35 })
    // Cartoon pop
    this.tone(220, t + 0.02, 0.18, { type: 'sine', gain: 0.7, slideTo: 1400 })
    // Brassy major arpeggio (C5 E5 G5 C6) with a detuned layer for width
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((n, i) => {
      const s = t + 0.12 + i * 0.075
      this.tone(n, s, 0.22, { type: 'square', gain: 0.18 })
      this.tone(n * 1.007, s, 0.22, { type: 'sawtooth', gain: 0.1 })
    })
    // Held final chord
    const chordStart = t + 0.12 + notes.length * 0.075
    ;[523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((n) => {
      this.tone(n, chordStart, 0.75, { type: 'sawtooth', gain: 0.09 })
      this.tone(n / 2, chordStart, 0.75, { type: 'triangle', gain: 0.12 })
    })
    // Cymbal crash
    this.noise(chordStart, 0.9, { filter: 'highpass', freq: 5000, gain: 0.32 })
    // Kick-ish thump under the crash
    this.tone(150, chordStart, 0.25, { type: 'sine', gain: 0.8, slideTo: 40 })
    // Sparkle twinkles
    for (let i = 0; i < 8; i++) {
      this.tone(2000 + Math.random() * 3000, chordStart + 0.05 + i * 0.06, 0.08, { type: 'sine', gain: 0.08 })
    }
  }

  /** Short, satisfying "thwack" when the sticker slaps into place. */
  playStick() {
    const ctx = this.ensure()
    if (!ctx || this._muted) return
    const t = ctx.currentTime + 0.005
    this.tone(180, t, 0.16, { type: 'sine', gain: 0.8, slideTo: 55 })
    this.noise(t, 0.07, { filter: 'lowpass', freq: 2500, gain: 0.45 })
    this.tone(1200, t, 0.05, { type: 'triangle', gain: 0.12, slideTo: 600 })
  }

  /** Soft UI tick (add / delete / uncheck). */
  playTick(up = true) {
    const ctx = this.ensure()
    if (!ctx || this._muted) return
    const t = ctx.currentTime + 0.005
    this.tone(up ? 880 : 440, t, 0.08, { type: 'triangle', gain: 0.15, slideTo: up ? 1320 : 300 })
  }
}

export const soundManager = new SoundManager()
