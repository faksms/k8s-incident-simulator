import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Cuboid, RotateCcw, ShieldCheck } from 'lucide-react'
import LessonCoach from './LessonCoach'
import SignalTrace from './SignalTrace'
import './TopologyLesson.css'
import './TopologyLessonInteraction.css'
import './ModuleDiagramPolish.css'
import './TopologyNeon.css'

type SpreadKey = 'zone' | 'node'
type FailureScope = 'node' | 'zone'
type PlacementPolicy = 'strict' | 'best-effort'
type Placement = { id: number; node: number } | { id: number; node: null }

type WorkerNode = { name: string; zone: string }
const nodes: WorkerNode[] = [
  { name: 'node-01', zone: 'zone-a' },
  { name: 'node-02', zone: 'zone-a' },
  { name: 'node-03', zone: 'zone-b' },
  { name: 'node-04', zone: 'zone-c' },
]
const zones = [...new Set(nodes.map(node => node.zone))]

export default function TopologyLesson({ onSelect }: { onSelect: (name: string) => void }) {
  const [replicas, setReplicas] = useState(8)
  const [spreadKey, setSpreadKey] = useState<SpreadKey>('node')
  const [policy, setPolicy] = useState<PlacementPolicy>('strict')
  const [failureScope, setFailureScope] = useState<FailureScope>('node')
  const [failedTarget, setFailedTarget] = useState('node-02')
  const [failureActive, setFailureActive] = useState(false)
  const [preferredNode, setPreferredNode] = useState('any')
  const [traceToken, setTraceToken] = useState(0)

  const placements = useMemo<Placement[]>(() => {
    const eligible = nodes.map((_, index) => index).filter(index => {
      if (!failureActive) return true
      return failureScope === 'node' ? nodes[index].name !== failedTarget : nodes[index].zone !== failedTarget
    })
    const failedNodes = nodes.map((_, index) => index).filter(index => !eligible.includes(index))
    const domains = spreadKey === 'node' ? nodes.map(node => node.name) : zones
    const domainForNode = (nodeIndex: number) => spreadKey === 'node' ? nodes[nodeIndex].name : nodes[nodeIndex].zone
    const initial: Placement[] = []

    for (let id = 1; id <= replicas; id++) {
      const targetDomain = domains[(id - 1) % domains.length]
      const candidates = eligible.filter(index => domainForNode(index) === targetDomain)
      const targetNode = candidates.length ? candidates[(id - 1) % candidates.length] : null
      initial.push({ id, node: targetNode })
    }

    if (!failureActive) return initial

    const lost = initial.filter(placement => placement.node !== null && failedNodes.includes(placement.node))
    const survivors = initial.filter(placement => placement.node === null || !failedNodes.includes(placement.node))
    const pendingIds = initial.filter(placement => placement.node === null).map(placement => placement.id)
    const counts = domains.map(domain => survivors.filter(placement => placement.node !== null && domainForNode(placement.node) === domain).length)
    const replacementCount = lost.length + pendingIds.length
    let nextId = replicas
    const replacements: Placement[] = []

    for (let index = 0; index < replacementCount; index++) {
      const allowed = eligible.filter(nodeIndex => preferredNode === 'any' || nodes[nodeIndex].name === preferredNode)
      if (!allowed.length) {
        replacements.push({ id: ++nextId, node: null })
        continue
      }
      const candidateDomains = [...new Set(allowed.map(domainForNode))]
      const sortedDomains = candidateDomains.sort((a, b) => counts[domains.indexOf(a)] - counts[domains.indexOf(b)])
      const targetDomain = sortedDomains[0]
      const domainIndex = domains.indexOf(targetDomain)
      const nextCounts = counts.map((count, countIndex) => count + (countIndex === domainIndex ? 1 : 0))
      const violatesSpread = Math.max(...nextCounts) - Math.min(...nextCounts) > 1
      if (policy === 'strict' && violatesSpread) {
        replacements.push({ id: ++nextId, node: null })
        continue
      }
      const targetNode = allowed.filter(nodeIndex => domainForNode(nodeIndex) === targetDomain).sort((a, b) => survivors.filter(item => item.node === a).length - survivors.filter(item => item.node === b).length)[0]
      counts[domainIndex]++
      replacements.push({ id: ++nextId, node: targetNode })
    }

    return [...survivors, ...replacements]
  }, [replicas, spreadKey, policy, failureScope, failedTarget, failureActive, preferredNode])

  const countsByNode = nodes.map((_, nodeIndex) => placements.filter(placement => placement.node === nodeIndex).length)
  const countsByZone = zones.map(zone => placements.filter(placement => placement.node !== null && nodes[placement.node].zone === zone).length)
  const pending = placements.filter(placement => placement.node === null).length
  const activeNodes = nodes.filter((_, index) => !(failureActive && (failureScope === 'node' ? nodes[index].name === failedTarget : nodes[index].zone === failedTarget))).length
  const domainCounts = spreadKey === 'node' ? countsByNode : countsByZone
  const skew = domainCounts.length ? Math.max(...domainCounts) - Math.min(...domainCounts) : 0

  function triggerFailure() {
    setFailureActive(value => !value)
    setTraceToken(value => value + 1)
  }

  function reset() {
    setReplicas(8)
    setSpreadKey('node')
    setPolicy('strict')
    setFailureScope('node')
    setFailedTarget('node-02')
    setFailureActive(false)
    setPreferredNode('any')
    setTraceToken(value => value + 1)
  }

  const targetOptions = failureScope === 'node' ? nodes.map(node => node.name) : zones
  const failedName = failureActive ? failedTarget : 'no domain failed'
  const learnerCompared = failureActive && spreadKey === 'node' && (policy === 'best-effort' || preferredNode !== 'any')

  return <div className="topology-scene">
    <div className="topology-toolbar">
      <label>DESIRED PODS <input aria-label="Desired Pod replica count" type="range" min="4" max="12" value={replicas} onChange={event => { setReplicas(Number(event.target.value)); setTraceToken(value => value + 1) }}/><b>{replicas}</b></label>
      <label>SPREAD BY <select aria-label="Topology spread topology key" value={spreadKey} onChange={event => { setSpreadKey(event.target.value as SpreadKey); setTraceToken(value => value + 1) }}><option value="node">Node · kubernetes.io/hostname</option><option value="zone">Zone · topology.kubernetes.io/zone</option></select></label>
      <label>WHEN UNSATISFIABLE <select aria-label="Topology spread scheduling policy" value={policy} onChange={event => { setPolicy(event.target.value as PlacementPolicy); setTraceToken(value => value + 1) }}><option value="strict">DoNotSchedule</option><option value="best-effort">ScheduleAnyway</option></select></label>
    </div>
    <div className="topology-secondary-controls">
      <label>FAILURE SCOPE <select aria-label="Failure scope" value={failureScope} onChange={event => { const scope = event.target.value as FailureScope; setFailureScope(scope); setFailedTarget(scope === 'node' ? 'node-02' : 'zone-a'); setFailureActive(false); setTraceToken(value => value + 1) }}><option value="node">One node</option><option value="zone">Entire zone</option></select></label>
      <label>FAIL <select aria-label="Node or zone to fail" value={failedTarget} onChange={event => { setFailedTarget(event.target.value); setTraceToken(value => value + 1) }}>{targetOptions.map(target => <option key={target} value={target}>{target}</option>)}</select></label>
      <label>PLACEMENT PREFERENCE <select aria-label="Pod placement preference" value={preferredNode} onChange={event => { setPreferredNode(event.target.value); setTraceToken(value => value + 1) }}><option value="any">Any eligible node</option>{nodes.filter(node => !(failureActive && (failureScope === 'node' ? node.name === failedTarget : node.zone === failedTarget))).map(node => <option key={node.name} value={node.name}>{node.name} only</option>)}</select></label>
      <button className={`topology-failure-button ${failureActive ? 'failure-active' : ''}`} onClick={triggerFailure}>{failureActive ? 'Restore domain' : 'Simulate failure'}</button>
      <button className="topology-reset-button" onClick={reset}><RotateCcw size={14}/> Reset</button>
    </div>

    <div className="topology-readout"><span>TOPOLOGY KEY <b>{spreadKey === 'node' ? 'kubernetes.io/hostname' : 'topology.kubernetes.io/zone'}</b></span><span>MAX SKEW <b>{skew} POD{skew === 1 ? '' : 'S'}</b></span><span>ACTIVE NODES <b>{activeNodes} / {nodes.length}</b></span><span>FAILED DOMAIN <b>{failedName}</b></span></div>

    <div className="topology-node-grid">{nodes.map((node, nodeIndex) => {
      const isFailed = failureActive && (failureScope === 'node' ? node.name === failedTarget : node.zone === failedTarget)
      const nodePods = placements.filter(placement => placement.node === nodeIndex)
      return <motion.section layout key={node.name} className={`topology-node-card ${isFailed ? 'node-failed' : ''} ${spreadKey === 'node' ? 'node-key-active' : ''}`} aria-label={`${node.name}, ${node.zone}, ${countsByNode[nodeIndex]} Pods${isFailed ? ', failed' : ''}`}>
        <header><span><i className={`node-status-dot ${isFailed ? 'status-failed' : ''}`}/><b>{node.name}</b></span><small>{node.zone}</small></header>
        <div className="node-capacity-slots">{Array.from({ length: 3 }, (_, slot) => {
          const placement = nodePods[slot]
          return placement ? <motion.button layout key={placement.id} className={`topology-pod-card ${placement.id > replicas ? 'pod-replacement' : ''}`} onClick={() => onSelect(`Pod ${placement.id} on ${node.name} in ${node.zone}`)} initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .75 }}><Cuboid size={15}/><b>api-{String(placement.id).padStart(2, '0')}</b><small>{placement.id > replicas ? 'REPLACEMENT' : 'READY'}</small></motion.button> : <span className="empty-node-slot" key={`empty-${slot}`}>SCHEDULABLE</span>
        })}</div>
        <footer>{countsByNode[nodeIndex]} / 3 PODS</footer>
      </motion.section>
    })}{pending > 0 && <motion.section className="pending-node-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><span className="pending-pulse"/><b>{pending} PENDING</b><small>{policy === 'strict' ? 'maxSkew blocks placement' : 'no eligible capacity'}</small></motion.section>}</div>

    <div className="topology-zone-summary" aria-label="Pod counts per zone">{zones.map((zone, index) => <div key={zone}><span>{zone}</span><b>{countsByZone[index]} Pods</b></div>)}</div>
    <SignalTrace title={`SCHEDULER · SPREAD BY ${spreadKey.toUpperCase()}`} steps={['Pod is unscheduled', 'filter active nodes', `compare ${spreadKey} skew`, pending ? 'Pod remains Pending' : 'bind Pod to node']} playToken={traceToken}/>
    <p className="topology-note">{!failureActive ? spreadKey === 'node' ? 'Node-level spreading distributes replicas across hostnames. Nodes 01 and 02 share zone A, so balanced node placement does not guarantee balanced zone placement.' : 'Zone-level spreading balances replicas across failure domains, while multiple nodes within a zone provide additional local capacity.' : pending > 0 ? `${pending} Pod${pending === 1 ? '' : 's'} cannot be placed after ${failedTarget} failed${policy === 'strict' ? ' because DoNotSchedule enforces maxSkew' : ' because no eligible node satisfies the placement preference'}.` : `The scheduler placed replacement Pods after ${failedTarget} failed. Compare node counts above with zone totals to see the selected topology key’s effect.`}</p>
    <LessonCoach task="Compare node and zone spread, then fail node-02 and inspect how replicas move. Try failing zone-a next." hint="topologyKey selects the domain counted by maxSkew. kubernetes.io/hostname counts each node separately; topology.kubernetes.io/zone counts all nodes in the same zone as one domain. A failure only removes capacity in its scope. DoNotSchedule may leave Pods pending when hard spread cannot be met; ScheduleAnyway treats spread as a preference." complete={learnerCompared} success="You compared host-level and zone-level spread and observed how failures affect their domains. Node spread alone does not ensure zone resilience."/>
  </div>
}
