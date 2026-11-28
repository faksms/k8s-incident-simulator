import { useEffect, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import { Activity, Box, RotateCcw } from 'lucide-react'
import { autoscalingExample, AutoscalingRange } from './AdministrationLabs'
import type { AutoscalingSettings } from './AdministrationLabs'
import './AutoscalingGuide.css'

const initialSettings: AutoscalingSettings = { metrics: 'yes', requests: 'yes', usage: 150, min: 1, max: 3 }
const phases = ['Collect CPU metrics', 'HPA compares with target', 'Update desired replicas', 'Workload reconciles Pods']

type DiagramProps = { settings: AutoscalingSettings; capacity: number; phase: number; reducedMotion: boolean }

function Signal({ id, children, reducedMotion }: { id: string; children: string; reducedMotion: boolean }) {
  return <motion.div className="autoscale-signal" layout={!reducedMotion} layoutId={reducedMotion ? undefined : id} transition={{ duration: .8, ease: 'easeInOut' }}>{children}</motion.div>
}

export function AutoscalingDiagram({ settings, capacity, phase, reducedMotion }: DiagramProps) {
  const { raw, desired } = autoscalingExample(settings)
  const applied = phase >= 2 && desired !== null ? desired : 2
  const shown = phase >= 3 && desired !== null ? desired : 2
  const ready = Math.min(shown, capacity)
  const metric = `${settings.usage}m CPU / Pod`
  const decision = desired === null ? '' : `Desired: ${desired}`

  return <LayoutGroup id="autoscaling-replay">
    <div className="autoscale-diagram">
      <div className="autoscale-flow">
        <div className="autoscale-zone autoscale-metrics"><h4><Activity size={16} aria-hidden="true"/> Resource metrics API</h4><small>{settings.metrics === 'yes' ? 'CPU measurements available' : 'Metrics unavailable'}</small><div className="autoscale-signal-space">{phase === 0 && settings.metrics === 'yes' && <Signal id="cpu-metric" reducedMotion={reducedMotion}>{metric}</Signal>}{phase === 0 && settings.metrics === 'no' && <span className="autoscale-warning">No CPU signal</span>}</div></div>
        <div className="autoscale-zone autoscale-hpa"><h4>HPA · orders-scaler</h4><small>CPU target: 50% of request</small><div className="autoscale-signal-space">{phase === 1 && settings.metrics === 'yes' && <Signal id="cpu-metric" reducedMotion={reducedMotion}>{metric}</Signal>}{phase === 1 && desired !== null && <Signal id="replica-decision" reducedMotion={reducedMotion}>{decision}</Signal>}{phase >= 1 && desired === null && <span className="autoscale-warning">CPU recommendation unavailable</span>}</div><small>{phase >= 1 && raw !== null ? `2 × ${settings.usage}% / 50% = ${raw}; bounded to ${desired}` : `Bounds: ${settings.min}–${settings.max} replicas`}</small></div>
        <div className="autoscale-zone autoscale-deployment"><h4>Deployment · orders-api</h4><small>Desired replicas: {applied}</small><div className="autoscale-signal-space">{phase === 2 && desired !== null && <Signal id="replica-decision" reducedMotion={reducedMotion}>{decision}</Signal>}{phase === 2 && desired === null && <span className="autoscale-warning">No update from this signal</span>}</div><small>Deployment → ReplicaSet → Pods</small></div>
      </div>
      <div className="autoscale-cluster">
        <div className="autoscale-cluster-head"><b>Example worker capacity</b><span>{ready} Ready · {shown - ready} Pending · capacity for {capacity} Pods</span></div>
        <div className="autoscale-pods" aria-label="Example workload Pods">
          <AnimatePresence initial={false}>
            {Array.from({ length: shown }, (_, index) => <motion.div key={index} layout={!reducedMotion} initial={reducedMotion ? false : { opacity: 0, scale: .7, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, scale: .7, y: 20 }} transition={{ duration: .55 }} className={`autoscale-pod ${index >= capacity ? 'autoscale-pending' : ''}`}>
              <Box size={17} aria-hidden="true"/><span><b>orders-{index + 1}</b><small>{index >= capacity ? 'Pending · no room' : 'Ready'}</small></span>
            </motion.div>)}
          </AnimatePresence>
        </div>
      </div>
      <div className="autoscale-feedback">↖ CPU usage from the existing Pods feeds the resource metrics API</div>
    </div>
  </LayoutGroup>
}

export default function AutoscalingGuide() {
  const reducedMotion = Boolean(useReducedMotion())
  const [settings, setSettings] = useState(initialSettings)
  const [capacity, setCapacity] = useState(6)
  const [phase, setPhase] = useState(0)
  const [playing, setPlaying] = useState(true)
  const { raw, desired } = autoscalingExample(settings)

  useEffect(() => {
    if (!playing || reducedMotion) return
    const timer = window.setInterval(() => setPhase(value => (value + 1) % phases.length), 2600)
    return () => window.clearInterval(timer)
  }, [playing, reducedMotion])

  function change(next: Partial<AutoscalingSettings>) {
    setSettings(current => ({ ...current, ...next }))
    setPhase(0)
  }
  function reset() {
    setSettings(initialSettings)
    setCapacity(6)
    setPhase(0)
    setPlaying(true)
  }

  return <section className="autoscale-guide" aria-labelledby="autoscale-guide-title">
    <header className="autoscale-header"><div><p>INTERACTIVE REPLAY · AUTOSCALING</p><h2 id="autoscale-guide-title">Watch the HPA respond</h2><span>Follow a CPU measurement through the autoscaler to a Deployment and its Pods. This replay has its own controls; changing a setting restarts it.</span></div><button type="button" onClick={reset}><RotateCcw size={15}/> Reset</button></header>
    <div className="autoscale-controls">
      <AutoscalingRange label="Average CPU per Pod" value={settings.usage} min={0} max={200} step={5} unit="m" onChange={usage => change({ usage })}/>
      <AutoscalingRange label="Minimum replicas" value={settings.min} min={1} max={settings.max} onChange={min => change({ min })}/>
      <AutoscalingRange label="Maximum replicas" value={settings.max} min={Math.max(2, settings.min)} max={6} onChange={max => change({ max })}/>
      <fieldset><legend>Resource metrics</legend><div><button type="button" aria-pressed={settings.metrics === 'yes'} onClick={() => change({ metrics: 'yes' })}>Available</button><button type="button" aria-pressed={settings.metrics === 'no'} onClick={() => change({ metrics: 'no' })}>Unavailable</button></div></fieldset>
      <fieldset><legend>CPU requests</legend><div><button type="button" aria-pressed={settings.requests === 'yes'} onClick={() => change({ requests: 'yes' })}>Present</button><button type="button" aria-pressed={settings.requests === 'no'} onClick={() => change({ requests: 'no' })}>Missing</button></div></fieldset>
      <AutoscalingRange label="Example node capacity" value={capacity} min={2} max={6} unit=" Pods" onChange={value => { setCapacity(value); setPhase(0) }}/>
    </div>
    <div className="autoscale-player"><span>{reducedMotion ? 'Reduced motion · step manually' : playing ? 'REPEATING EXAMPLE' : 'PAUSED'} · {phases[phase]}</span><div><button type="button" disabled={reducedMotion} onClick={() => setPlaying(value => !value)}>{playing && !reducedMotion ? 'Pause' : 'Play'}</button><button type="button" onClick={() => { setPlaying(false); setPhase(value => (value + 1) % phases.length) }}>Next step</button><button type="button" onClick={() => setPhase(0)}>Replay</button></div></div>
    <AutoscalingDiagram settings={settings} capacity={capacity} phase={phase} reducedMotion={reducedMotion}/>
    <div className="autoscale-outcome" role="status"><b>{phase < 1 ? 'Start with two Ready Pods' : desired === null ? 'No recommendation from this CPU signal' : phase < 2 ? `Calculated ${raw}, bounded to ${desired}` : phase < 3 ? `Deployment desired replicas: ${desired}` : `Desired ${desired} · ${Math.min(desired, capacity)} Ready · ${Math.max(0, desired - capacity)} Pending`}</b><span>{desired === null ? settings.metrics === 'no' ? 'The resource metrics API is unavailable in this example.' : 'CPU utilization cannot be calculated without the relevant CPU requests.' : raw !== desired ? `The configured ${raw !== null && raw > desired ? 'maximum' : 'minimum'} limits this recommendation.` : 'The recommendation is within the configured replica bounds.'}</span></div>
    <p className="autoscale-note">Illustrative replay: every cycle starts with two Ready Pods, each requesting 100m CPU when requests are present, and uses one fixed CPU sample. New Pods are assumed Ready only if this example has room; actual scheduling and readiness take time. Real HPA decisions also use tolerance, missing metrics, readiness, stabilization and scaling policies; other configured metrics can affect the result. HPA changes desired replicas, not node capacity. This is not a live cluster.</p>
  </section>
}
