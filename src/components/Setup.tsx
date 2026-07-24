import {
  clampInt,
  formatDuration,
  PHASE_PRESETS,
  sessionDurationSec,
  type SessionConfig,
} from '../data/protocol'
import { loadHistory, type HistoryEntry } from '../lib/storage'

type Props = {
  config: SessionConfig
  onChange: (cfg: SessionConfig) => void
  onStart: () => void
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

export function Setup({ config, onChange, onStart }: Props) {
  const history = loadHistory().slice(0, 5)
  const total = sessionDurationSec(config)

  const applyPreset = (id: string) => {
    const p = PHASE_PRESETS.find((x) => x.id === id)
    if (!p) return
    onChange({
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

  return (
    <div className="screen setup">
      <header className="masthead">
        <p className="eyebrow">Protocol coach</p>
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
          5s countdown, then hang. Audio ticks every 5s through hang and rest.
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
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="page-foot">
        <p>
          Full-body hang, no added weight. Once daily, 4–5 days per week. Stop if you
          feel sharp pain, numbness, or joint instability.
        </p>
      </footer>
    </div>
  )
}
