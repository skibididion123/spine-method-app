export type PhasePreset = {
  id: string
  label: string
  weeks: string
  cycles: number
  hangSec: number
  restSec: number
  note: string
}

/** Progression from Spine Method protocol (6–8 weeks). */
export const PHASE_PRESETS: PhasePreset[] = [
  {
    id: 'w1-2',
    label: 'Foundation',
    weeks: 'Weeks 1–2',
    cycles: 6,
    hangSec: 15,
    restSec: 45,
    note: 'Build tolerance. Monitor discomfort.',
  },
  {
    id: 'w3-4',
    label: 'Fluid exchange',
    weeks: 'Weeks 3–4',
    cycles: 8,
    hangSec: 20,
    restSec: 40,
    note: 'Foster fluid exchange; moderate strain.',
  },
  {
    id: 'w5-6',
    label: 'Enhanced shear',
    weeks: 'Weeks 5–6',
    cycles: 9,
    hangSec: 22,
    restSec: 42,
    note: 'Enhanced fluid shear — only if still safe and tolerated.',
  },
  {
    id: 'w7-8',
    label: 'Peak load',
    weeks: 'Weeks 7–8',
    cycles: 10,
    hangSec: 25,
    restSec: 40,
    note: 'Max safe loading. Stop if symptoms appear.',
  },
]

export type SessionConfig = {
  mode: 'preset' | 'custom'
  presetId: string | null
  cycles: number
  hangSec: number
  restSec: number
  /** End after the last hang instead of a final rest. */
  skipFinalRest: boolean
}

export const DEFAULT_CONFIG: SessionConfig = {
  mode: 'preset',
  presetId: 'w1-2',
  cycles: 6,
  hangSec: 15,
  restSec: 45,
  skipFinalRest: false,
}

export const METRONOME_INTERVAL_MS = 5000

export function sessionDurationSec(cfg: SessionConfig): number {
  const hangs = cfg.cycles * cfg.hangSec
  const rests = cfg.skipFinalRest
    ? Math.max(0, cfg.cycles - 1) * cfg.restSec
    : cfg.cycles * cfg.restSec
  return hangs + rests
}

export function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  if (m === 0) return `${s}s`
  return s === 0 ? `${m}m` : `${m}m ${s}s`
}

export function clampInt(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, Math.round(n)))
}
