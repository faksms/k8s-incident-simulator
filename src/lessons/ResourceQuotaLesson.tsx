import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Boxes, CircleAlert, Gauge, Plus, RotateCcw, ShieldCheck } from 'lucide-react'
import LessonCoach from './LessonCoach'
import './ResourceQuotaLesson.css'
import './ResourceQuotaLessonPolish.css'
import './ModuleDiagramPolish.css'

type AdmissionResult = { accepted: boolean; message: string; attempted: number; admitted: number; rejected: number }
type AdmittedPod = { id: number; cpu: number; memory: number }

const initialQuota = { cpu: 2000, memory: 2048 }
const existingUsage = { cpu: 1000, memory: 1024 }

export default function ResourceQuotaLesson({ onSelect }: { onSelect: (name: string) => void }) {
  const [quota, setQuota] = useState(initialQuota)
  const [podRequests, setPodRequests] = useState({ cpu: 500, memory: 512 })
  const [desired, setDesired] = useState(3)
  const [admittedPods, setAdmittedPods] = useState<AdmittedPod[]>([])
  const [result, setResult] = useState<AdmissionResult | null>(null)

  const used = useMemo(() => ({
    cpu: existingUsage.cpu + admittedPods.reduce((total, pod) => total + pod.cpu, 0),
    memory: existingUsage.memory + admittedPods.reduce((total, pod) => total + pod.memory, 0),
  }), [admittedPods])

  const pendingReplicas = Math.max(0, desired - admittedPods.length)
  const requested = { cpu: pendingReplicas * podRequests.cpu, memory: pendingReplicas * podRequests.memory }
  const fits = used.cpu + requested.cpu <= quota.cpu && used.memory + requested.memory <= quota.memory

  function applyWorkload() {
    const retained = admittedPods.slice(0, desired)
    let cpuUsed = existingUsage.cpu + retained.reduce((total, pod) => total + pod.cpu, 0)
    let memoryUsed = existingUsage.memory + retained.reduce((total, pod) => total + pod.memory, 0)
    let nextId = admittedPods.length
    let rejected = 0
    const created: AdmittedPod[] = []

    for (let index = retained.length; index < desired; index++) {
      if (cpuUsed + podRequests.cpu > quota.cpu || memoryUsed + podRequests.memory > quota.memory) {
        rejected++
        continue
      }
      nextId++
      created.push({ id: nextId, cpu: podRequests.cpu, memory: podRequests.memory })
      cpuUsed += podRequests.cpu
      memoryUsed += podRequests.memory
    }

    setAdmittedPods([...retained, ...created])
    setResult({ accepted: rejected === 0, attempted: desired, admitted: created.length, rejected, message: rejected === 0 ? `${created.length} Pod${created.length === 1 ? '' : 's'} admitted. All desired replicas now fit within quota.` : `${created.length} Pod${created.length === 1 ? '' : 's'} admitted; ${rejected} Pod${rejected === 1 ? '' : 's'} rejected by quota. The controller will retry while the Deployment remains below its desired replica count.` })
  }

  function reset() {
    setQuota(initialQuota)
    setPodRequests({ cpu: 500, memory: 512 })
    setDesired(3)
    setAdmittedPods([])
    setResult(null)
  }

  const cpuPercent = Math.min(100, used.cpu / quota.cpu * 100)
  const memoryPercent = Math.min(100, used.memory / quota.memory * 100)
  const objectiveComplete = Boolean(result?.accepted && result.attempted === desired && admittedPods.length === desired)

  return <div className="quota-scene">
    <div className="quota-toolbar"><span><Gauge size={16}/> NAMESPACE: <b>team-api</b></span><span>RESOURCEQUOTA · HARD LIMITS</span></div>
    <div className="quota-canvas">
      <section className="quota-boundary" aria-label="Team API namespace and resource quota">
        <header><div><ShieldCheck size={17}/><span><b>team-api</b><small>Namespace budget</small></span></div><button onClick={reset} aria-label="Reset quota simulation"><RotateCcw size={15}/> Reset</button></header>
        <div className="quota-limit-controls"><span>HARD REQUEST QUOTA</span><label>CPU <input aria-label="Hard CPU request quota" type="range" min="1000" max="4000" step="500" value={quota.cpu} onChange={event => { setQuota(value => ({ ...value, cpu: Number(event.target.value) })); setResult(null) }}/><b>{quota.cpu}m</b></label><label>MEMORY <input aria-label="Hard memory request quota" type="range" min="1024" max="4096" step="512" value={quota.memory} onChange={event => { setQuota(value => ({ ...value, memory: Number(event.target.value) })); setResult(null) }}/><b>{(quota.memory / 1024).toFixed(quota.memory % 1024 === 0 ? 0 : 1)}Gi</b></label></div>
        <div className="quota-gauges">
          <QuotaGauge label="CPU REQUESTS" used={used.cpu} requested={requested.cpu} hard={quota.cpu} unit="m" percent={cpuPercent} onSelect={onSelect}/>
          <QuotaGauge label="MEMORY REQUESTS" used={used.memory} requested={requested.memory} hard={quota.memory} unit="Mi" percent={memoryPercent} onSelect={onSelect}/>
        </div>
        <div className="quota-resources"><span>RUNNING IN NAMESPACE</span><div className="quota-pods">{[0, 1].map(index => <motion.button layout key={`existing-${index}`} className="quota-pod" onClick={() => onSelect(`Existing namespace Pod ${index + 1}`)}><Boxes size={16}/><b>api-{index + 1}</b><small>500m · 512Mi</small></motion.button>)}{admittedPods.map(pod => <motion.button layout key={`job-${pod.id}`} className="quota-pod quota-pod-new" onClick={() => onSelect(`Admitted workload Pod ${pod.id}`)}><Boxes size={16}/><b>job-{pod.id}</b><small>{pod.cpu}m · {pod.memory}Mi</small></motion.button>)}</div></div>
      </section>
      <div className="quota-flow" aria-label="Admission control checks quota before creating Pods"><span className="quota-flow-line"/><motion.div className={`quota-admission ${result ? result.accepted ? 'admission-allowed' : 'admission-blocked' : ''}`} key={result?.accepted ? `allowed-${admittedPods.length}` : result ? 'blocked' : 'idle'} initial={{scale:.88,opacity:.6}} animate={{scale:1,opacity:1}}><ShieldCheck size={21}/><b>ADMISSION</b><small>check quota</small></motion.div><span className="quota-flow-caption">REQUEST</span></div>
      <section className="quota-workload" aria-label="Configure a workload request">
        <div className="quota-workload-title"><Plus size={17}/><span><b>New Deployment</b><small>Configure a workload request</small></span></div>
        <label>REPLICAS <input aria-label="Requested replica count" type="range" min="1" max="5" value={desired} onChange={event => { const nextDesired = Number(event.target.value); setDesired(nextDesired); setAdmittedPods(current => current.slice(0, nextDesired)); setResult(null) }}/><b>{desired}</b></label>
        <label>CPU REQUEST PER POD <select aria-label="CPU request per Pod" value={podRequests.cpu} onChange={event => { setPodRequests(value => ({ ...value, cpu: Number(event.target.value) })); setResult(null) }}><option value="250">250m</option><option value="500">500m</option><option value="1000">1000m</option></select></label>
        <label>MEMORY REQUEST PER POD <select aria-label="Memory request per Pod" value={podRequests.memory} onChange={event => { setPodRequests(value => ({ ...value, memory: Number(event.target.value) })); setResult(null) }}><option value="256">256Mi</option><option value="512">512Mi</option><option value="1024">1Gi</option></select></label>
        <div className="quota-pending-request"><span>THIS REQUEST ADDS</span><b>{requested.cpu}m CPU · {requested.memory}Mi memory</b><small>{fits ? 'Fits remaining quota' : 'Exceeds remaining quota'}</small></div>
        <button className="quota-apply" onClick={applyWorkload} disabled={pendingReplicas===0}><Plus size={16}/> {pendingReplicas===0?'All desired Pods admitted':'Create missing Pods'}</button>
      </section>
    </div>
    {result && <div className={`quota-result ${result.accepted ? 'quota-result-accepted' : 'quota-result-denied'}`} role="status"><span>{result.accepted ? <ShieldCheck size={17}/> : <CircleAlert size={17}/>}</span><div><b>{result.accepted ? 'Desired replicas admitted' : 'Some Pod admissions rejected'}</b><p>{result.message}</p><small>{result.admitted} admitted · {result.rejected} rejected · desired {result.attempted}</small></div></div>}
    <p className="quota-note">ResourceQuota checks namespaced objects at admission. Here, each Pod is checked separately: some replicas may be created while later Pods are rejected until quota becomes available.</p>
    <LessonCoach task="Submit the default three-replica workload. Observe partial admission, raise the namespace quota, then create the missing Pod." hint="The namespace already uses 1000m CPU and 1024Mi memory. Each 500m / 512Mi Pod is checked against both hard totals. Two fit; the third exceeds both. A Deployment can exist while its ReplicaSet reports failed Pod creation and retries." complete={objectiveComplete} success="You observed per-Pod quota admission, partial replica creation, and controller recovery after increasing namespace capacity."/>
  </div>
}

function QuotaGauge({ label, used, requested, hard, unit, percent, onSelect }: { label: string; used: number; requested: number; hard: number; unit: string; percent: number; onSelect: (name: string) => void }) {
  const projected = Math.min(100 - percent, requested / hard * 100)
  const exceedsQuota = used + requested > hard
  const format = (value: number) => unit === 'Mi' ? `${(value / 1024).toFixed(value % 1024 === 0 ? 0 : 1)}Gi` : `${value}m`
  return <button className="quota-gauge" onClick={() => onSelect(`${label.toLowerCase()} quota`)} aria-label={`${label}: ${format(used)} used of ${format(hard)} hard quota`}>
    <span className="quota-gauge-heading"><b>{label}</b><small>{format(used)} used / {format(hard)} hard</small></span>
    <span className="quota-track"><i style={{ width: `${percent}%` }}/><i className={`quota-projected ${exceedsQuota ? 'quota-over' : ''}`} style={{ left: `${percent}%`, width: `${projected}%` }}/></span>
    <span className="quota-gauge-foot"><small>{format(requested)} requested</small><small>{Math.max(0, hard - used)} remaining</small></span>
  </button>
}
