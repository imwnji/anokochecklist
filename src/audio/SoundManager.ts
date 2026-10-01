/**
 * Sticker sounds on the Web Audio API.
 *
 * - peel:  adhesive letting go — a crisp stereo crackle that speeds up, ending in a tiny release pop
 * - stick: a soft "thup" as the sticker touches down, then two fingertip strokes smoothing it
 *          down (close-up, panned left→right: the ASMR "tingle")
 * - after the stick, the sticker kind's own clip fades in gently (see `Sticker.sound`)
 *
 * Peel/stick are synthesised sample-by-sample into stereo buffers, so every play is slightly
 * different, like the real thing. The AudioContext is created on the first user gesture.
 */
type Ctor = typeof AudioContext

/** Clip volume relative to the synthesised sticker sounds (clips are pre-normalised to −20 LUFS). */
const CLIP_GAIN = 0.55
/** The clip starts once the smoothing strokes are mostly done. */
const CLIP_DELAY = 0.48

const rand = (a: number, b: number) => a + Math.random() * (b - a)

class SoundManager {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private clips = new Map<string, Promise<AudioBuffer | null>>()
  private playingClip: { src: AudioBufferSourceNode; gain: GainNode } | null = null
  private _muted = false

  get muted() {
    return this._muted
  }

  setMuted(muted: boolean) {
    this._muted = muted
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.02)
  }

  /** Call from a click/tap handler so browsers allow audio (iOS Safari in particular). */
  unlock() {
    this.ensure()
  }

  /** Start fetching/decoding a clip ahead of time. */
  preload(url: string) {
    const ctx = this.ensure()
    if (!ctx || this.clips.has(url)) return
    this.clips.set(
      url,
      fetch(url)
        .then((r) => r.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data))
        .catch(() => null),
    )
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
    const master = ctx.createGain()
    master.gain.value = this._muted ? 0 : 1
    // Tame the very top end so the crackles stay crisp but never harsh.
    const air = ctx.createBiquadFilter()
    air.type = 'lowpass'
    air.frequency.value = 13000
    master.connect(air).connect(ctx.destination)
    this.ctx = ctx
    this.master = master
    return ctx
  }

  private playBuffer(buf: AudioBuffer, when = 0, gain = 1) {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = buf
    const g = ctx.createGain()
    g.gain.value = gain
    src.connect(g).connect(this.master!)
    src.start(ctx.currentTime + when)
  }

  /** Short decaying noise burst, high-passed by differencing → a dry "tk" click. */
  private static click(
    L: Float32Array,
    R: Float32Array,
    sr: number,
    t: number,
    amp: number,
    pan: number,
    len: number,
  ) {
    const start = Math.floor(t * sr)
    const n = Math.max(8, Math.floor(len * sr))
    const gl = amp * Math.min(1, 1 - pan)
    const gr = amp * Math.min(1, 1 + pan)
    let prev = 0
    for (let i = 0; i < n && start + i < L.length; i++) {
      const w = Math.random() * 2 - 1
      const v = (w - prev) * Math.exp((-6 * i) / n)
      prev = w
      L[start + i] += v * gl
      R[start + i] += v * gr
    }
  }

  private static normalize(L: Float32Array, R: Float32Array, peak: number) {
    let max = 1e-6
    for (let i = 0; i < L.length; i++) max = Math.max(max, Math.abs(L[i]), Math.abs(R[i]))
    const k = peak / max
    for (let i = 0; i < L.length; i++) {
      L[i] *= k
      R[i] *= k
    }
  }

  private peelBuffer(soft: boolean): AudioBuffer {
    const ctx = this.ctx!
    const sr = ctx.sampleRate
    const dur = 0.34
    const buf = ctx.createBuffer(2, Math.ceil(sr * dur), sr)
    const L = buf.getChannelData(0)
    const R = buf.getChannelData(1)
    const tear = 0.24 // the moment it lets go

    // Faint "shhk" of the face stock bending away, rising until release.
    let lp = 0
    let prev = 0
    for (let i = 0; i < L.length; i++) {
      const t = i / sr
      const env = t < tear ? (t / tear) ** 1.6 : Math.exp(-(t - tear) * 60)
      const w = Math.random() * 2 - 1
      lp += 0.35 * (w - lp)
      const v = (lp - prev) * env * 0.16
      prev = lp
      L[i] += v
      R[i] += v * 0.85
    }
    // Adhesive crackle: sparse at first, faster and faster towards the release.
    const count = soft ? 40 : 75
    for (let k = 0; k < count; k++) {
      const t = tear * Math.sqrt(Math.random())
      SoundManager.click(
        L,
        R,
        sr,
        t,
        rand(0.15, 0.6) * (0.4 + t / tear),
        rand(-0.85, 0.85),
        rand(0.0005, 0.002),
      )
    }
    // Release: a slightly bigger tick plus a tiny low pop.
    SoundManager.click(L, R, sr, tear, 1, rand(-0.2, 0.2), 0.004)
    const s = Math.floor(tear * sr)
    for (let i = 0; i < sr * 0.03 && s + i < L.length; i++) {
      const v = Math.sin((2 * Math.PI * 190 * i) / sr) * Math.exp(-i / (sr * 0.006)) * 0.5
      L[s + i] += v
      R[s + i] += v
    }
    SoundManager.normalize(L, R, soft ? 0.32 : 0.5)
    return buf
  }

  private stickBuffer(): AudioBuffer {
    const ctx = this.ctx!
    const sr = ctx.sampleRate
    const dur = 0.62
    const buf = ctx.createBuffer(2, Math.ceil(sr * dur), sr)
    const L = buf.getChannelData(0)
    const R = buf.getChannelData(1)

    // Touch-down: a soft, muffled "thup".
    let lp = 0
    for (let i = 0; i < sr * 0.05; i++) {
      const env = Math.exp(-i / (sr * 0.009))
      lp += 0.08 * (Math.random() * 2 - 1 - lp)
      const body = Math.sin((2 * Math.PI * 135 * i) / sr) * Math.exp(-i / (sr * 0.012))
      const v = (lp * 2.2 + body * 0.55) * env
      L[i] += v
      R[i] += v
    }
    // Air squeezing out from under the film: a few fine crackles.
    for (let k = 0; k < 12; k++) {
      SoundManager.click(L, R, sr, rand(0.01, 0.09), rand(0.05, 0.2), rand(-0.6, 0.6), rand(0.0004, 0.0012))
    }
    // Two fingertip strokes smoothing the sticker down, sweeping across the stereo field.
    const strokes = [
      { at: 0.12, len: 0.17, from: -0.7, to: 0.5, amp: 0.55 },
      { at: 0.3, len: 0.2, from: -0.4, to: 0.8, amp: 0.42 },
    ]
    for (const st of strokes) {
      let a = 0
      let b = 0
      const s0 = Math.floor(st.at * sr)
      const n = Math.floor(st.len * sr)
      for (let i = 0; i < n && s0 + i < L.length; i++) {
        const p = i / n
        const w = Math.random() * 2 - 1
        a += 0.6 * (w - a) // ~6 kHz lowpass
        b += 0.16 * (w - b) // ~1.2 kHz lowpass
        // band-passed friction with a slight skin-ridge flutter
        const v = (a - b) * Math.sin(Math.PI * p) ** 1.5 * (0.8 + 0.2 * Math.sin(p * 90)) * st.amp
        const pan = st.from + (st.to - st.from) * p
        L[s0 + i] += v * Math.min(1, 1 - pan)
        R[s0 + i] += v * Math.min(1, 1 + pan)
      }
      for (let k = 0; k < 10; k++) {
        const p = Math.random()
        const pan = st.from + (st.to - st.from) * p
        SoundManager.click(L, R, sr, st.at + p * st.len, rand(0.04, 0.14), pan, rand(0.0004, 0.001))
      }
    }
    SoundManager.normalize(L, R, 0.55)
    return buf
  }

  /** Sticker peeling off the sheet (or off a to-do when unchecking, `soft`). */
  playPeel(soft = false) {
    const ctx = this.ensure()
    if (!ctx || this._muted) return
    this.playBuffer(this.peelBuffer(soft))
  }

  /** Sticker landing and being smoothed down, then the sticker kind's own clip. */
  playStick(clipUrl?: string) {
    const ctx = this.ensure()
    if (!ctx || this._muted) return
    this.playBuffer(this.stickBuffer())
    if (!clipUrl) return
    this.preload(clipUrl)
    void this.clips.get(clipUrl)!.then((clip) => {
      if (!clip || !this.ctx || this._muted) return
      this.fadeOutClip()
      const src = this.ctx.createBufferSource()
      src.buffer = clip
      const gain = this.ctx.createGain()
      const t = this.ctx.currentTime + CLIP_DELAY
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(CLIP_GAIN, t + 0.25)
      src.connect(gain).connect(this.master!)
      src.start(t)
      const playing = { src, gain }
      this.playingClip = playing
      src.onended = () => {
        if (this.playingClip === playing) this.playingClip = null
      }
    })
  }

  /** A newer sticker takes over: let the previous clip fade away instead of piling up. */
  private fadeOutClip() {
    if (!this.playingClip || !this.ctx) return
    const { src, gain } = this.playingClip
    const t = this.ctx.currentTime
    gain.gain.cancelScheduledValues(t)
    gain.gain.setTargetAtTime(0, t, 0.08)
    src.stop(t + 0.5)
    this.playingClip = null
  }
}

export const soundManager = new SoundManager()
