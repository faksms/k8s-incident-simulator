import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Boxes, Clock3, RotateCcw } from 'lucide-react'
import LessonCoach from './LessonCoach'
import PriorityDiagram from './PriorityDiagram'
import { initialPrioritySettings, nextPriorityStep, priorityQueue } from './priorityModel'
import type { PriorityModule, PrioritySettings } from './priorityModel'
import './PriorityLesson.css'

export function PriorityIntro() {
  const [tier, setTier] = useState<PrioritySettings['tier']>('batch')
  const order = priorityQueue(tier)
  return <div className="concept-lab priority-intro">
    <div className="lab-heading"><div><small>INTERACTIVE LAB · PRIORITY</small><h2>Who gets considered first?</h2></div><Boxes size={23}/></div>
    <p className="lab-intro">Choose the incoming Pod's priority. The queue is sorted before the scheduler checks whether a node fits.</p>
    <div className="lab-actions"><button type="button" aria-pressed={tier === 'batch'} onClick={() => setTier('batch')}>pod-alpha: low · 50</button><button type="button" aria-pressed={tier === 'critical'} onClick={() => setTier('critical')}>pod-alpha: high · 1000</button></div>
    <div className="priority-intro-queue" aria-label="Example pending queue">{order.map((pod, index) => <div key={pod.id} className={pod.id === 'incoming' ? 'incoming' : ''}><small>#{index + 1}</small><b>{pod.name}</b><span>priority {pod.value}</span></div>)}</div>
    <div className="lab-result" role="status"><b>{order[0].name} is first in this example</b><p>Priority affects queue order, not whether the Pod satisfies resource or placement requirements.</p></div>
    <LessonCoach task="Choose high priority and see where pod-alpha appears." hint="A larger value goes ahead of lower-priority pending Pods." complete={tier === 'critical'} success="pod-alpha is considered before the lower-priority Pods in this example."/>
  </div>
}

const modules: { id: PriorityModule; label: string }[] = [
  { id: 'queue', label: '1 · Queue order' },
  { id: 'preemption', label: '2 · Preemption' },
  { id: 'inheritance', label: '3 · Priority inheritance' },
]

export default function PriorityAnimation() {
  const reducedMotion = useReducedMotion()
  const [module, setModule] = useState<PriorityModule>('queue')
  const [settings, setSettings] = useState(initialPrioritySettings)
  const [playing, setPlaying] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!playing || reducedMotion) return
    const timer = window.setInterval(() => setTick(value => (value + 1) % 9), 1000)
    return () => window.clearInterval(timer)
  }, [playing, reducedMotion])

  function change(next: Partial<PrioritySettings>) {
    setSettings(current => ({ ...current, ...next }))
    setTick(0)
  }
  function selectModule(next: PriorityModule) {
    setModule(next)
    setTick(0)
  }
  function reset() {
    setSettings(initialPrioritySettings)
    setModule('queue')
    setTick(0)
    setPlaying(true)
  }

  return <section className="priority-guide" aria-labelledby="priority-guide-title">
    <header className="priority-guide-head"><div><p>INTERACTIVE REPLAY · PRIORITY CLASSES</p><h2 id="priority-guide-title">Watch priority in action</h2><span>The example repeats automatically. Change a setting to restart the cycle; pause or step through it at any time.</span></div><button type="button" onClick={reset}><RotateCcw size={15}/> Reset</button></header>
    <div className="priority-tabs" aria-label="PriorityClass concepts">{modules.map(item => <button type="button" key={item.id} aria-pressed={module === item.id} onClick={() => selectModule(item.id)}>{item.label}</button>)}</div>
    <div className="priority-controls">
      {module !== 'inheritance' && <fieldset><legend>Incoming pod-alpha priority</legend><div><button type="button" aria-pressed={settings.tier === 'critical'} onClick={() => change({ tier: 'critical' })}>High · 1000</button><button type="button" aria-pressed={settings.tier === 'batch'} onClick={() => change({ tier: 'batch' })}>Low · 50</button></div></fieldset>}
      {module === 'preemption' && <><fieldset><legend>Incoming Pod preemptionPolicy</legend><div><button type="button" aria-pressed={settings.policy === 'PreemptLowerPriority'} onClick={() => change({ policy: 'PreemptLowerPriority' })}>PreemptLowerPriority</button><button type="button" aria-pressed={settings.policy === 'Never'} onClick={() => change({ policy: 'Never' })}>Never</button></div></fieldset><fieldset><legend>Victim PDB in this example</legend><div><button type="button" aria-pressed={!settings.pdb} onClick={() => change({ pdb: false })}>No violation</button><button type="button" aria-pressed={settings.pdb} onClick={() => change({ pdb: true })}>Would be violated</button></div></fieldset></>}
      {module === 'inheritance' && <><fieldset><legend>Deployment Pod template</legend><div><button type="button" aria-pressed={settings.explicit} onClick={() => change({ explicit: true })}>Explicit class</button><button type="button" aria-pressed={!settings.explicit} onClick={() => change({ explicit: false })}>No class specified</button></div></fieldset><fieldset><legend>Cluster global default</legend><div><button type="button" aria-pressed={settings.globalDefault} onClick={() => change({ globalDefault: true })}>Defined · 100</button><button type="button" aria-pressed={!settings.globalDefault} onClick={() => change({ globalDefault: false })}>None · 0</button></div></fieldset></>}
    </div>
    <div className="priority-player"><span><Clock3 size={15}/> {reducedMotion ? 'Reduced motion: step manually' : playing ? 'REPEATING EXAMPLE' : 'PAUSED'}</span><div><button type="button" onClick={() => setPlaying(value => !value)} disabled={Boolean(reducedMotion)}>{playing && !reducedMotion ? 'Pause' : 'Play'}</button><button type="button" onClick={() => { setPlaying(false); setTick(value => nextPriorityStep(module, value)) }}>Next step</button><button type="button" onClick={() => setTick(0)}>Replay</button></div></div>
    <PriorityDiagram module={module} settings={settings} tick={tick} playing={playing} reducedMotion={Boolean(reducedMotion)}/>
    <p className="priority-guide-note">Illustrative, repeating simulation; it does not operate a cluster. Queue ordering is simplified. Preemption requires a feasible node after lower-priority victims are removed; nomination does not guarantee placement on that node. Grace periods and other scheduling constraints can delay or prevent placement. Read the <a href="https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/" target="_blank" rel="noreferrer">Kubernetes documentation</a>.</p>
  </section>
}
