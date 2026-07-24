import { useCallback, useEffect, useRef, useState } from 'react'
import { METRONOME_INTERVAL_MS, type SessionConfig } from '../data/protocol'
import {
  playDoneCue,
  playHangCue,
  playMetronomeTick,
  playPrepCue,
  playRestCue,
  unlockAudio,
} from '../lib/audio'
import { pushHistory } from '../lib/storage'

export type Phase = 'idle' | 'prep' | 'hang' | 'rest' | 'done'

export type SessionState = {
  phase: Phase
  cycle: number // 1-based during hang/rest
  remainingMs: number
  phaseTotalMs: number
  elapsedSessionMs: number
  paused: boolean
}

const PREP_MS = 5000
const TICK_MS = 100

function phaseDurationMs(phase: Phase, cfg: SessionConfig): number {
  if (phase === 'prep') return PREP_MS
  if (phase === 'hang') return cfg.hangSec * 1000
  if (phase === 'rest') return cfg.restSec * 1000
  return 0
}

export function useSession(cfg: SessionConfig) {
  const [state, setState] = useState<SessionState>({
    phase: 'idle',
    cycle: 0,
    remainingMs: 0,
    phaseTotalMs: 0,
    elapsedSessionMs: 0,
    paused: false,
  })

  const cfgRef = useRef(cfg)
  cfgRef.current = cfg

  const phaseRef = useRef<Phase>('idle')
  const cycleRef = useRef(0)
  const remainingRef = useRef(0)
  const phaseTotalRef = useRef(0)
  const elapsedRef = useRef(0)
  const pausedRef = useRef(false)
  const lastTickRef = useRef<number | null>(null)
  const metroAccRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const activeRef = useRef(false)

  const syncState = useCallback(() => {
    setState({
      phase: phaseRef.current,
      cycle: cycleRef.current,
      remainingMs: remainingRef.current,
      phaseTotalMs: phaseTotalRef.current,
      elapsedSessionMs: elapsedRef.current,
      paused: pausedRef.current,
    })
  }, [])

  const stopLoop = useCallback(() => {
    activeRef.current = false
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    lastTickRef.current = null
  }, [])

  const enterPhase = useCallback(
    (phase: Phase, cycle: number) => {
      const c = cfgRef.current
      phaseRef.current = phase
      cycleRef.current = cycle
      const total = phaseDurationMs(phase, c)
      phaseTotalRef.current = total
      remainingRef.current = total
      metroAccRef.current = 0

      if (phase === 'hang') playHangCue()
      else if (phase === 'rest') playRestCue()
      else if (phase === 'done') {
        playDoneCue()
        pushHistory({
          completedAt: new Date().toISOString(),
          cycles: c.cycles,
          hangSec: c.hangSec,
          restSec: c.restSec,
          mode: c.mode,
          presetId: c.presetId,
          finished: true,
          skippedFinalRest: c.skipFinalRest,
        })
      } else if (phase === 'prep') playPrepCue()

      syncState()
    },
    [syncState],
  )

  const advanceFrom = useCallback(
    (phase: Phase, cycle: number) => {
      const c = cfgRef.current
      if (phase === 'prep') {
        enterPhase('hang', 1)
        return
      }
      if (phase === 'hang') {
        // Last hang: optional skip of final rest
        if (c.skipFinalRest && cycle >= c.cycles) {
          enterPhase('done', cycle)
          stopLoop()
          return
        }
        enterPhase('rest', cycle)
        return
      }
      if (phase === 'rest') {
        if (cycle >= c.cycles) {
          enterPhase('done', cycle)
          stopLoop()
          return
        }
        enterPhase('hang', cycle + 1)
      }
    },
    [enterPhase, stopLoop],
  )

  const loop = useCallback(() => {
    if (!activeRef.current) return

    const now = performance.now()
    if (lastTickRef.current == null) lastTickRef.current = now
    const rawDt = now - lastTickRef.current
    lastTickRef.current = now

    // Cap dt so tab-switch doesn't skip whole phases silently
    const dt = Math.min(rawDt, 250)

    if (!pausedRef.current && phaseRef.current !== 'done' && phaseRef.current !== 'idle') {
      remainingRef.current = Math.max(0, remainingRef.current - dt)
      if (phaseRef.current === 'hang' || phaseRef.current === 'rest') {
        elapsedRef.current += dt
        metroAccRef.current += dt
        // Beep every 5s from phase start (5, 10, 15…) so elapsed time is audible
        while (metroAccRef.current >= METRONOME_INTERVAL_MS) {
          metroAccRef.current -= METRONOME_INTERVAL_MS
          // Don't double-cue at exact phase end; advance handles that
          if (remainingRef.current > 40) {
            playMetronomeTick()
          }
        }
      }

      if (remainingRef.current <= 0) {
        advanceFrom(phaseRef.current, cycleRef.current)
      } else {
        // Throttle React updates ~10fps for smoothness without thrash
        if (Math.floor(now / TICK_MS) !== Math.floor((now - dt) / TICK_MS)) {
          syncState()
        }
      }
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [advanceFrom, syncState])

  const start = useCallback(async () => {
    await unlockAudio()
    stopLoop()
    elapsedRef.current = 0
    pausedRef.current = false
    metroAccRef.current = 0
    enterPhase('prep', 0)
    activeRef.current = true
    lastTickRef.current = null
    rafRef.current = requestAnimationFrame(loop)
  }, [enterPhase, loop, stopLoop])

  const pause = useCallback(() => {
    if (phaseRef.current === 'idle' || phaseRef.current === 'done') return
    pausedRef.current = true
    lastTickRef.current = null
    syncState()
  }, [syncState])

  const resume = useCallback(async () => {
    if (!pausedRef.current) return
    await unlockAudio()
    pausedRef.current = false
    lastTickRef.current = null
    syncState()
    if (!activeRef.current) {
      activeRef.current = true
      rafRef.current = requestAnimationFrame(loop)
    }
  }, [loop, syncState])

  const abort = useCallback(() => {
    stopLoop()
    phaseRef.current = 'idle'
    cycleRef.current = 0
    remainingRef.current = 0
    phaseTotalRef.current = 0
    elapsedRef.current = 0
    pausedRef.current = false
    metroAccRef.current = 0
    syncState()
  }, [stopLoop, syncState])

  const resetToIdle = useCallback(() => {
    abort()
  }, [abort])

  useEffect(() => () => stopLoop(), [stopLoop])

  return {
    state,
    start,
    pause,
    resume,
    abort,
    resetToIdle,
  }
}
