import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Activity, ChevronLeft, ChevronRight, HeartPulse, Pause, Play, RefreshCw, RotateCcw, Rocket, Server, ShieldCheck, Waypoints } from 'lucide-react'
import LessonCoach from './LessonCoach'
import StepSequenceControls from './StepSequenceControls'
import './ProbesLesson.css'
import './ModuleDiagramPolish.css'

const stages = [
  { title: 'Container booting', detail: 'The kubelet starts the container process and the container runtime allocates its network namespace.' },
  { title: 'Startup probe running', detail: 'Kubelet probes /started while the application initializes.' },
  { title: 'Startup gate opened', detail: 'Startup success unlocks readiness and liveness checks.' },
  { title: 'Readiness probe running', detail: 'Kubelet probes /ready to decide whether traffic should reach this Pod.' },
  { title: 'Endpoint published', detail: 'EndpointSlice adds 10.244.1.8:8080 and the ClusterIP can forward traffic.' },
  { title: 'Traffic flowing', detail: 'The ClusterIP Service forwards requests only to Ready endpoints.' },
  { title: 'Liveness monitoring', detail: 'Kubelet periodically calls /healthz while the container continues serving traffic.' },
  { title: 'Health result', detail: 'Success keeps the container running. Failure enters the restart recovery branch.' },
  { title: 'Container killed', detail: 'Liveness failure terminates the container process.' },
  { title: 'Container restarting', detail: 'The runtime starts a new container instance inside the existing Pod network sandbox.' },
  { title: 'Startup gate repeats', detail: 'The replacement container boots and probes start again before traffic returns.' },
]

