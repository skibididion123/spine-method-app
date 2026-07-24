/**
 * Lightweight Web Audio beeps — no sample files.
 * Metronome is intentionally loud/punchy so it cuts through phone speakers mid-hang.
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null
let compressor: DynamicsCompressorNode | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = 1
    compressor = ctx.createDynamicsCompressor()
    // Mild compression so peaks stay present without harsh clipping
    compressor.threshold.value = -18
    compressor.knee.value = 12
    compressor.ratio.value = 4
    compressor.attack.value = 0.003
    compressor.release.value = 0.12
    master.connect(compressor)
    compressor.connect(ctx.destination)
  }
  return ctx
}

function out(): AudioNode {
  getCtx()
  return master!
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
  const peak = Math.min(opts.gain ?? 0.2, 0.85)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.duration)
  osc.connect(gain)
  gain.connect(out())
  osc.start(t0)
  osc.stop(t0 + opts.duration + 0.03)
}

/** Sharp noise-like click via very short high square — cuts through better than a soft sine. */
function click(when: number, gain = 0.55): void {
  const c = getCtx()
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(1800, when)
  osc.frequency.exponentialRampToValueAtTime(400, when + 0.04)
  g.gain.setValueAtTime(0.0001, when)
  g.gain.exponentialRampToValueAtTime(gain, when + 0.004)
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.07)
  osc.connect(g)
  g.connect(out())
  osc.start(when)
  osc.stop(when + 0.09)
}

/** Steady metronome tick — every 5s while session runs. Loud on purpose. */
export function playMetronomeTick(): void {
  const c = getCtx()
  const t = c.currentTime
  click(t, 0.62)
  // Body tone underneath so it still reads as a beat, not only a click
  beep({ freq: 880, duration: 0.12, type: 'triangle', gain: 0.42, when: t })
  beep({ freq: 1320, duration: 0.06, type: 'square', gain: 0.28, when: t + 0.015 })
}

export function playHangCue(): void {
  const c = getCtx()
  const t = c.currentTime
  beep({ freq: 523.25, duration: 0.12, type: 'triangle', gain: 0.38, when: t })
  beep({ freq: 659.25, duration: 0.16, type: 'triangle', gain: 0.42, when: t + 0.1 })
  click(t + 0.08, 0.35)
}

export function playRestCue(): void {
  const c = getCtx()
  const t = c.currentTime
  beep({ freq: 440, duration: 0.14, type: 'triangle', gain: 0.36, when: t })
  beep({ freq: 349.23, duration: 0.18, type: 'triangle', gain: 0.34, when: t + 0.11 })
}

export function playDoneCue(): void {
  const c = getCtx()
  const t = c.currentTime
  beep({ freq: 392, duration: 0.12, type: 'triangle', gain: 0.36, when: t })
  beep({ freq: 523.25, duration: 0.12, type: 'triangle', gain: 0.38, when: t + 0.12 })
  beep({ freq: 659.25, duration: 0.22, type: 'triangle', gain: 0.42, when: t + 0.24 })
  click(t + 0.28, 0.4)
}

export function playPrepCue(): void {
  beep({ freq: 660, duration: 0.1, type: 'triangle', gain: 0.32 })
}
