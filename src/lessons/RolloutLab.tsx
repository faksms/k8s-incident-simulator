import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Box, Boxes } from 'lucide-react'
import LessonCoach from './LessonCoach'
import { advanceRollout, initialRollout, undoRollout } from './rolloutModel'
import type { RolloutScenario, RolloutStage, RolloutState } from './rolloutModel'
import './ConceptLabs.css'
import './RolloutLab.css'

const descriptions: Record<RolloutStage, { title: string; detail: string }> = {
  baseline: { title: 'Three old Pods are serving', detail: 'The Deployment starts with three Ready v1 Pods. A Pod template update begins the rollout.' },
  'starting-new': { title: 'Create a new Pod', detail: 'The new ReplicaSet adds one v2 Pod. The surge allows a fourth Pod while it starts.' },
  'new-ready': { title: 'New Pod becomes Ready', detail: 'The new Pod can now serve traffic. The old Pods are still present at this step.' },
  'removed-old': { title: 'Retire one old Pod', detail: 'The old ReplicaSet scales down after the replacement is Ready. The controller repeats this cycle.' },
  stalled: { title: 'Rollout blocked: readiness fails', detail: 'The new Pod is not Ready, so this example keeps the old Pods. Investigate or roll back; a failed rollout is not automatically undone.' },
  complete: { title: 'Rollout complete', detail: 'All three Ready Pods use v2. The old ReplicaSet can remain at zero for revision history.' },
  'undo-requested': { title: 'Rollback requested', detail: 'The Deployment restores the earlier Pod template, then reconciles its ReplicaSets gradually.' },
  'discard-new': { title: 'Remove the unready v2 Pod', detail: 'The failed or starting Pod is removed while the three Ready copies remain.' },
  'starting-old': { title: 'Bring back a v1 Pod', detail: 'The old ReplicaSet creates a replacement before a Ready v2 Pod is removed.' },
  'old-ready': { title: 'Restored Pod becomes Ready', detail: 'The v1 replacement is Ready; the example can now retire a v2 Pod.' },
  'removed-new': { title: 'Retire one v2 Pod', detail: 'The new ReplicaSet scales down. Repeat until the earlier template is restored.' },
  restored: { title: 'Rollback complete', detail: 'Three Ready v1 Pods are serving again. Rollback restores a template, not external data.' },
}

