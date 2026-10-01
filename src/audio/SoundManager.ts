/**
 * Sticker sounds on the Web Audio API.
 *
 * - peel:  adhesive letting go — a crisp stereo crackle that speeds up, ending in a tiny release pop
 * - stick: a very small, cute "뽁" pop
 * - right after the stick, the sticker kind's own clip plays (see `Sticker.sound`)
 *
 * Peel/stick are synthesised sample-by-sample into stereo buffers, so every play is slightly
 * different, like the real thing. The AudioContext is created on the first user gesture.
 */
type Ctor = typeof AudioContext

/** Clip volume relative to the synthesised sticker sounds (clips are pre-normalised to −20 LUFS). */
const CLIP_GAIN = 0.55
/** The clip starts right after the pop. */
const CLIP_DELAY = 0.1

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
    const buf = ctx.createBuffer(2, Math.ceil(sr * 0.09), sr)
    const L = buf.getChannelData(0)
    const R = buf.getChannelData(1)
    // "뽁": a tiny bubble pop — a sine whose pitch springs upward as it pops, gone in ~40 ms.
    const f0 = rand(520, 600)
    const f1 = f0 * 2.6
    let phase = 0
    for (let i = 0; i < L.length; i++) {
      const t = i / sr
      const f = f1 - (f1 - f0) * Math.exp(-t / 0.006)
      phase += (2 * Math.PI * f) / sr
      const env = Math.min(1, t / 0.0015) * Math.exp(-t / 0.011)
      const v = (Math.sin(phase) + 0.18 * Math.sin(2 * phase)) * env
      L[i] = v
      R[i] = v
    }
    // the faintest lip-smack click at the very start
    SoundManager.click(L, R, sr, 0, 0.12, 0, 0.0008)
    SoundManager.normalize(L, R, 0.12)
    return buf
  }

  /** Sticker peeling off the sheet (or off a to-do when unchecking, `soft`). */
  playPeel(soft = false) {
    const ctx = this.ensure()
    if (!ctx || this._muted) return
    this.playBuffer(this.peelBuffer(soft))
  }

  /** Sticker popping on, then the sticker kind's own clip (optionally fading in). */
  playStick(clipUrl?: string, { fadeIn = true }: { fadeIn?: boolean } = {}) {
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
      // Without fade-in it still gets a few ms ramp, just enough to avoid a click.
      gain.gain.linearRampToValueAtTime(CLIP_GAIN, t + (fadeIn ? 0.25 : 0.008))
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
