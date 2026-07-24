import { DEFAULT_CONFIG, type SessionConfig } from '../data/protocol'

const CONFIG_KEY = 'spine-method:config'
const HISTORY_KEY = 'spine-method:history'

export type HistoryEntry = {
  id: string
  completedAt: string
  cycles: number
  hangSec: number
  restSec: number
  mode: SessionConfig['mode']
  presetId: string | null
  finished: boolean
}

export function loadConfig(): SessionConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return { ...DEFAULT_CONFIG }
    const parsed = JSON.parse(raw) as Partial<SessionConfig>
    return {
      mode: parsed.mode === 'custom' ? 'custom' : 'preset',
      presetId: parsed.presetId ?? DEFAULT_CONFIG.presetId,
      cycles: Number(parsed.cycles) || DEFAULT_CONFIG.cycles,
      hangSec: Number(parsed.hangSec) || DEFAULT_CONFIG.hangSec,
      restSec: Number(parsed.restSec) || DEFAULT_CONFIG.restSec,
    }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveConfig(cfg: SessionConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg))
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as HistoryEntry[]
    return Array.isArray(list) ? list.slice(0, 30) : []
  } catch {
    return []
  }
}

export function pushHistory(entry: Omit<HistoryEntry, 'id'>): void {
  const prev = loadHistory()
  const next: HistoryEntry[] = [
    { ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
    ...prev,
  ].slice(0, 30)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
}
