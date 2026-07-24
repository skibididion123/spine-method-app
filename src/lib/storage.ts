import { DEFAULT_CONFIG, type SessionConfig } from '../data/protocol'

const CONFIG_KEY = 'spine-method:config'
const HISTORY_KEY = 'spine-method:history'
const HEIGHT_KEY = 'spine-method:height'
const BACKUP_VERSION = 1 as const

export type HistoryEntry = {
  id: string
  completedAt: string
  cycles: number
  hangSec: number
  restSec: number
  mode: SessionConfig['mode']
  presetId: string | null
  finished: boolean
  skippedFinalRest?: boolean
}

export type HeightEntry = {
  id: string
  measuredAt: string // ISO date or datetime
  cm: number
  note: string
}

export type AppBackup = {
  version: typeof BACKUP_VERSION
  exportedAt: string
  config: SessionConfig
  history: HistoryEntry[]
  heightLog: HeightEntry[]
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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
      skipFinalRest: Boolean(parsed.skipFinalRest),
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
    return Array.isArray(list) ? list.slice(0, 100) : []
  } catch {
    return []
  }
}

function saveHistory(list: HistoryEntry[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 100)))
}

export function pushHistory(entry: Omit<HistoryEntry, 'id'>): void {
  const prev = loadHistory()
  const next: HistoryEntry[] = [{ ...entry, id: newId() }, ...prev].slice(0, 100)
  saveHistory(next)
}

export function loadHeightLog(): HeightEntry[] {
  try {
    const raw = localStorage.getItem(HEIGHT_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as HeightEntry[]
    if (!Array.isArray(list)) return []
    return list
      .filter((e) => e && typeof e.cm === 'number' && e.measuredAt)
      .sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))
      .slice(0, 200)
  } catch {
    return []
  }
}

function saveHeightLog(list: HeightEntry[]): void {
  const sorted = [...list]
    .sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))
    .slice(0, 200)
  localStorage.setItem(HEIGHT_KEY, JSON.stringify(sorted))
}

export function addHeightEntry(entry: Omit<HeightEntry, 'id'>): HeightEntry {
  const full: HeightEntry = {
    id: newId(),
    measuredAt: entry.measuredAt,
    cm: entry.cm,
    note: entry.note ?? '',
  }
  const prev = loadHeightLog()
  saveHeightLog([full, ...prev])
  return full
}

export function removeHeightEntry(id: string): void {
  saveHeightLog(loadHeightLog().filter((e) => e.id !== id))
}

export function buildBackup(): AppBackup {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    config: loadConfig(),
    history: loadHistory(),
    heightLog: loadHeightLog(),
  }
}

export function exportBackupFile(): void {
  const backup = buildBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const day = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `spine-method-backup-${day}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export type ImportResult =
  | { ok: true; history: number; height: number }
  | { ok: false; error: string }

function isSessionConfig(v: unknown): v is SessionConfig {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    (o.mode === 'preset' || o.mode === 'custom') &&
    typeof o.cycles === 'number' &&
    typeof o.hangSec === 'number' &&
    typeof o.restSec === 'number'
  )
}

function normalizeHistory(list: unknown): HistoryEntry[] {
  if (!Array.isArray(list)) return []
  const out: HistoryEntry[] = []
  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    if (typeof o.completedAt !== 'string') continue
    out.push({
      id: typeof o.id === 'string' ? o.id : newId(),
      completedAt: o.completedAt,
      cycles: Number(o.cycles) || 0,
      hangSec: Number(o.hangSec) || 0,
      restSec: Number(o.restSec) || 0,
      mode: o.mode === 'custom' ? 'custom' : 'preset',
      presetId: typeof o.presetId === 'string' ? o.presetId : null,
      finished: o.finished !== false,
      skippedFinalRest: Boolean(o.skippedFinalRest),
    })
  }
  return out
}

function normalizeHeight(list: unknown): HeightEntry[] {
  if (!Array.isArray(list)) return []
  const out: HeightEntry[] = []
  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const cm = Number(o.cm)
    if (typeof o.measuredAt !== 'string' || !Number.isFinite(cm)) continue
    out.push({
      id: typeof o.id === 'string' ? o.id : newId(),
      measuredAt: o.measuredAt,
      cm,
      note: typeof o.note === 'string' ? o.note : '',
    })
  }
  return out
}

/** Replace local data with backup contents (after validation). */
export function importBackupJson(raw: string): ImportResult {
  try {
    const data = JSON.parse(raw) as Partial<AppBackup> & Record<string, unknown>

    // Accept our format, or a bare { history, heightLog, config }
    const history = normalizeHistory(data.history)
    const heightLog = normalizeHeight(data.heightLog ?? data.height)
    const config = data.config

    if (history.length === 0 && heightLog.length === 0 && !isSessionConfig(config)) {
      return {
        ok: false,
        error: 'File has no session history, height log, or settings to import.',
      }
    }

    if (isSessionConfig(config)) {
      saveConfig({
        mode: config.mode,
        presetId: config.presetId ?? null,
        cycles: config.cycles,
        hangSec: config.hangSec,
        restSec: config.restSec,
        skipFinalRest: Boolean(config.skipFinalRest),
      })
    }

    // Merge by id so re-importing doesn't wipe unique local entries accidentally
    // — still: imported entries win on id collision
    const histMap = new Map<string, HistoryEntry>()
    for (const e of loadHistory()) histMap.set(e.id, e)
    for (const e of history) histMap.set(e.id, e)
    const mergedHist = [...histMap.values()].sort((a, b) =>
      b.completedAt.localeCompare(a.completedAt),
    )
    saveHistory(mergedHist)

    const heightMap = new Map<string, HeightEntry>()
    for (const e of loadHeightLog()) heightMap.set(e.id, e)
    for (const e of heightLog) heightMap.set(e.id, e)
    saveHeightLog([...heightMap.values()])

    return { ok: true, history: history.length, height: heightLog.length }
  } catch {
    return { ok: false, error: 'Could not read that file. Use a Spine Method backup JSON.' }
  }
}

export function importBackupFile(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      resolve(importBackupJson(text))
    }
    reader.onerror = () =>
      resolve({ ok: false, error: 'Failed to read the selected file.' })
    reader.readAsText(file)
  })
}
