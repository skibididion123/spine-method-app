/**
 * Lightweight Web Audio beeps — no sample files.
 * Metronome: short mid tick every 5s.
 * Phase cues: distinct pitch for hang / rest / done.
 */

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
  }
  return ctx
}

/** Call from a user gesture so browsers allow audio. */
export async function unlockAudio(): Promise<void> {
  const c = getCtx()
  if (c.state === 'suspended') {
    await c.resume()
  }
}

type BeepOpts = {
  freq: number
  duration: number
  type?: OscillatorType
  gain?: number
  when?: number
}

function beep(opts: BeepOpts): void {
  const c = getCtx()
  const t0 = opts.when ?? c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = opts.type ?? 'sine'
  osc.frequency.value = opts.freq
  const peak = opts.gain ?? 0.12
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.duration)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + opts.duration + 0.02)
}

/** Steady metronome tick — every 5s while session runs. */
export function playMetronomeTick(): void {
  beep({ freq: 880, duration: 0.055, type: 'sine', gain: 0.1 })
}

export function playHangCue(): void {
  // Two-tone up — start hanging
  const c = getCtx()
  const t = c.currentTime
  beep({ freq: 523.25, duration: 0.09, gain: 0.14, when: t })
  beep({ freq: 659.25, duration: 0.12, gain: 0.14, when: t + 0.1 })
}

export function playRestCue(): void {
  // Soft down — rest
  const c = getCtx()
  const t = c.currentTime
  beep({ freq: 440, duration: 0.1, gain: 0.11, when: t })
  beep({ freq: 349.23, duration: 0.14, gain: 0.1, when: t + 0.11 })
}

export function playDoneCue(): void {
  const c = getCtx()
  const t = c.currentTime
  beep({ freq: 392, duration: 0.1, gain: 0.12, when: t })
  beep({ freq: 523.25, duration: 0.1, gain: 0.12, when: t + 0.12 })
  beep({ freq: 659.25, duration: 0.18, gain: 0.13, when: t + 0.24 })
}

export function playPrepCue(): void {
  beep({ freq: 660, duration: 0.07, gain: 0.09 })
}
