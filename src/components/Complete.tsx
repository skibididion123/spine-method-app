import { formatDuration, type SessionConfig } from '../data/protocol'

type Props = {
  config: SessionConfig
  elapsedMs: number
  onAgain: () => void
  onHome: () => void
}

export function Complete({ config, elapsedMs, onAgain, onHome }: Props) {
  const elapsedSec = Math.round(elapsedMs / 1000)

  return (
    <div className="screen complete">
      <header className="masthead masthead-tight">
        <p className="eyebrow">Session complete</p>
        <h1 className="wordmark wordmark-sm">Work done.</h1>
        <p className="lede">
          You finished {config.cycles} hang/rest cycles. Drop off the bar, walk a little,
          drink water. Consistency beats hero sets.
        </p>
      </header>

      <div className="complete-stats">
        <div className="complete-stat">
          <span className="stat-label">Cycles</span>
          <span className="stat-value lg">{config.cycles}</span>
        </div>
        <div className="complete-stat">
          <span className="stat-label">Hang / rest</span>
          <span className="stat-value lg">
            {config.hangSec}s / {config.restSec}s
          </span>
        </div>
        <div className="complete-stat">
          <span className="stat-label">Time under clock</span>
          <span className="stat-value lg">{formatDuration(elapsedSec)}</span>
        </div>
      </div>

      <div className="complete-actions">
        <button type="button" className="btn-primary" onClick={onAgain}>
          Run again
        </button>
        <button type="button" className="btn-secondary" onClick={onHome}>
          Back to setup
        </button>
      </div>
    </div>
  )
}
