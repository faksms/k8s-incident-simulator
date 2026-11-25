import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Cpu, HardDrive, Play, RotateCcw, Server, ShieldCheck } from 'lucide-react'
import LessonCoach from './LessonCoach'
import './ResourceRequestsLesson.css'

type PodState = 'Pending' | 'Running' | 'Throttled' | 'OOMKilled'

export default function ResourceRequestsLesson({ onSelect }: { onSelect: (name: string) => void }) {
  const [cpuRequest, setCpuRequest] = useState(500)
  const [memoryRequest, setMemoryRequest] = useState(512)
  const [cpuLimit, setCpuLimit] = useState(1000)
  const [memoryLimit, setMemoryLimit] = useState(1024)
  const [cpuDemand, setCpuDemand] = useState(1200)
  const [memoryDemand, setMemoryDemand] = useState(768)
  const [simulated, setSimulated] = useState(false)
  const [playedScenario, setPlayedScenario] = useState(false)

  const node = { cpu: 2000, memory: 2048, usedCpu: 1200, usedMemory: 1024 }
  const fitsNode = cpuRequest <= node.cpu - node.usedCpu && memoryRequest <= node.memory - node.usedMemory
  const invalidLimits = cpuLimit < cpuRequest || memoryLimit < memoryRequest
  const podState: PodState = useMemo(() => {
    if (!fitsNode) return 'Pending'
    if (simulated && memoryDemand > memoryLimit) return 'OOMKilled'
    if (simulated && cpuDemand > cpuLimit) return 'Throttled'
    return 'Running'
  }, [fitsNode, simulated, memoryDemand, memoryLimit, cpuDemand, cpuLimit])
  const stateText: Record<PodState, string> = {
    Pending: 'Scheduler cannot place this Pod: its requests exceed the node’s remaining allocatable resources.',
    Running: 'The Pod fits. Runtime use is currently within the configured limits.',
    Throttled: 'CPU demand is above the CPU limit. The container stays running but receives less CPU time.',
    OOMKilled: 'Memory use exceeded the memory limit. The container was terminated and may restart under its Pod restart policy.',
  }
  const displayState = !fitsNode ? 'Pending' : simulated ? podState : 'Configured'
  const displayText = !fitsNode ? stateText.Pending : simulated ? stateText[podState] : 'Requests fit the available node capacity. Run the workload to test runtime limits against CPU and memory demand.'

  function runScenario() {
    setSimulated(true)
    setPlayedScenario(true)
  }

  function reset() {
    setCpuRequest(500)
    setMemoryRequest(512)
    setCpuLimit(1000)
    setMemoryLimit(1024)
    setCpuDemand(1200)
    setMemoryDemand(768)
    setSimulated(false)
    setPlayedScenario(false)
  }

  return <div className="resource-lab">
    <header className="resource-lab-toolbar"><span><Server size={16}/> NODE: <b>worker-01</b></span><span>ALLOCATABLE CAPACITY · SIMULATED</span><button onClick={reset} aria-label="Reset resource lab"><RotateCcw size={15}/> Reset</button></header>
    <div className="resource-lab-grid">
      <section className="resource-node" aria-label="Node resource capacity and scheduled Pods">
        <header><div><Server size={18}/><span><b>worker-01</b><small>2 CPU · 2 GiB allocatable</small></span></div><span className="node-health"><i/> READY</span></header>
        <div className="node-capacity">
          <CapacityBar label="CPU REQUESTED" used={node.usedCpu + (fitsNode ? cpuRequest : 0)} total={node.cpu} unit="m"/>
          <CapacityBar label="MEMORY REQUESTED" used={node.usedMemory + (fitsNode ? memoryRequest : 0)} total={node.memory} unit="Mi"/>
        </div>
        <div className="node-pods"><span>WORKLOAD PLACEMENT</span><div className="resource-pod existing-pod"><Server size={16}/><b>system-workload</b><small>1200m · 1024Mi requests</small></div>
          <motion.button layout className={`resource-pod app-pod state-${podState.toLowerCase()}`} onClick={() => onSelect('Application Pod')}><Activity size={17}/><b>api-pod</b><small>{cpuRequest}m · {memoryRequest}Mi requests</small><strong>{simulated ? podState : fitsNode ? 'READY TO RUN' : 'PENDING'}</strong></motion.button>
        </div>
        {!fitsNode && <div className="resource-alert" role="status"><ShieldCheck size={16}/><span>Unschedulable: reduce requests or free allocatable capacity. Limits do not make a Pod fit on a node.</span></div>}
      </section>
      <section className="resource-controls" aria-label="Configure Pod resources and workload pressure">
        <div className="resource-control-heading"><Cpu size={18}/><div><b>Pod resources</b><small>Requests influence placement; limits constrain runtime use.</small></div></div>
        <ResourceSlider label="CPU REQUEST" value={cpuRequest} min={250} max={1500} step={250} unit="m" onChange={value => { setCpuRequest(value); setSimulated(false) }}/>
        <ResourceSlider label="CPU LIMIT" value={cpuLimit} min={250} max={2000} step={250} unit="m" onChange={value => { setCpuLimit(value); setSimulated(false) }}/>
        <ResourceSlider label="MEMORY REQUEST" value={memoryRequest} min={256} max={2048} step={256} unit="Mi" onChange={value => { setMemoryRequest(value); setSimulated(false) }}/>
        <ResourceSlider label="MEMORY LIMIT" value={memoryLimit} min={256} max={2048} step={256} unit="Mi" onChange={value => { setMemoryLimit(value); setSimulated(false) }}/>
        {invalidLimits && <p className="resource-warning">A container limit should not be lower than its request for this lab. Raise the limit or lower the request before running.</p>}
        <div className="workload-demand"><div><Activity size={15}/><b>SIMULATED APP DEMAND</b></div>
          <ResourceSlider label="CPU DEMAND" value={cpuDemand} min={250} max={2000} step={250} unit="m" onChange={value => { setCpuDemand(value); setSimulated(false) }}/>
          <ResourceSlider label="MEMORY USE" value={memoryDemand} min={256} max={2048} step={256} unit="Mi" onChange={value => { setMemoryDemand(value); setSimulated(false) }}/>
        </div>
        <button className="run-resource-scenario" onClick={runScenario} disabled={!fitsNode || invalidLimits}><Play size={15}/> Run workload</button>
      </section>
    </div>
    <div className={`resource-outcome outcome-${displayState.toLowerCase()}`} aria-live="polite"><span className="outcome-indicator"/><div><b>{simulated || !fitsNode ? `Pod state · ${displayState}` : 'Configuration ready'}</b><p>{displayText}</p></div><small>{simulated ? 'SIMULATION RUNNING' : 'ADJUST VALUES, THEN RUN'}</small></div>
    <p className="resource-note"><b>Scheduling:</b> the scheduler uses requests, not limits, when checking whether this Pod fits. <b>Runtime:</b> CPU can be throttled; exceeding a memory limit can cause an OOM kill. This model is simplified and does not emulate kernel or node-pressure behavior.</p>
    <LessonCoach task="Run the default workload and observe CPU throttling. Then raise the CPU limit above demand; next lower the memory limit below use to compare an OOM kill." hint="The default Pod requests fit in the node’s remaining 800m CPU and 1024Mi memory. Its 1200m CPU demand exceeds a 1000m limit, so it is throttled. CPU limits are enforced through throttling; memory limit violations can terminate the container." complete={playedScenario && podState === 'OOMKilled'} success="You compared scheduling requests with runtime limits, then observed CPU throttling and a memory OOM outcome."/>
  </div>
}

function ResourceSlider({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (value: number) => void }) {
  return <label className="resource-slider"><span>{label}</span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))}/><b>{value}{unit}</b></label>
}

function CapacityBar({ label, used, total, unit }: { label: string; used: number; total: number; unit: string }) {
  const percent = Math.min(100, used / total * 100)
  return <div className="capacity-bar"><div><b>{label}</b><span>{used}{unit} / {total}{unit}</span></div><span className="capacity-track"><i style={{ width: `${percent}%` }}/></span></div>
}
