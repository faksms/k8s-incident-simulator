import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Activity, Cpu, HardDrive, RotateCcw, Server, ShieldCheck } from 'lucide-react'
import LessonCoach from './LessonCoach'
import SignalTrace from './SignalTrace'
import './ResourceRequestsLesson.css'
import './ResourceRequestsLive.css'
import './ModuleDiagramPolish.css'

type PodState = 'Pending' | 'Running' | 'Throttled' | 'OOMKilled' | 'Invalid'

export default function ResourceRequestsLesson({ onSelect }: { onSelect: (name: string) => void }) {
  const [cpuRequest, setCpuRequest] = useState(500)
  const [memoryRequest, setMemoryRequest] = useState(512)
  const [cpuLimit, setCpuLimit] = useState(1000)
  const [memoryLimit, setMemoryLimit] = useState(1024)
  const [cpuDemand, setCpuDemand] = useState(1200)
  const [memoryDemand, setMemoryDemand] = useState(768)
  const [observedThrottle, setObservedThrottle] = useState(false)
  const [observedOom, setObservedOom] = useState(false)

  const node = { cpu: 2000, memory: 2048, usedCpu: 1200, usedMemory: 1024 }
  const fitsNode = cpuRequest <= node.cpu - node.usedCpu && memoryRequest <= node.memory - node.usedMemory
  const invalidLimits = cpuLimit < cpuRequest || memoryLimit < memoryRequest
  const podState: PodState = useMemo(() => {
    if (invalidLimits) return 'Invalid'
    if (!fitsNode) return 'Pending'
    if (memoryDemand > memoryLimit) return 'OOMKilled'
    if (cpuDemand > cpuLimit) return 'Throttled'
    return 'Running'
  }, [fitsNode, invalidLimits, memoryDemand, memoryLimit, cpuDemand, cpuLimit])
  const stateText: Record<PodState, string> = {
    Pending: 'Scheduler cannot place this Pod: its requests exceed the node’s remaining allocatable resources.',
    Running: 'The Pod fits. Runtime use is currently within the configured limits.',
    Throttled: 'CPU demand is above the CPU limit. The container stays running but receives less CPU time.',
    OOMKilled: 'Memory use exceeded the memory limit. The container was terminated and may restart under its Pod restart policy.',
    Invalid: 'This configuration is invalid: a resource request cannot exceed its corresponding container limit.',
  }
  const displayState = podState
  const displayText = stateText[podState]

  function updateCpuDemand(value: number) {
    setCpuDemand(value)
    if (value > cpuLimit && fitsNode && !invalidLimits) setObservedThrottle(true)
  }

  function updateMemoryDemand(value: number) {
    setMemoryDemand(value)
    if (value > memoryLimit && fitsNode && !invalidLimits) setObservedOom(true)
  }

  function updateCpuLimit(value: number) {
    setCpuLimit(value)
    if (cpuDemand > value && fitsNode && value >= cpuRequest) setObservedThrottle(true)
  }

  function updateMemoryLimit(value: number) {
    setMemoryLimit(value)
    if (memoryDemand > value && fitsNode && value >= memoryRequest) setObservedOom(true)
  }

  function applyPreset(preset: 'normal' | 'cpu' | 'memory') {
    if (preset === 'normal') {
      setCpuDemand(500)
      setMemoryDemand(512)
      return
    }
    if (preset === 'cpu') {
      setCpuDemand(1500)
      setMemoryDemand(768)
      if (cpuLimit >= cpuRequest) setObservedThrottle(true)
      return
    }
    setCpuDemand(500)
    setMemoryDemand(1536)
    if (fitsNode && !invalidLimits && memoryLimit >= memoryRequest) setObservedOom(true)
  }

  function reset() {
    setCpuRequest(500)
    setMemoryRequest(512)
    setCpuLimit(1000)
    setMemoryLimit(1024)
    setCpuDemand(1200)
    setMemoryDemand(768)
    setObservedThrottle(false)
    setObservedOom(false)
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
        <section className={`live-pod-monitor monitor-${podState.toLowerCase()}`} aria-label="Live Pod resource monitor">
          <header><span><i className="monitor-live-dot"/> LIVE POD MONITOR</span><b>{podState}</b></header>
          <div className="live-resource-meters">
            <ResourceMeter title="CPU" icon={<Cpu size={17}/>} demand={cpuDemand} request={cpuRequest} limit={cpuLimit} ceiling={2000} unit="m" state={podState}/>
            <ResourceMeter title="MEMORY" icon={<HardDrive size={17}/>} demand={memoryDemand} request={memoryRequest} limit={memoryLimit} ceiling={2048} unit="Mi" state={podState}/>
          </div>
          <div className="monitor-metrics"><div><span>QOS CLASS</span><b>{cpuRequest===cpuLimit&&memoryRequest===memoryLimit?'Guaranteed':'Burstable'}</b></div><div><span>CPU PRESSURE</span><b>{fitsNode&&!invalidLimits&&cpuDemand>cpuLimit?`${Math.round((cpuDemand-cpuLimit)/cpuDemand*100)}% throttled`:'Within limit'}</b></div><div><span>POD STATE</span><b>{podState}</b></div></div>
        </section>
        <div className="node-pods"><span>WORKLOAD PLACEMENT</span><div className="resource-pod existing-pod"><Server size={16}/><b>system-workload</b><small>1200m · 1024Mi requests</small></div>
          <motion.button layout className={`resource-pod app-pod state-${podState.toLowerCase()}`} onClick={() => onSelect('Application Pod')}><Activity size={17}/><b>api-pod</b><small>{cpuRequest}m · {memoryRequest}Mi requests</small><strong>{podState}</strong></motion.button>
        </div>
        {!fitsNode && <div className="resource-alert" role="status"><ShieldCheck size={16}/><span>Unschedulable: reduce requests or free allocatable capacity. Limits do not make a Pod fit on a node.</span></div>}
      </section>
      <section className="resource-controls" aria-label="Configure Pod resources and workload pressure">
        <div className="resource-control-heading"><Cpu size={18}/><div><b>Pod resources</b><small>Requests influence placement; limits constrain runtime use.</small></div></div>
        <ResourceSlider label="CPU REQUEST" value={cpuRequest} min={250} max={1500} step={250} unit="m" onChange={setCpuRequest}/>
        <ResourceSlider label="CPU LIMIT" value={cpuLimit} min={250} max={2000} step={250} unit="m" onChange={updateCpuLimit}/>
        <ResourceSlider label="MEMORY REQUEST" value={memoryRequest} min={256} max={2048} step={256} unit="Mi" onChange={setMemoryRequest}/>
        <ResourceSlider label="MEMORY LIMIT" value={memoryLimit} min={256} max={2048} step={256} unit="Mi" onChange={updateMemoryLimit}/>
        {invalidLimits && <p className="resource-warning">A request cannot exceed its limit. Adjust the configuration to make the Pod valid.</p>}
        <div className="workload-demand"><div><Activity size={15}/><b>SIMULATED APP DEMAND</b></div>
          <div className="demand-presets" aria-label="Workload demand presets"><button className={cpuDemand<=cpuLimit&&memoryDemand<=memoryLimit?'preset-active':''} onClick={()=>applyPreset('normal')}>Normal</button><button className={cpuDemand>cpuLimit&&memoryDemand<=memoryLimit?'preset-active':''} onClick={()=>applyPreset('cpu')}>CPU pressure</button><button className={memoryDemand>memoryLimit?'preset-active':''} onClick={()=>applyPreset('memory')}>Memory pressure</button></div>
          <ResourceSlider label="CPU DEMAND" value={cpuDemand} min={250} max={2000} step={250} unit="m" onChange={updateCpuDemand}/>
          <ResourceSlider label="MEMORY USE" value={memoryDemand} min={256} max={2048} step={256} unit="Mi" onChange={updateMemoryDemand}/>
        </div>
        <p className="live-control-note">Meters and Pod state update as you move a control.</p>
      </section>
    </div>
    <SignalTrace title="REQUEST TO RUNTIME" steps={['Pod declares requests', 'scheduler checks node', 'container receives resources', podState === 'OOMKilled' ? 'memory OOM kill' : podState === 'Throttled' ? 'CPU throttling' : 'runtime use within limits']} onSelect={step => onSelect(step)}/>
    <div className={`resource-outcome outcome-${displayState.toLowerCase()}`} aria-live="polite"><span className="outcome-indicator"/><div><b>Pod state · {displayState}</b><p>{displayText}</p></div><small>LIVE SIMULATION</small></div>
    <p className="resource-note"><b>Scheduling:</b> the scheduler uses requests, not limits, when checking whether this Pod fits. <b>Runtime:</b> CPU can be throttled; exceeding a memory limit can cause an OOM kill. This model is simplified and does not emulate kernel or node-pressure behavior.</p>
    <LessonCoach task="Choose CPU pressure, then Memory pressure. Watch each meter cross its limit and the live Pod state change without pressing Run." hint="CPU is compressible: demand over limit causes throttling. Memory is not compressible: demand over limit can OOM-kill the container. Requests affect scheduling capacity; changing a request does not cap runtime use." complete={observedThrottle && observedOom} success="You observed live CPU throttling and a memory OOM outcome as workload demand crossed each limit."/>
  </div>
}

function ResourceSlider({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (value: number) => void }) {
  return <label className="resource-slider"><span>{label}</span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))}/><b>{value}{unit}</b></label>
}

