import type { SessionConfig } from '../data/protocol'
import type { SessionState } from '../hooks/useSession'

type Props = {
  config: SessionConfig
  state: SessionState
  onPause: () => void
  onResume: () => void
  onAbort: () => void
}

function fmtMs(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function fmtElapsed(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function SessionView({ config, state, onPause, onResume, onAbort }: Props) {
  const { phase, cycle, remainingMs, phaseTotalMs, elapsedSessionMs, paused } = state
  const progress =
    phaseTotalMs > 0 ? 1 - remainingMs / phaseTotalMs : 0

  const phaseLabel =
    phase === 'prep'
      ? 'Get ready'
      : phase === 'hang'
        ? 'Hang'
        : phase === 'rest'
          ? 'Rest'
          : phase

  const instruction =
    phase === 'prep'
      ? 'Hands on the bar. Session starts on zero.'
      : phase === 'hang'
        ? 'Full-body hang. Arms long, body quiet. Breathe.'
        : phase === 'rest'
          ? 'Feet down or lightly tethered. Drop the tension.'
          : ''

  // How many full 5s marks have passed in this phase (for visual metronome dots)
  const elapsedInPhase = phaseTotalMs - remainingMs
  const ticksInPhase = Math.floor(phaseTotalMs / 5000)
  const ticksDone = Math.min(ticksInPhase, Math.floor(elapsedInPhase / 5000))

  return (
    <div className={`screen session phase-${phase}${paused ? ' is-paused' : ''}`}>
      <header className="session-top">
        <button type="button" className="btn-ghost" onClick={onAbort}>
          End
        </button>
        <div className="session-meta">
          <span>
            Cycle {phase === 'prep' ? '—' : `${cycle} / ${config.cycles}`}
          </span>
          <span className="sep" aria-hidden>
            /
          </span>
          <span>Elapsed {fmtElapsed(elapsedSessionMs)}</span>
        </div>
      </header>

      <div className="phase-block">
        <p className="phase-eyebrow">
          {paused ? 'Paused' : phase === 'prep' ? 'Countdown' : 'Active phase'}
        </p>
        <h1 className="phase-title">{phaseLabel}</h1>
        <p className="phase-instruction">{instruction}</p>
      </div>

      <div className="timer-block" aria-live="polite" aria-atomic="true">
        <div className="timer-digits">{fmtMs(remainingMs)}</div>
        <div className="timer-track" aria-hidden>
          <div
            className="timer-fill"
            style={{ transform: `scaleX(${Math.min(1, Math.max(0, progress))})` }}
          />
        </div>
      </div>

      {(phase === 'hang' || phase === 'rest') && ticksInPhase > 0 && (
        <div className="metro-row" aria-hidden>
          {Array.from({ length: ticksInPhase }, (_, i) => (
            <span
              key={i}
              className={`metro-dot${i < ticksDone ? ' is-lit' : ''}`}
            />
          ))}
          <span className="metro-label">5s marks</span>
        </div>
      )}

      <div className="session-specs">
        <div>
          <span className="spec-k">Hang</span>
          <span className="spec-v">{config.hangSec}s</span>
        </div>
        <div>
          <span className="spec-k">Rest</span>
          <span className="spec-v">{config.restSec}s</span>
        </div>
        <div>
          <span className="spec-k">Metronome</span>
          <span className="spec-v">every 5s</span>
        </div>
      </div>

      <div className="session-actions">
        {paused ? (
          <button type="button" className="btn-primary" onClick={onResume}>
            Resume
          </button>
        ) : (
          <button
            type="button"
            className="btn-secondary"
            onClick={onPause}
            disabled={phase === 'prep'}
          >
            Pause
          </button>
        )}
      </div>
    </div>
  )
}
