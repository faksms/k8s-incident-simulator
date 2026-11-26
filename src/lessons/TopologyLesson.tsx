import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Cuboid, RotateCcw, ShieldCheck } from 'lucide-react'
import LessonCoach from './LessonCoach'
import { nodePodCapacity, topologyNodes as nodes, topologyPlacements, topologyZones as zones } from './topologyExperiment'
import type { FailureScope, PlacementPolicy, SpreadKey } from './topologyExperiment'
import './TopologyLesson.css'
import './TopologyLessonInteraction.css'
import './ModuleDiagramPolish.css'
import './TopologyNeon.css'

export default function TopologyLesson({ onSelect }: { onSelect: (name: string) => void }) {
  const [replicas, setReplicas] = useState(8)
  const [spreadKey, setSpreadKey] = useState<SpreadKey>('node')
  const [policy, setPolicy] = useState<PlacementPolicy>('strict')
  const [failureScope, setFailureScope] = useState<FailureScope>('node')
  const [failedTarget, setFailedTarget] = useState('node-02')
  const [failureActive, setFailureActive] = useState(false)
  const [preferredNode, setPreferredNode] = useState('any')
  const [sawZoneSpread, setSawZoneSpread] = useState(false)
  const [sawNodeFailure, setSawNodeFailure] = useState(false)
  const [sawZoneFailure, setSawZoneFailure] = useState(false)

  const placements = useMemo(() => topologyPlacements({ replicas, spreadKey, policy, failureScope, failedTarget, failureActive, preferredNode }), [replicas, spreadKey, policy, failureScope, failedTarget, failureActive, preferredNode])

  const countsByNode = nodes.map((_, nodeIndex) => placements.filter(placement => placement.node === nodeIndex).length)
  const countsByZone = zones.map(zone => placements.filter(placement => placement.node !== null && nodes[placement.node].zone === zone).length)
  const pending = placements.filter(placement => placement.node === null).length
  const activeNodes = nodes.filter((_, index) => !(failureActive && (failureScope === 'node' ? nodes[index].name === failedTarget : nodes[index].zone === failedTarget))).length
  const domainCounts = spreadKey === 'node' ? countsByNode : countsByZone
  const skew = domainCounts.length ? Math.max(...domainCounts) - Math.min(...domainCounts) : 0

  function triggerFailure() {
    if (!failureActive && failureScope === 'node' && failedTarget === 'node-02') setSawNodeFailure(true)
    if (!failureActive && failureScope === 'zone' && failedTarget === 'zone-a') setSawZoneFailure(true)
    setFailureActive(value => !value)
  }

  function reset() {
    setReplicas(8)
    setSpreadKey('node')
    setPolicy('strict')
    setFailureScope('node')
    setFailedTarget('node-02')
    setFailureActive(false)
    setPreferredNode('any')
    setSawZoneSpread(false)
    setSawNodeFailure(false)
    setSawZoneFailure(false)
  }

  const targetOptions = failureScope === 'node' ? nodes.map(node => node.name) : zones
  const failedName = failureActive ? failedTarget : 'no domain failed'
  const learnerCompared = sawZoneSpread && sawNodeFailure && sawZoneFailure

  return <div className="topology-scene">
    <div className="topology-toolbar">
      <label>DESIRED PODS <input aria-label="Desired Pod replica count" type="range" min="4" max="12" value={replicas} onChange={event => setReplicas(Number(event.target.value))}/><b>{replicas}</b></label>
      <label>SPREAD BY <select aria-label="Topology spread topology key" value={spreadKey} onChange={event => { const key = event.target.value as SpreadKey; setSpreadKey(key); if (key === 'zone') setSawZoneSpread(true) }}><option value="node">Node · kubernetes.io/hostname</option><option value="zone">Zone · topology.kubernetes.io/zone</option></select></label>
      <label>WHEN UNSATISFIABLE <select aria-label="Topology spread scheduling policy" value={policy} onChange={event => setPolicy(event.target.value as PlacementPolicy)}><option value="strict">DoNotSchedule</option><option value="best-effort">ScheduleAnyway</option></select></label>
    </div>
    <div className="topology-secondary-controls">
      <label>FAILURE SCOPE <select aria-label="Failure scope" value={failureScope} onChange={event => { const scope = event.target.value as FailureScope; setFailureScope(scope); setFailedTarget(scope === 'node' ? 'node-02' : 'zone-a'); setFailureActive(false) }}><option value="node">One node</option><option value="zone">Entire zone</option></select></label>
      <label>FAIL <select aria-label="Node or zone to fail" value={failedTarget} onChange={event => setFailedTarget(event.target.value)}>{targetOptions.map(target => <option key={target} value={target}>{target}</option>)}</select></label>
      <label>REPLACEMENT NODE <select aria-label="Pod placement preference" value={preferredNode} onChange={event => setPreferredNode(event.target.value)}><option value="any">Any eligible node</option>{nodes.map(node => <option key={node.name} value={node.name}>{node.name} only</option>)}</select></label>
      <button className={`topology-failure-button ${failureActive ? 'failure-active' : ''}`} onClick={triggerFailure}>{failureActive ? 'Restore domain' : 'Simulate failure'}</button>
      <button className="topology-reset-button" onClick={reset}><RotateCcw size={14}/> Reset</button>
    </div>

    <div className="topology-readout"><span>TOPOLOGY KEY <b>{spreadKey === 'node' ? 'kubernetes.io/hostname' : 'topology.kubernetes.io/zone'}</b></span><span>MAX SKEW <b>{skew} POD{skew === 1 ? '' : 'S'}</b></span><span>ACTIVE NODES <b>{activeNodes} / {nodes.length}</b></span><span>FAILED DOMAIN <b>{failedName}</b></span></div>

    <div className="topology-node-grid">{nodes.map((node, nodeIndex) => {
      const isFailed = failureActive && (failureScope === 'node' ? node.name === failedTarget : node.zone === failedTarget)
      const nodePods = placements.filter(placement => placement.node === nodeIndex)
      return <motion.section layout key={node.name} className={`topology-node-card ${isFailed ? 'node-failed' : ''} ${spreadKey === 'node' ? 'node-key-active' : ''}`} aria-label={`${node.name}, ${node.zone}, ${countsByNode[nodeIndex]} Pods${isFailed ? ', failed' : ''}`}>
        <header><span><i className={`node-status-dot ${isFailed ? 'status-failed' : ''}`}/><b>{node.name}</b></span><small>{node.zone}</small></header>
        <div className="node-capacity-slots">{Array.from({ length: nodePodCapacity }, (_, slot) => {
          const placement = nodePods[slot]
          return placement ? <motion.button layout key={placement.id} className={`topology-pod-card ${placement.id > replicas ? 'pod-replacement' : ''}`} onClick={() => onSelect(`Pod ${placement.id} on ${node.name} in ${node.zone}`)} initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .75 }}><Cuboid size={15}/><b>api-{String(placement.id).padStart(2, '0')}</b><small>{placement.id > replicas ? 'REPLACEMENT' : 'READY'}</small></motion.button> : <span className="empty-node-slot" key={`empty-${slot}`}>SCHEDULABLE</span>
        })}</div>
        <footer>{countsByNode[nodeIndex]} / {nodePodCapacity} PODS</footer>
      </motion.section>
    })}{pending > 0 && <motion.section className="pending-node-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><span className="pending-pulse"/><b>{pending} PENDING</b><small>Check spread and available slots</small></motion.section>}</div>

    <div className="topology-zone-summary" aria-label="Pod counts per zone">{zones.map((zone, index) => <div key={zone}><span>{zone}</span><b>{countsByZone[index]} Pods</b></div>)}</div>
    <p className="topology-note">{!failureActive ? spreadKey === 'node' ? 'Node-level spreading distributes replicas across hostnames. Nodes 01 and 02 share zone A, so balanced node placement does not guarantee balanced zone placement.' : 'Zone-level spreading balances replicas across failure domains, while multiple nodes within a zone provide additional local capacity.' : pending > 0 ? `${pending} Pod${pending === 1 ? '' : 's'} cannot be placed after ${failedTarget} failed. Check the spread rule, replacement node choice, and free slots.` : `The example placed replacement Pods after ${failedTarget} failed. Compare node counts above with zone totals.`} This model allows three Pods per node and keeps failed domains in its skew calculation. Each setting change recomputes the example; real scheduler eligibility and capacity depend on cluster settings.</p>
    <LessonCoach task="Compare node and zone spread, then fail node-02 and inspect how replicas move. Try failing zone-a next." hint="topologyKey selects the domain counted by maxSkew. kubernetes.io/hostname counts each node separately; topology.kubernetes.io/zone counts all nodes in the same zone as one domain. A failure only removes capacity in its scope. DoNotSchedule may leave Pods pending when hard spread cannot be met; ScheduleAnyway treats spread as a preference." complete={learnerCompared} success="You compared host-level and zone-level spread and observed how failures affect their domains. Node spread alone does not ensure zone resilience."/>
  </div>
}
