import { useMemo, useState, type FormEvent } from 'react'
import {
  addHeightEntry,
  loadHeightLog,
  removeHeightEntry,
  type HeightEntry,
} from '../lib/storage'

type Props = {
  onBack: () => void
}

function todayInputValue(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDate(iso: string): string {
  try {
    // date-only strings parse as UTC midnight; treat as calendar date
    const pure = iso.slice(0, 10)
    const [y, m, d] = pure.split('-').map(Number)
    if (!y || !m || !d) return iso
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatCm(cm: number): string {
  return `${cm.toFixed(cm % 1 === 0 ? 0 : 1)} cm`
}

export function HeightLog({ onBack }: Props) {
  const [entries, setEntries] = useState<HeightEntry[]>(() => loadHeightLog())
  const [date, setDate] = useState(todayInputValue)
  const [cm, setCm] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const stats = useMemo(() => {
    if (entries.length === 0) return null
    const sorted = [...entries].sort((a, b) =>
      a.measuredAt.localeCompare(b.measuredAt),
    )
    const first = sorted[0]
    const latest = sorted[sorted.length - 1]
    const delta = latest.cm - first.cm
    return { first, latest, delta, count: entries.length }
  }, [entries])

  const chart = useMemo(() => {
    if (entries.length < 2) return null
    const sorted = [...entries].sort((a, b) =>
      a.measuredAt.localeCompare(b.measuredAt),
    )
    const values = sorted.map((e) => e.cm)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = Math.max(max - min, 0.1)
    const points = sorted.map((e, i) => {
      const x = (i / (sorted.length - 1)) * 100
      const y = 100 - ((e.cm - min) / span) * 100
      return `${x},${y}`
    })
    return { points: points.join(' '), min, max, sorted }
  }, [entries])

  const refresh = () => setEntries(loadHeightLog())

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const value = Number(cm.replace(',', '.'))
    if (!Number.isFinite(value) || value < 50 || value > 272) {
      setError('Enter a height between 50 and 272 cm.')
      return
    }
    if (!date) {
      setError('Pick a date.')
      return
    }
    addHeightEntry({
      measuredAt: date,
      cm: Math.round(value * 10) / 10,
      note: note.trim(),
    })
    setCm('')
    setNote('')
    setDate(todayInputValue())
    refresh()
  }

  const onDelete = (id: string) => {
    if (!window.confirm('Delete this height entry?')) return
    removeHeightEntry(id)
    refresh()
  }

  return (
    <div className="screen height-log">
      <header className="protocol-top">
        <button type="button" className="btn-ghost" onClick={onBack}>
          ← Home
        </button>
      </header>

      <header className="masthead">
        <p className="eyebrow">Progress</p>
        <h1 className="wordmark wordmark-sm">Height log</h1>
        <p className="lede">
          Track measurements on this device. Same time of day and conditions make
          comparisons more honest.
        </p>
      </header>

      {stats && (
        <section className="panel">
          <div className="panel-head">
            <h2>Snapshot</h2>
            <span className="panel-meta">{stats.count} entries</span>
          </div>
          <div className="height-stats">
            <div>
              <span className="stat-label">Latest</span>
              <span className="stat-value">{formatCm(stats.latest.cm)}</span>
            </div>
            <div>
              <span className="stat-label">First</span>
              <span className="stat-value">{formatCm(stats.first.cm)}</span>
            </div>
            <div>
              <span className="stat-label">Change</span>
              <span
                className={`stat-value${stats.delta > 0 ? ' is-up' : stats.delta < 0 ? ' is-down' : ''}`}
              >
                {stats.delta > 0 ? '+' : ''}
                {stats.delta.toFixed(1)} cm
              </span>
            </div>
          </div>
          {chart && (
            <div className="height-chart" aria-hidden>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                  points={chart.points}
                />
              </svg>
              <div className="height-chart-labels">
                <span>{formatCm(chart.min)}</span>
                <span>{formatCm(chart.max)}</span>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="panel">
        <div className="panel-head">
          <h2>Add entry</h2>
          <span className="panel-meta">Local only</span>
        </div>
        <form className="height-form" onSubmit={onSubmit}>
          <label className="field">
            <span className="field-label">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Height (cm)</span>
            <input
              type="number"
              inputMode="decimal"
              min={50}
              max={272}
              step={0.1}
              placeholder="e.g. 178.5"
              value={cm}
              onChange={(e) => setCm(e.target.value)}
              required
            />
          </label>
          <label className="field field-full">
            <span className="field-label">Note (optional)</span>
            <input
              type="text"
              maxLength={120}
              placeholder="Morning, no shoes…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary">
            Save measurement
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>History</h2>
          <span className="panel-meta">Newest first</span>
        </div>
        {entries.length === 0 ? (
          <p className="hint" style={{ marginTop: 0 }}>
            No entries yet. Log a baseline whenever you measure.
          </p>
        ) : (
          <ul className="height-list">
            {entries.map((e) => (
              <li key={e.id}>
                <div className="height-list-main">
                  <span className="height-list-cm">{formatCm(e.cm)}</span>
                  <span className="height-list-date">{formatDate(e.measuredAt)}</span>
                  {e.note ? <span className="height-list-note">{e.note}</span> : null}
                </div>
                <button
                  type="button"
                  className="btn-ghost height-delete"
                  onClick={() => onDelete(e.id)}
                  aria-label="Delete entry"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