function ReplicaSet({ version, ready, starting, failed, reducedMotion }: { version: 'old' | 'new'; ready: number; starting: boolean; failed: boolean; reducedMotion: boolean }) {
  const pods = Array.from({ length: ready + (starting ? 1 : 0) }, (_, index) => index + 1)
  return <section className={`rollout-set rollout-set-${version}`} aria-label={`${version === 'old' ? 'Old' : 'New'} ReplicaSet`}>
    <header><div><small>{version === 'old' ? 'PREVIOUS TEMPLATE' : 'UPDATED TEMPLATE'}</small><h3>ReplicaSet · orders-{version === 'old' ? 'v1' : 'v2'}</h3></div><b>{ready} Ready</b></header>
    <div className="rollout-set-pods">
      <AnimatePresence initial={false}>
        {pods.map(number => {
          const isStarting = starting && number === ready + 1
          const label = isStarting ? failed ? 'Not Ready' : 'Starting' : 'Ready'
          return <motion.div key={number} layout={!reducedMotion} initial={reducedMotion ? false : { opacity: 0, y: -25, scale: .75 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reducedMotion ? undefined : { opacity: 0, y: 25, scale: .75 }} transition={{ duration: .65 }} className={`rollout-pod ${isStarting ? 'rollout-pod-starting' : ''} ${failed && isStarting ? 'rollout-pod-failed' : ''}`}>
            <Box size={17} aria-hidden="true"/><span><b>orders-{version === 'old' ? 'v1' : 'v2'}-{number}</b><small>{label}</small></span>
          </motion.div>
        })}
      </AnimatePresence>
      {pods.length === 0 && <span className="rollout-empty">No Pods in this ReplicaSet</span>}
    </div>
  </section>
}

export default function RolloutLab() {
  const reducedMotion = Boolean(useReducedMotion())
  const [scenario, setScenario] = useState<RolloutScenario>('healthy')
  const [state, setState] = useState<RolloutState>(initialRollout)
  const [playing, setPlaying] = useState(true)
  const [sawFailure, setSawFailure] = useState(false)
  const waiting = state.stage === 'stalled' || state.stage === 'restored'
  const undoAvailable = undoRollout(state) !== state
  const current = descriptions[state.stage]

  useEffect(() => {
    if (!playing || reducedMotion || waiting) return
    const timer = window.setTimeout(() => setState(current => advanceRollout(current, scenario)), 2400)
    return () => window.clearTimeout(timer)
  }, [playing, reducedMotion, scenario, state, waiting])
  useEffect(() => {
    if (state.stage === 'stalled') setSawFailure(true)
  }, [state.stage])

  function choose(value: RolloutScenario) {
    setScenario(value)
    setState(initialRollout)
    setPlaying(true)
    setSawFailure(false)
  }
  function reset() {
    setState(initialRollout)
    setPlaying(true)
    setSawFailure(false)
  }

  return <div className="concept-lab">
    <div className="lab-heading"><div><small>INTERACTIVE LAB · ROLLOUTS</small><h2>Watch a rolling update and rollback</h2></div><Boxes size={23}/></div>
    <p className="lab-intro">Follow the Deployment as its ReplicaSets replace Pods one at a time. Try a failing readiness check, then roll back to the previous template.</p>
    <fieldset className="rollout-scenarios"><legend>NEW VERSION SCENARIO</legend><div><button type="button" aria-pressed={scenario === 'healthy'} onClick={() => choose('healthy')}>Healthy update</button><button type="button" aria-pressed={scenario === 'unready'} onClick={() => choose('unready')}>Readiness failure</button></div></fieldset>
    <div className="rollout-player"><span>{reducedMotion ? 'REDUCED MOTION · STEP MANUALLY' : waiting ? 'WAITING FOR YOU' : playing ? 'PLAYING EXAMPLE' : 'PAUSED'}</span><div><button type="button" disabled={reducedMotion || waiting} onClick={() => setPlaying(value => !value)}>{playing && !reducedMotion && !waiting ? 'Pause' : 'Play'}</button><button type="button" disabled={waiting} onClick={() => { setPlaying(false); setState(current => advanceRollout(current, scenario)) }}>Next step</button><button type="button" onClick={reset}>Replay</button><button type="button" className="rollout-undo-button" disabled={!undoAvailable} onClick={() => setState(undoRollout)}>Roll back to v1</button></div></div>
    <div className="rollout-stage">
      <div className="rollout-deployment"><div><small>DEPLOYMENT</small><b>orders-api</b></div><span>Desired: 3 replicas</span><span>maxSurge: 1</span><span>maxUnavailable: 0</span></div>
      <div className="rollout-revision"><span>{['undo-requested', 'discard-new', 'starting-old', 'old-ready', 'removed-new', 'restored'].includes(state.stage) || state.stage === 'baseline' ? 'Template: orders v1' : 'Template: orders v2'}</span><span>Deployment → ReplicaSets → Pods</span></div>
      <div className="rollout-sets">
        <ReplicaSet version="old" ready={state.oldReady} starting={state.starting === 'old'} failed={false} reducedMotion={reducedMotion}/>
        <ReplicaSet version="new" ready={state.newReady} starting={state.starting === 'new'} failed={state.stage === 'stalled' || (state.stage === 'undo-requested' && scenario === 'unready' && state.starting === 'new' && state.newReady === 1)} reducedMotion={reducedMotion}/>
      </div>
      <div className="rollout-capacity"><span><b>{state.oldReady + state.newReady}</b> Ready Pods</span><span><b>{state.oldReady + state.newReady + (state.starting ? 1 : 0)} / 4</b> example Pods · 3 desired + 1 surge</span></div>
      <p className="rollout-limits"><b>maxSurge 1:</b> allow one extra Pod during replacement. <b>maxUnavailable 0:</b> keep all three desired copies available during this example. Here, Ready Pods count as available immediately.</p>
    </div>
    <div className={`lab-result ${state.stage === 'stalled' ? 'lab-result-warning' : 'lab-result-good'}`} role="status"><b>{current.title}</b><p>{current.detail}</p></div>
    <LessonCoach task="Choose Readiness failure. When the rollout stalls, roll back and follow the old Pods returning." hint="Let the replay reach the failure, then choose Roll back to v1. Use Next step if paused or reduced motion is enabled." complete={sawFailure && state.stage === 'restored'} success="The previous template is restored after the failed update; rollback does not undo external data changes."/>
    <p className="lab-source">Illustrative Deployment: 3 replicas, maxSurge 1 and maxUnavailable 0; Pods become available immediately when Ready, and capacity is sufficient. This replay starts over after a healthy rollout; the failure and rollback stop for inspection. Real scheduling, readiness, minReadySeconds and termination take time, and terminating Pods can temporarily exceed the surge count. Revision history can be pruned. Rollback does not undo database migrations or other external changes. <a href="https://kubernetes.io/docs/concepts/workloads/controllers/deployment/" target="_blank" rel="noreferrer">Deployment documentation</a>.</p>
  </div>
}
