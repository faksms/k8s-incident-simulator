import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { Box } from 'lucide-react'
import type { AutoscalingSettings } from './AdministrationLabs'
import './CpuScalingDiagram.css'

type Props = {
  settings: AutoscalingSettings
  result: { raw: number | null; desired: number | null }
  phase: number
  reducedMotion: boolean
}

function Signal({ id, text, reducedMotion }: { id: string; text: string; reducedMotion: boolean }) {
  return <motion.div className="cpu-replay-signal" layout={!reducedMotion} layoutId={reducedMotion ? undefined : id} transition={{ duration: .8, ease: 'easeInOut' }}>{text}</motion.div>
}

export default function CpuScalingDiagram({ settings, result, phase, reducedMotion }: Props) {
  const hasMetrics = settings.metrics === 'yes'
  const calculable = result.raw !== null && result.desired !== null
  const belowTarget = calculable && settings.usage < 50
  const replicas = result.desired === null ? [] : Array.from({ length: result.desired }, (_, index) => index + 1)
  const shown = phase >= 3 && result.desired !== null ? result.desired : 2
  const action = result.desired === null ? 'No CPU recommendation: keep the two example Pods'
    : result.desired > 2 ? `Scale up: add ${result.desired - 2} ${result.desired - 2 === 1 ? 'Pod' : 'Pods'}`
    : result.desired < 2 ? 'Scale down: remove 1 Pod'
    : 'No change: keep 2 Pods'

  return <LayoutGroup id="cpu-calculation">
    <div className="cpu-replay" aria-label="CPU demand to replica calculation">
      <div className="cpu-replay-zones">
        <div className="cpu-replay-zone cpu-replay-pods">
          <h3>1 · Measure two Pods</h3>
          {belowTarget && <div className="cpu-replay-load">
            <b>Load drops below the target</b>
            <small>Illustrative drop: 50m target → {settings.usage}m per Pod ({settings.usage}% utilization)</small>
            <div className="cpu-replay-load-track" aria-hidden="true"><motion.div key={`${phase === 0 ? 'replay' : 'settled'}-${settings.usage}`} initial={reducedMotion || phase !== 0 ? false : { width: '100%' }} animate={{ width: `${settings.usage * 2}%` }} transition={{ duration: 1.2, ease: 'easeInOut' }}/></div>
          </div>}
          {[1, 2].map(number => <div className="cpu-replay-pod" key={number}><b><Box size={14} aria-hidden="true"/> orders-{number}</b><small>CPU request: {settings.requests === 'yes' ? '100m' : 'missing'}</small>{hasMetrics ? <><meter min={0} max={200} value={settings.usage} aria-label={`orders-${number} CPU usage ${settings.usage} millicores`}/><small>{settings.usage}m CPU used</small></> : <small>CPU measurement unavailable</small>}</div>)}
          <div className="cpu-replay-token">{phase === 0 && hasMetrics && <Signal id="cpu-sample" text={`${settings.usage}m average`} reducedMotion={reducedMotion}/>}</div>
        </div>
        <div className="cpu-replay-zone cpu-replay-calculate">
          <h3>2 · Compare with target</h3>
          <small>Target: 50% of requested CPU</small>
          <div className="cpu-replay-token">{phase === 1 && hasMetrics && <Signal id="cpu-sample" text={`${settings.usage}m average`} reducedMotion={reducedMotion}/>}</div>
          {phase >= 1 ? calculable ? <><b className="cpu-replay-number">{settings.usage}% utilization</b><small>ceil(2 Pods × {settings.usage}% ÷ 50%) = {result.raw}</small></> : <b className="cpu-replay-warning">{hasMetrics ? 'CPU request missing' : 'Metrics unavailable'}: cannot calculate utilization</b> : <small>Waiting for a CPU sample</small>}
          <div className="cpu-replay-token">{phase === 1 && calculable && <Signal id="cpu-decision" text={`Calculated: ${result.raw}`} reducedMotion={reducedMotion}/>}</div>
        </div>
        <div className="cpu-replay-zone cpu-replay-result">
          <h3>3 · Apply limits</h3><small>Minimum {settings.min} · maximum {settings.max}</small>
          <div className="cpu-replay-token">{phase === 2 && calculable && <Signal id="cpu-decision" text={`Calculated: ${result.raw}`} reducedMotion={reducedMotion}/>}</div>
          {phase >= 2 ? calculable ? <><b className="cpu-replay-number">{result.desired} desired replicas</b><small>{result.raw === result.desired ? 'Within the configured bounds' : 'Adjusted to the configured bounds'}</small><div className="cpu-replay-replicas" aria-label={`${result.desired} desired replicas, not running Pods`}><AnimatePresence>{replicas.map(number => <motion.div key={number} initial={reducedMotion ? false : { opacity: 0, scale: .6, y: -12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, scale: .6 }} transition={{ duration: .4, delay: reducedMotion ? 0 : (number - 1) * .06 }}><Box size={15} aria-hidden="true"/><span>Desired {number}</span></motion.div>)}</AnimatePresence></div></> : <b className="cpu-replay-warning">No replica recommendation from this CPU signal</b> : <small>Waiting for the calculation</small>}
        </div>
      </div>
      <div className="cpu-replay-cluster">
        <div className="cpu-replay-cluster-heading"><div><h3>4 · Reconcile on worker nodes</h3><small>Deployment → ReplicaSet → Pods · example placement</small></div><b>{phase >= 3 ? action : 'Starting with 2 Pods'}</b></div>
        <div className="cpu-replay-workers">
          {[1, 2].map(node => <div className="cpu-replay-worker" key={node}>
            <h4>Worker node {node}</h4>
            <div className="cpu-replay-worker-pods" aria-label={`Worker node ${node} example Pods`}>
              <AnimatePresence initial={false}>
                {Array.from({ length: shown }, (_, index) => index + 1).filter(number => (number - 1) % 2 === node - 1).map(number =>
                  <motion.div className="cpu-replay-worker-pod" key={number} layout={!reducedMotion} initial={reducedMotion ? false : { opacity: 0, y: -24, scale: .7 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reducedMotion ? undefined : { opacity: 0, y: 24, scale: .7 }} transition={{ duration: .7 }}>
                    <Box size={16} aria-hidden="true"/><span><b>orders-{number}</b><small>{number > 2 ? 'Example scheduled Pod' : 'Existing Pod'}</small></span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>)}
        </div>
        <small>{phase >= 3 ? 'The ReplicaSet creates or removes Pods; the scheduler assigns new Pods to eligible nodes.' : 'The worker view updates after the bounded replica decision.'}</small>
      </div>
      <p>Each replay starts with two Pods and uses one fixed CPU sample. Placement assumes available capacity; scheduled Pods are not necessarily Running or Ready. Below target does not always remove a Pod: rounding and replica limits also matter.</p>
    </div>
  </LayoutGroup>
}