export default function ProbesLesson({ onSelect }: { onSelect: (name: string) => void }) {
  const [stage, setStage] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [startupFailure, setStartupFailure] = useState(false)
  const [readinessFailure, setReadinessFailure] = useState(false)
  const [livenessFailure, setLivenessFailure] = useState(false)
  const [restartCount, setRestartCount] = useState(0)
  const [countdown, setCountdown] = useState(100)
  const [tested, setTested] = useState<Set<string>>(() => new Set())
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (!playing || reducedMotion) return
    setCountdown(100)
    const interval = window.setInterval(() => {
      setCountdown(value => Math.max(0, value - 4))
    }, 112)
    const timer = window.setTimeout(() => {
      if (stage === 9) setRestartCount(value => value + 1)
      setStage(current => {
        if (current === 1 && startupFailure) return 1
        if (current === 3 && readinessFailure) return 4
        if (current === 7 && livenessFailure) return 8
        if (current === 7) return 6
        if (current === 9) return 10
        if (current === 10) return 0
        return current + 1
      })
      setCountdown(100)
    }, 2800)
    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timer)
    }
  }, [playing, reducedMotion, stage, startupFailure, readinessFailure, livenessFailure])

  function reset() {
    setStage(0)
    setCountdown(100)
    setRestartCount(0)
    setStartupFailure(false)
    setReadinessFailure(false)
    setLivenessFailure(false)
    setPlaying(true)
    setTested(new Set())
  }

  function toggleFailure(type: 'startup' | 'readiness' | 'liveness') {
    setTested(current => new Set(current).add(type))
    if (type === 'startup') setStartupFailure(value => !value)
    if (type === 'readiness') setReadinessFailure(value => !value)
    if (type === 'liveness') setLivenessFailure(value => !value)
  }

  function previousStep() {
    setPlaying(false)
    setCountdown(100)
    setStage(value => Math.max(0, value - 1))
  }

  function nextStep() {
    setPlaying(false)
    setCountdown(100)
    if (stage === 9) setRestartCount(current => current + 1)
    setStage(value => value >= stages.length - 1 ? 0 : value + 1)
  }

  const startupBlocked = stage === 1 && startupFailure
  const startupPassed = stage >= 2 && stage <= 7 && !startupFailure
  const readinessBlocked = readinessFailure && stage >= 3 && stage <= 7
  const readinessPassed = stage >= 4 && stage <= 7 && !readinessFailure && startupPassed
  const killed = stage === 8
  const restarting = stage === 9
  const endpointEligible = startupPassed && readinessPassed && !killed && !readinessBlocked
  const current = stages[stage]

  return <div className="probes-scene probes-continuous">
    <div className="probe-sim-toolbar">
      <div><span className="probe-live-dot"/> POD HEALTH &amp; TRAFFIC LIFECYCLE</div>
      <StepSequenceControls active={stage} total={stages.length} playing={playing} intervalMs={2800} onPrevious={previousStep} onNext={nextStep} onToggle={() => setPlaying(value => !value)} onReset={reset} compact />
    </div>

    <motion.section className={`probe-lifecycle-workbench ${startupBlocked || readinessBlocked || killed ? 'probe-lifecycle-failure' : ''}`} initial={{ opacity: .7, y: 5 }} animate={{ opacity: 1, y: 0 }}>
      <header>
        <div><small>LIVE SEQUENCE · {String(stage + 1).padStart(2, '0')} / {String(stages.length).padStart(2, '0')}</small><b>{current.title}</b></div>
        <span className="probe-phase-status" style={{ '--step-progress': `${countdown}%` } as CSSProperties}> 
          <span className="probe-countdown"/> 
          {killed ? 'CONTAINER KILLED' : restarting ? 'RESTARTING' : startupBlocked ? 'STARTUP BLOCKED' : readinessBlocked ? 'NOT READY' : 'HEALTHY'}
        </span>
      </header>

      <div className="parallel-probe-map">
        <button className={`clusterip-node ${stage === 5 ? 'clusterip-active' : ''} ${!endpointEligible ? 'clusterip-blocked' : ''}`} onClick={() => onSelect('Service ClusterIP')}>
          <span className="node-icon"><Waypoints size={19}/></span><b>ClusterIP Service</b><small>10.96.20.40</small>
          <span className="traffic-status">{endpointEligible ? 'FORWARDING' : 'NO BACKEND'}</span>
        </button>

        <div className={`traffic-route ${!endpointEligible?'traffic-route-blocked':''}`} aria-hidden="true">
          <motion.span className="clusterip-packet" animate={{ x: endpointEligible ? [0, 72, 0] : 0, opacity: endpointEligible ? [0.3, 1, 0.3] : readinessBlocked ? [1,.45,1] : .18 }} transition={{ duration: endpointEligible ? 1.4 : .8, repeat: !killed && !restarting ? Infinity : 0, ease: 'easeInOut' }}/>
          <span className="route-line"/>
        </div>

        <div className="probe-pod-shell">
          <div className="probe-pod-heading"><Server size={15}/><div><b>Pod · api-01</b><small>10.244.1.8</small></div><span className={endpointEligible ? 'pod-running' : 'pod-blocked'}>{killed ? 'KILLED' : restarting ? 'RESTARTING' : endpointEligible ? 'RUNNING' : 'NOT READY'}</span></div>

          <div className="probe-pod-content">
            <div className="container-column">
              <motion.div className={`app-container-monitor ${killed ? 'container-killed' : restarting ? 'container-restarting' : ''} ${stage === 0 ? 'container-booting' : ''}`} onClick={() => onSelect('Application container')} animate={killed ? { opacity: [.2, .55, .2] } : restarting ? { scale: [.96, 1, .96] } : { opacity: 1, scale: 1 }} transition={{ duration: 1, repeat: killed || restarting ? Infinity : 0 }}>
                <span className="container-status-icon">{killed ? '×' : restarting ? '↻' : '◆'}</span>
                <div><b>api-container</b><small>{killed ? 'terminated' : restarting ? 'starting process' : stage === 0 ? 'booting...' : 'process running'}</small></div>
                <span className="container-port">:8080</span>
              </motion.div>
            </div>

            <div className="probe-rail">
              <motion.div className={`parallel-probe startup-probe ${stage === 1 ? 'probe-active' : ''} ${startupBlocked ? 'probe-failed' : ''} ${startupPassed ? 'probe-passed' : ''}`} onClick={() => onSelect('Startup probe')} animate={startupBlocked ? { scale: [1, .98, 1] } : { scale: 1 }} transition={{ duration: .8, repeat: startupBlocked ? Infinity : 0 }}>
                <span className="probe-icon"><Rocket size={14}/></span><div><b>Startup probe</b><small>/started</small></div><span className="probe-result">{startupBlocked ? 'FAIL' : startupPassed ? 'PASS' : stage === 1 ? 'CHECK' : 'WAIT'}</span>
              </motion.div>

              <motion.div className={`parallel-probe readiness-probe ${stage === 3 ? 'probe-active' : ''} ${readinessBlocked ? 'probe-failed' : ''} ${readinessPassed ? 'probe-passed' : ''}`} onClick={() => onSelect('Readiness probe')} animate={readinessBlocked ? { scale: [1, .98, 1] } : { scale: 1 }} transition={{ duration: .8, repeat: readinessBlocked ? Infinity : 0 }}>
                <span className="probe-icon"><HeartPulse size={14}/></span><div><b>Readiness probe</b><small>/ready</small></div><span className="probe-result">{readinessBlocked ? 'NOT READY' : readinessPassed ? 'READY' : stage === 3 ? 'CHECK' : 'GATED'}</span>
              </motion.div>

              <motion.div className={`parallel-probe liveness-probe ${stage === 6 || stage === 7 ? 'probe-active' : ''} ${stage === 7 && livenessFailure ? 'probe-failed' : ''}`} onClick={() => onSelect('Liveness probe')} animate={stage === 7 && livenessFailure ? { scale: [1, .98, 1] } : { scale: 1 }} transition={{ duration: .8, repeat: stage === 7 && livenessFailure ? Infinity : 0 }}>
                <span className="probe-icon"><RefreshCw size={14}/></span><div><b>Liveness probe</b><small>/healthz</small></div><span className="probe-result">{stage === 7 && livenessFailure ? 'KILL' : stage >= 6 ? 'HEALTHY' : 'GATED'}</span>
              </motion.div>
            </div>
          </div>

          <div className="pod-endpoints">
            <span>ENDPOINTSLICE</span>
            <b className={endpointEligible ? 'endpoint-live' : 'endpoint-empty'}>10.244.1.8:8080</b>
            <small>{endpointEligible ? 'ready=true · eligible' : 'ready=false · not eligible'}</small>
          </div>
        </div>
      </div>

      <motion.div key={current.title} className={`probe-explanation ${startupBlocked || readinessBlocked || killed ? 'probe-explanation-fail' : ''}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} aria-live="polite">
        <i/><div><b>{current.title}</b><p>{startupBlocked ? 'Startup has not passed. Readiness and liveness remain gated; this Pod is not eligible for normal Service traffic.' : readinessBlocked ? 'Readiness failed. The container remains running; its EndpointSlice entry can remain with ready=false, so normal Service traffic does not use it.' : killed ? 'Liveness failed. The container is killed and restarted in the same Pod sandbox; the Pod IP remains 10.244.1.8.' : current.detail}</p></div>
        <span>{restartCount ? `RESTART #${restartCount}` : 'RESTART #0'}</span>
      </motion.div>
    </motion.section>

    <div className="probe-failure-controls">
      <button className={startupFailure ? 'failure-active' : ''} onClick={() => toggleFailure('startup')}><Rocket size={14}/> Startup failure</button>
      <button className={readinessFailure ? 'failure-active' : ''} onClick={() => toggleFailure('readiness')}><HeartPulse size={14}/> Readiness failure</button>
      <button className={livenessFailure ? 'failure-active' : ''} onClick={() => toggleFailure('liveness')}><RefreshCw size={14}/> Liveness / kill</button>
    </div>

    <LessonCoach task="Watch the boot lifecycle, then trigger startup, readiness, or liveness failures and see which traffic branch changes." hint="Startup gates the other probes. Readiness affects endpoint eligibility. Liveness kills and restarts the container while preserving the Pod IP." complete={tested.size === 3} success="You compared startup gating, traffic readiness, and container recovery."/>
  </div>
}
