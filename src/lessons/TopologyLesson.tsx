import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Cuboid, RotateCcw, ShieldCheck } from 'lucide-react'
import LessonCoach from './LessonCoach'
import SignalTrace from './SignalTrace'
import './TopologyLesson.css'
import './TopologyLessonInteraction.css'
import './ModuleDiagramPolish.css'

const zones = ['eu-west-1a', 'eu-west-1b', 'eu-west-1c']

export default function TopologyLesson({ onSelect }: { onSelect: (name: string) => void }) {
  const [replicas, setReplicas] = useState(6)
  const [failed, setFailed] = useState(false)
  const [policy, setPolicy] = useState<'strict' | 'best-effort'>('strict')
  const [zonePreference, setZonePreference] = useState<'balanced' | 'zone-a'>('balanced')
  const [policyCompared, setPolicyCompared] = useState(false)
  const [traceToken, setTraceToken] = useState(0)

  const placements = useMemo<Array<number | null>>(() => {
    const initial = Array.from({ length: replicas }, (_, index) => index % zones.length)
    if (!failed) return initial

    const survivors = initial.filter(zone => zone !== 1)
    const replacements = replicas - survivors.length
    const counts = zones.map((_, zone) => survivors.filter(placement => placement === zone).length)
    const scheduled: Array<number | null> = []

    for (let index = 0; index < replacements; index++) {
      const target = zonePreference === 'zone-a' ? 0 : counts[0] <= counts[2] ? 0 : 2
      const nextCounts = [counts[0] + (target === 0 ? 1 : 0), counts[2] + (target === 2 ? 1 : 0)]
      const violatesSpread = Math.max(...nextCounts) - Math.min(...nextCounts) > 1

      if (policy === 'strict' && violatesSpread) {
        scheduled.push(null)
        continue
      }

      scheduled.push(target)
      counts[target]++
    }

    return [...survivors, ...scheduled]
  }, [replicas, failed, policy, zonePreference])

  const counts = zones.map((_, zone) => placements.filter(placement => placement === zone).length)
  const pending = placements.filter(placement => placement === null).length

  function toggleFailure() {
    setFailed(value => !value)
    setPolicyCompared(false)
    setTraceToken(value => value + 1)
  }

  function reset() {
    setFailed(false)
    setReplicas(6)
    setPolicy('strict')
    setZonePreference('balanced')
    setPolicyCompared(false)
  }

  return <div className="topology-scene">
    <div className="topology-toolbar">
      <label>DESIRED REPLICAS <input aria-label="Desired replica count" type="range" min="3" max="9" value={replicas} onChange={event => setReplicas(Number(event.target.value))}/><b>{replicas}</b></label>
      <label>whenUnsatisfiable <select aria-label="Topology spread scheduling policy" value={policy} onChange={event => { setPolicy(event.target.value as 'strict' | 'best-effort'); if (failed && zonePreference === 'zone-a') setPolicyCompared(true); setTraceToken(value => value + 1) }}><option value="strict">DoNotSchedule</option><option value="best-effort">ScheduleAnyway</option></select></label>
      <label>PLACEMENT RULE <select aria-label="Additional placement rule" value={zonePreference} onChange={event => { setZonePreference(event.target.value as 'balanced' | 'zone-a'); setTraceToken(value => value + 1) }}><option value="balanced">Any healthy zone</option><option value="zone-a">Zone A only</option></select></label>
    </div>
    <div className="zone-canvas">{zones.map((zone, zoneIndex) => <section className={`topology-zone ${failed && zoneIndex === 1 ? 'zone-failed' : ''}`} key={zone}>
      <header><span>ZONE {String.fromCharCode(65 + zoneIndex)}</span><i/>{failed && zoneIndex === 1 ? 'UNAVAILABLE' : 'HEALTHY'}</header>
      <small>{zone}</small>
      <div className="zone-replicas">{placements.map((placed, index) => placed === zoneIndex && <motion.button layout key={index} className="topology-pod" onClick={() => onSelect(`Replica ${index + 1} in ${zone}`)}><Cuboid size={15}/> api-{String(index + 1).padStart(2, '0')}</motion.button>)}</div>
      <footer>{counts[zoneIndex]} REPLICA{counts[zoneIndex] === 1 ? '' : 'S'}</footer>
    </section>)}</div>
    <SignalTrace title="SCHEDULER DECISION PATH" steps={['Pod is unscheduled', 'filter eligible nodes', 'evaluate spread constraint', pending ? 'replacement stays Pending' : 'bind Pod to zone']} playToken={traceToken}/>
    {pending > 0 && <div className="topology-pending" role="status"><b>{pending} replacement Pod{pending === 1 ? '' : 's'} pending</b><span>The zone-A placement rule would exceed maxSkew under DoNotSchedule.</span></div>}
    <div className="topology-controls">
      <button className={failed ? 'restore-zone' : ''} onClick={toggleFailure}>{failed ? 'Restore zone B' : 'Simulate zone B failure'}</button>
      <button onClick={reset}><RotateCcw size={13}/> Reset</button>
      <span><ShieldCheck size={14}/> maxSkew: 1 · topologyKey: zone · {policy === 'strict' ? 'strict' : 'best effort'}</span>
    </div>
    <p className="topology-note">{!failed ? 'Replicas are spread across three zones. A zone outage removes its Pods; healthy zones may host replacements.' : zonePreference === 'balanced' ? 'With healthy capacity in zones A and C, replacements can rebalance across the surviving domains.' : policy === 'strict' ? `${pending} replacement Pod${pending === 1 ? '' : 's'} stay pending when the zone-A placement rule conflicts with maxSkew.` : 'ScheduleAnyway treats spread as a preference; the additional zone-A placement rule can produce an uneven distribution.'}</p>
    <LessonCoach task="Fail zone B, set the placement rule to Zone A only, then compare DoNotSchedule with ScheduleAnyway." hint="The simulation adds a competing placement rule that allows replacements only in zone A. DoNotSchedule enforces maxSkew and can leave one replica pending; ScheduleAnyway makes spread a preference and tolerates the imbalance. With no competing rule, replacements can rebalance across healthy zones." complete={failed && zonePreference === 'zone-a' && policyCompared} success="You compared a hard spread constraint with a soft preference under a competing placement rule. Constraints shape placement, but neither spread nor replicas create capacity."/>
  </div>
}
