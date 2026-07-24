import { useCallback, useEffect, useState } from 'react'
import { Complete } from './components/Complete'
import { HeightLog } from './components/HeightLog'
import { Protocol } from './components/Protocol'
import { SessionView } from './components/SessionView'
import { Setup } from './components/Setup'
import type { SessionConfig } from './data/protocol'
import { useSession } from './hooks/useSession'
import { loadConfig, saveConfig } from './lib/storage'

type Screen = 'setup' | 'session' | 'complete' | 'protocol' | 'height'

export default function App() {
  const [config, setConfig] = useState<SessionConfig>(() => loadConfig())
  const [screen, setScreen] = useState<Screen>('setup')
  const [dataRevision, setDataRevision] = useState(0)
  const { state, start, pause, resume, abort, resetToIdle } = useSession(config)

  useEffect(() => {
    saveConfig(config)
  }, [config])

  useEffect(() => {
    const onImported = () => {
      setConfig(loadConfig())
      setDataRevision((n) => n + 1)
    }
    window.addEventListener('spine-method:imported', onImported)
    return () => window.removeEventListener('spine-method:imported', onImported)
  }, [])

  // When session finishes, flip to complete screen
  useEffect(() => {
    if (state.phase === 'done') {
      setScreen('complete')
    }
  }, [state.phase])

  const handleStart = useCallback(async () => {
    setScreen('session')
    await start()
  }, [start])

  const handleAbort = useCallback(() => {
    abort()
    setScreen('setup')
  }, [abort])

  const handleAgain = useCallback(async () => {
    setScreen('session')
    await start()
  }, [start])

  const handleHome = useCallback(() => {
    resetToIdle()
    setScreen('setup')
  }, [resetToIdle])

  return (
    <div className="app-shell">
      <div className="grain" aria-hidden />
      {screen === 'setup' && (
        <Setup
          config={config}
          onChange={setConfig}
          onStart={handleStart}
          onOpenProtocol={() => setScreen('protocol')}
          onOpenHeight={() => setScreen('height')}
          dataRevision={dataRevision}
        />
      )}
      {screen === 'protocol' && <Protocol onBack={() => setScreen('setup')} />}
      {screen === 'height' && <HeightLog onBack={() => setScreen('setup')} />}
      {screen === 'session' && (
        <SessionView
          config={config}
          state={state}
          onPause={pause}
          onResume={resume}
          onAbort={handleAbort}
        />
      )}
      {screen === 'complete' && (
        <Complete
          config={config}
          elapsedMs={state.elapsedSessionMs}
          onAgain={handleAgain}
          onHome={handleHome}
        />
      )}
    </div>
  )
}