function ResourceMeter({ title, icon, demand, request, limit, ceiling, unit, state }: { title: string; icon: ReactNode; demand: number; request: number; limit: number; ceiling: number; unit: string; state: PodState }) {
  const percent = (value: number) => Math.min(100, Math.max(0, value / ceiling * 100))
  const canRun = state !== 'Pending' && state !== 'Invalid'
  const overLimit = canRun && demand > limit
  const format = (value: number) => `${value}${unit}`
  return <section className={`resource-meter meter-${title.toLowerCase()} ${overLimit ? 'meter-over-limit' : ''}`} aria-label={`${title} demand ${format(demand)}, request ${format(request)}, limit ${format(limit)}`}>
    <header><span>{icon}<b>{title}</b></span><strong>{format(demand)} <small>/ {format(ceiling)}</small></strong></header>
    <div className="meter-plot">
      <div className="meter-threshold meter-request" style={{ left: `${percent(request)}%` }}><span>REQ {format(request)}</span></div>
      <div className="meter-threshold meter-limit" style={{ left: `${percent(limit)}%` }}><span>LIMIT {format(limit)}</span></div>
      <div className="meter-track"><motion.i className={`meter-usage ${state === 'OOMKilled' && title === 'MEMORY' || state === 'Throttled' && title === 'CPU' ? 'meter-usage-alert' : ''}`} animate={{ width: `${percent(demand)}%` }} transition={{ type: 'spring', stiffness: 100, damping: 20 }}/></div>
      <motion.span className="meter-current-marker" animate={{ left: `${percent(demand)}%` }} transition={{ type: 'spring', stiffness: 100, damping: 20 }}/>
    </div>
    <footer><span>REQUEST {format(request)}</span><span className={overLimit ? 'meter-state-alert' : ''}>{!canRun ? 'NOT SCHEDULED' : overLimit ? title === 'CPU' ? 'THROTTLING' : 'OOM RISK' : 'WITHIN LIMIT'}</span></footer>
  </section>
}

function CapacityBar({ label, used, total, unit }: { label: string; used: number; total: number; unit: string }) {
  const percent = Math.min(100, used / total * 100)
  return <div className="capacity-bar"><div><b>{label}</b><span>{used}{unit} / {total}{unit}</span></div><span className="capacity-track"><i style={{ width: `${percent}%` }}/></span></div>
}
