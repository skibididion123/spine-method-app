import { useRef, useState } from 'react'
import {
  clampInt,
  formatDuration,
  PHASE_PRESETS,
  sessionDurationSec,
  type SessionConfig,
} from '../data/protocol'
import {
  exportBackupFile,
  importBackupFile,
  loadHistory,
  type HistoryEntry,
} from '../lib/storage'

type Props = {
  config: SessionConfig
  onChange: (cfg: SessionConfig) => void
  onStart: () => void
  onOpenProtocol: () => void
  onOpenHeight: () => void
  /** Bumps when local data is imported so lists re-read storage. */
  dataRevision: number
}

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function Setup({
  config,
  onChange,
  onStart,
  onOpenProtocol,
  onOpenHeight,
  dataRevision,
}: Props) {
  const history = loadHistory().slice(0, 5)
  const total = sessionDurationSec(config)
  const fileRef = useRef<HTMLInputElement>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [importErr, setImportErr] = useState<string | null>(null)

  // Touch dataRevision so React knows history can change after import
  void dataRevision

  const applyPreset = (id: string) => {
    const p = PHASE_PRESETS.find((x) => x.id === id)
    if (!p) return
    onChange({
      ...config,
      mode: 'preset',
      presetId: p.id,
      cycles: p.cycles,
      hangSec: p.hangSec,
      restSec: p.restSec,
    })
  }

  const setCustom = (patch: Partial<SessionConfig>) => {
    onChange({
      ...config,
      ...patch,
      mode: 'custom',
      presetId: null,
    })
  }

  const onImportClick = () => fileRef.current?.click()

  const onFile = async (file: File | undefined) => {
    setImportMsg(null)
    setImportErr(null)
    if (!file) return
    const result = await importBackupFile(file)
    if (!result.ok) {
      setImportErr(result.error)
      return
    }
    setImportMsg(
      `Imported ${result.history} session(s) and ${result.height} height entr${result.height === 1 ? 'y' : 'ies'}.`,
    )
    // Parent reloads config + bumps revision
    window.dispatchEvent(new CustomEvent('spine-method:imported'))
  }

  return (
    <div className="screen setup">
      <header className="masthead">
        <div className="masthead-row">
          <p className="eyebrow">Protocol coach</p>
          <div className="masthead-links">
            <button type="button" className="nav-link" onClick={onOpenHeight}>
              Height
            </button>
            <button type="button" className="nav-link" onClick={onOpenProtocol}>
              Protocol
            </button>
          </div>
        </div>
        <h1 className="wordmark">Spine Method</h1>
        <p className="lede">
          Cyclic full-body hanging to stimulate vertebral growth plates. Load your phase,
          hang on the clock, rest off it. Metronome marks every five seconds so you never
          lose count mid-hang.
        </p>
      </header>

      <section className="panel">
        <div className="panel-head">
          <h2>Progression</h2>
          <span className="panel-meta">6–8 week plan</span>
        </div>
        <ul className="preset-list" role="list">
          {PHASE_PRESETS.map((p) => {
            const active = config.mode === 'preset' && config.presetId === p.id
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className={`preset-card${active ? ' is-active' : ''}`}
                  onClick={() => applyPreset(p.id)}
                  aria-pressed={active}
                >
                  <div className="preset-top">
                    <span className="preset-weeks">{p.weeks}</span>
                    <span className="preset-label">{p.label}</span>
                  </div>
                  <div className="preset-nums">
                    <span>
                      <strong>{p.hangSec}</strong>s hang
                    </span>
                    <span className="dot" aria-hidden>
                      ·
                    </span>
                    <span>
                      <strong>{p.restSec}</strong>s rest
                    </span>
                    <span className="dot" aria-hidden>
                      ·
                    </span>
                    <span>
                      <strong>{p.cycles}</strong> cycles
                    </span>
                  </div>
                  <p className="preset-note">{p.note}</p>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Custom</h2>
          <span className="panel-meta">
            {config.mode === 'custom' ? 'Active' : 'Override any value'}
          </span>
        </div>
        <div className="custom-grid">
          <label className="field">
            <span className="field-label">Hang (sec)</span>
            <input
              type="number"
              min={5}
              max={120}
              step={1}
              value={config.hangSec}
              onChange={(e) =>
                setCustom({ hangSec: clampInt(Number(e.target.value), 5, 120) })
              }
            />
          </label>
          <label className="field">
            <span className="field-label">Rest (sec)</span>
            <input
              type="number"
              min={5}
              max={180}
              step={1}
              value={config.restSec}
              onChange={(e) =>
                setCustom({ restSec: clampInt(Number(e.target.value), 5, 180) })
              }
            />
          </label>
          <label className="field">
            <span className="field-label">Cycles</span>
            <input
              type="number"
              min={1}
              max={30}
              step={1}
              value={config.cycles}
              onChange={(e) =>
                setCustom({ cycles: clampInt(Number(e.target.value), 1, 30) })
              }
            />
          </label>
        </div>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={config.skipFinalRest}
            onChange={(e) =>
              onChange({ ...config, skipFinalRest: e.target.checked })
            }
          />
          <span>
            <span className="toggle-title">Skip final rest</span>
            <span className="toggle-desc">
              End the session right after the last hang instead of a closing rest.
            </span>
          </span>
        </label>

        <p className="hint">
          Freeform timings still run the same hang → rest loop. Metronome stays at 5s
          intervals either way.
        </p>
      </section>

      <section className="session-strip">
        <div className="session-strip-stats">
          <div>
            <span className="stat-label">Hang / rest</span>
            <span className="stat-value">
              {config.hangSec}s / {config.restSec}s
            </span>
          </div>
          <div>
            <span className="stat-label">Cycles</span>
            <span className="stat-value">{config.cycles}</span>
          </div>
          <div>
            <span className="stat-label">Est. duration</span>
            <span className="stat-value">{formatDuration(total)}</span>
          </div>
        </div>
        <button type="button" className="btn-primary" onClick={onStart}>
          Start session
        </button>
        <p className="session-foot">
          5s countdown, then hang. Loud 5s metronome through hang and rest
          {config.skipFinalRest ? ' · final rest skipped' : ''}.
        </p>
      </section>

      {history.length > 0 && (
        <section className="panel history-panel">
          <div className="panel-head">
            <h2>Recent</h2>
            <span className="panel-meta">This device</span>
          </div>
          <ul className="history-list">
            {history.map((h: HistoryEntry) => (
              <li key={h.id}>
                <span className="history-when">{formatWhen(h.completedAt)}</span>
                <span className="history-detail">
                  {h.hangSec}/{h.restSec}s · {h.cycles} cycles
                  {h.skippedFinalRest ? ' · no final rest' : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel">
        <div className="panel-head">
          <h2>Height log</h2>
          <span className="panel-meta">Track cm over time</span>
        </div>
        <p className="hint protocol-link-copy">
          Log measurements locally and see change from your first entry.
        </p>
        <button type="button" className="btn-secondary" onClick={onOpenHeight}>
          Open height log
        </button>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Backup</h2>
          <span className="panel-meta">Export / import</span>
        </div>
        <p className="hint protocol-link-copy">
          Download a JSON of settings, session history, and height log — or restore one
          from another device. Import merges with what you already have.
        </p>
        <div className="btn-row">
          <button type="button" className="btn-secondary" onClick={exportBackupFile}>
            Export data
          </button>
          <button type="button" className="btn-secondary" onClick={onImportClick}>
            Import data
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            void onFile(f)
            e.target.value = ''
          }}
        />
        {importMsg && <p className="form-ok">{importMsg}</p>}
        {importErr && <p className="form-error">{importErr}</p>}
      </section>

      <section className="panel protocol-link-panel">
        <div className="panel-head">
          <h2>Reference</h2>
          <span className="panel-meta">From the original PDF</span>
        </div>
        <p className="hint protocol-link-copy">
          Session structure, 6–8 week progression, and the full supplement stack — by{' '}
          <strong>guts</strong> / <strong>psl4</strong>.
        </p>
        <button type="button" className="btn-secondary" onClick={onOpenProtocol}>
          Open full protocol
        </button>
      </section>

      <footer className="page-foot">
        <p>
          Full-body hang, no added weight. Once daily, 4–5 days per week. Stop if you
          feel sharp pain, numbness, or joint instability.
        </p>
      </footer>
    </div>
  )
}
