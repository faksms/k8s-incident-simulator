import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Activity, ArrowRight, Boxes, CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, Cloud, Code2, Container, Database, Network, Pause, Play, RotateCcw, Server, ShieldCheck, Workflow } from 'lucide-react'
import LessonCoach from './lessons/LessonCoach'
import StepSequenceControls from './lessons/StepSequenceControls'
import LearningMaterials from './LearningMaterials'
import './ClusterArchitecture.css'

const phases = [
  { title: 'Declare intent', route: ['kubectl', 'API server'], description: 'An operator submits a workload manifest. The API server authenticates, validates, and admits the request.' },
  { title: 'Persist desired state', route: ['API server', 'etcd'], description: 'The API server stores the accepted object in etcd. etcd is the durable source of cluster state.' },
  { title: 'Reconcile the workload', route: ['controller manager', 'API server'], description: 'Controllers watch API objects, compare desired with observed state, then create or update workload objects.' },
  { title: 'Assign a node', route: ['scheduler', 'API server', 'kubelet'], description: 'The scheduler filters and scores eligible nodes, then records a binding through the API server.' },
  { title: 'Start the Pod', route: ['kubelet', 'CRI runtime', 'CNI networking', 'Pod'], description: 'The node kubelet observes its assigned Pod, asks the container runtime to start it, and configures networking.' },
  { title: 'Report health', route: ['kubelet', 'API server', 'controller manager'], description: 'Kubelet reports Pod status and probe results. Controllers observe the update and continue reconciling.' },
  { title: 'Route application traffic', route: ['client', 'Service dataplane', 'ready Pod'], description: 'Application packets use the Service data plane to reach a ready Pod. This is separate from control-plane reconciliation.' },
]

type CommunicationLeg = { from: string; to: string; label: string }

const communicationFlows: CommunicationLeg[][] = [
  [{ from: 'kubectl', to: 'API server', label: 'kubectl submits the workload manifest to the API server' }],
  [{ from: 'API server', to: 'etcd', label: 'API server persists the accepted desired state in etcd' }],
  [{ from: 'Controller manager', to: 'API server', label: 'Controller manager observes state and reconciles through the API server' }],
  [{ from: 'Scheduler', to: 'API server', label: 'Scheduler binds the Pod to a node through the API server' }],
  [{ from: 'API server', to: 'kubelet', label: 'API server watches assign the Pod to kubelet' }, { from: 'kubelet', to: 'CRI runtime', label: 'kubelet instructs CRI runtime to start the container' }, { from: 'CRI runtime', to: 'Pod app-1', label: 'container runtime starts Pod app-1' }],
  [{ from: 'Pod app-1', to: 'kubelet', label: 'Pod app-1 reports status to kubelet' }, { from: 'kubelet', to: 'API server', label: 'kubelet reports health to the API server' }],
  [{ from: 'Client', to: 'kube-proxy / eBPF', label: 'client traffic reaches the Service data plane' }, { from: 'kube-proxy / eBPF', to: 'Pod app-1', label: 'Service traffic reaches Pod app-1' }],
]

const componentInfo: Record<string, string> = {
  'kubectl': 'Kubernetes CLI. Sends HTTPS API requests; it does not talk directly to Pods or etcd.',
  'API server': 'The control plane front door. It authenticates, authorizes, validates, runs admission, and exposes the Kubernetes API.',
  'etcd': 'Consistent key-value store holding durable cluster state. Only the API server accesses it directly.',
  'Scheduler': 'Watches for unscheduled Pods, evaluates constraints and capacity, then writes a node binding through the API server.',
  'Controller manager': 'Runs controllers that reconcile actual state toward the declared desired state.',
  'Cloud controller': 'Optional cloud integration for provider-specific nodes, routes, and load balancers.',
  'kubelet': 'Node agent. Watches the API for Pods assigned to its node, starts containers, and reports status.',
  'kube-proxy / eBPF': 'Implements Service forwarding. Some clusters use an eBPF data plane instead.',
  'CRI runtime': 'Container runtime such as containerd or CRI-O, managed through the Container Runtime Interface.',
  'CNI networking': 'Container network plugin that configures Pod addresses and connectivity.',
  'Pod': 'A scheduled workload unit containing one or more containers and a Pod IP.',
  'Service dataplane': 'Data-plane forwarding from a Service virtual address to a ready endpoint. It does not pass through etcd.',
}

export default function ClusterArchitecture({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [selected, setSelected] = useState('')
  const [knowledgePassed, setKnowledgePassed] = useState(false)
  const [legIndex, setLegIndex] = useState(0)
  const mapRef = useRef<HTMLDivElement>(null)
  const [flowGeometry, setFlowGeometry] = useState<{ width:number; height:number; path:string; color:string }>({ width:0, height:0, path:'', color:'#34d399' })
  const current = phases[phase]
  const flow = communicationFlows[phase]
  const activeLeg = flow[0]
  const stepColor = phase === 5 ? '#fbbf24' : phase === 4 || phase === 6 ? '#38bdf8' : '#34d399'

  useEffect(() => {
    function measureActiveFlow() {
      const map = mapRef.current
      if (!map) return
      const mapRect = map.getBoundingClientRect()
      const points = stepNames(phase).map(name => {
        const card = name === 'Pod app-1'
          ? map.querySelector('[data-component="Pod app-1"]')
          : name === 'Client'
            ? map.querySelector('[data-component="Client"]')
            : Array.from(map.querySelectorAll<HTMLElement>('[data-component]')).find(element => element.dataset.component === name) ?? null
        if (!(card instanceof HTMLElement)) return null
        const rect = card.getBoundingClientRect()
        return { x: rect.left - mapRect.left + rect.width / 2, y: rect.top - mapRect.top + rect.height / 2 }
      }).filter((point): point is {x:number;y:number} => point !== null)

      if (points.length < 2) {
        setFlowGeometry({ width:mapRect.width, height:mapRect.height, path:'', color:stepColor })
        return
      }

      let path = `M ${points[0].x} ${points[0].y}`
      for (let index = 1; index < points.length; index += 1) {
        const start = points[index - 1]
        const end = points[index]
        const horizontal = Math.abs(end.x - start.x) * 0.5
        path += ` C ${start.x + horizontal} ${start.y}, ${end.x - horizontal} ${end.y}, ${end.x} ${end.y}`
      }
      setFlowGeometry({ width:mapRect.width, height:mapRect.height, path, color:stepColor })
    }

    measureActiveFlow()
    window.addEventListener('resize', measureActiveFlow)
    const observer = typeof ResizeObserver !== 'undefined' && mapRef.current ? new ResizeObserver(measureActiveFlow) : null
    if (observer && mapRef.current) observer.observe(mapRef.current)
    return () => {
      window.removeEventListener('resize', measureActiveFlow)
      observer?.disconnect()
    }
  }, [phase, legIndex, stepColor])

  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => {
      if (legIndex < flow.length - 1) {
        setLegIndex(value => value + 1)
        return
      }
      if (phase >= phases.length - 1) {
        setPlaying(false)
        return
      }
      setPhase(value => value + 1)
      setLegIndex(0)
    }, 1400)
    return () => window.clearTimeout(timer)
  }, [playing, phase, legIndex, flow.length])

  function choosePhase(index: number) {
    setPhase(index)
    setLegIndex(0)
    setPlaying(false)
  }

  function replay() {
    setPhase(0)
    setLegIndex(0)
    setPlaying(true)
  }

  function togglePlay() {
    if (phase === phases.length - 1 && legIndex === flow.length - 1 && !playing) {
      setPhase(0)
      setLegIndex(0)
      setPlaying(true)
      return
    }
    setPlaying(value => !value)
  }

  const activeStepNames = stepNames(phase)
  const isActive = (name: string) => activeStepNames.some(participant => participant.toLowerCase() === name.toLowerCase() || ((name === 'Pod' || name === 'Pod app-1') && participant === 'Pod app-1'))
  const isSource = (name: string) => activeLeg.from.toLowerCase() === name.toLowerCase()
  const isDestination = (name: string) => activeLeg.to.toLowerCase() === name.toLowerCase()
  const workloadState = phase === 0 || phase === 1
    ? 'NOT CREATED'
    : phase === 2
      ? 'REPLICASET CREATING'
      : phase === 3
        ? 'POD SCHEDULING'
        : phase === 4
          ? 'CONTAINER STARTING'
          : 'READY'

  return <main className="architecture-page">
    <header className="architecture-header">
      <div className="architecture-brand"><span className="architecture-mark"><Cloud size={20}/></span><span><b>Kubernetes, visually</b><small>CLUSTER CONTROL &amp; DATA PATHS</small></span></div>
      <div className="architecture-header-note"><span className="live-dot"/> SIMULATED CLUSTER</div>
      <button className="architecture-skip" onClick={onComplete}>Continue to foundations <ArrowRight size={16}/></button>
    </header>

    <div className="architecture-shell">
      <section className="architecture-intro">
        <div><p className="architecture-kicker">FIELD GUIDE · 01 / CONTROL PLANE TO POD</p><h1>One cluster. Two planes.<br/><em>Every hop, explained.</em></h1><p className="architecture-lede">Trace how a workload becomes a running Pod—and how application traffic takes a separate path through the cluster.</p></div>
        <div className="architecture-legend"><span><i className="legend-control"/> CONTROL PLANE</span><span><i className="legend-data"/> DATA PLANE</span><span><i className="legend-state"/> STATE / STATUS</span></div>
      </section>

      <section className="architecture-board" aria-label="Interactive Kubernetes architecture diagram">
        <div className="board-topline"><span><Activity size={15}/> LIVE ARCHITECTURE MAP</span><span>CONTROL PLANE <ArrowRight size={13}/> NODE AGENTS <ArrowRight size={13}/> WORKLOAD</span></div>
        <div ref={mapRef} className="architecture-map flow-dimming map-phase-${phase}">
          {flowGeometry.path && <svg id="k8s-flow-overlay" className="k8s-flow-overlay" viewBox={`0 0 ${flowGeometry.width} ${flowGeometry.height}`} preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="k8s-step-gradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={phase === 6 ? '#38bdf8' : stepColor}/><stop offset="100%" stopColor={phase === 6 ? '#34d399' : stepColor}/></linearGradient>
              <filter id="k8s-packet-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <path id="k8s-active-flow-path" d={flowGeometry.path} fill="none" stroke={phase === 6 ? 'url(#k8s-step-gradient)' : flowGeometry.color} strokeWidth="3" strokeLinecap="round" strokeDasharray="10 7" className="k8s-flow-path"/>
            <circle r="4.5" fill={phase === 5 ? '#fbbf24' : flowGeometry.color} filter="url(#k8s-packet-glow)" className="k8s-flow-packet"><animateMotion dur="1.8s" repeatCount="indefinite" rotate="auto"><mpath href="#k8s-active-flow-path"/></animateMotion></circle>
          </svg>}
          <section className="plane control-plane">
            <div className="plane-heading"><div><Cloud size={17}/><b>CONTROL PLANE</b></div><small>CLUSTER BRAIN · RECONCILES DESIRED STATE</small></div>
            <div className="control-components">
              <ComponentButton name="kubectl" icon={<Code2/>} selected={selected} active={isActive('kubectl')} source={isSource('kubectl')} destination={isDestination('kubectl')} onSelect={setSelected}/>
              <ComponentButton name="API server" icon={<Workflow/>} selected={selected} active={isActive('API server')} source={isSource('API server')} destination={isDestination('API server')} onSelect={setSelected}/>
              <ComponentButton name="etcd" icon={<Database/>} selected={selected} active={isActive('etcd')} source={isSource('etcd')} destination={isDestination('etcd')} onSelect={setSelected}/>
              <ComponentButton name="Scheduler" icon={<Activity/>} selected={selected} active={isActive('Scheduler')} source={isSource('Scheduler')} destination={isDestination('Scheduler')} onSelect={setSelected}/>
              <ComponentButton name="Controller manager" icon={<Workflow/>} selected={selected} active={isActive('Controller manager')} source={isSource('Controller manager')} destination={isDestination('Controller manager')} onSelect={setSelected}/>
              <ComponentButton name="Cloud controller" icon={<Cloud/>} selected={selected} active={false} onSelect={setSelected}/>
            </div>
          </section>

          <section className="plane worker-plane">
            <div className="plane-heading"><div><Server size={17}/><b>WORKER NODES</b></div><small>DATA PLANE · RUNS APPLICATION WORKLOADS</small></div>
            <div className="worker-grid">
              {[0, 1].map(node => <section className="worker-node" key={node}>
                <div className="worker-title"><Server size={15}/><b>NODE 0{node + 1}</b><span>HEALTHY</span></div>
                <div className="node-components">
                  <ComponentButton name="kubelet" icon={<Activity/>} selected={selected} active={isActive('kubelet')} source={isSource('kubelet')} destination={isDestination('kubelet')} onSelect={setSelected}/>
                  <ComponentButton name="kube-proxy / eBPF" icon={<Network/>} selected={selected} active={isActive('kube-proxy / eBPF')} source={isSource('kube-proxy / eBPF')} destination={isDestination('kube-proxy / eBPF')} onSelect={setSelected}/>
                  <ComponentButton name="CRI runtime" icon={<Container/>} selected={selected} active={isActive('CRI runtime')} source={isSource('CRI runtime')} destination={isDestination('CRI runtime')} onSelect={setSelected}/>
                  <ComponentButton name="CNI networking" icon={<Network/>} selected={selected} active={isActive('CNI networking')} source={isSource('CNI networking')} destination={isDestination('CNI networking')} onSelect={setSelected}/>
                </div>
                <button data-component={node === 0 ? 'Pod app-1' : 'Pod app-2'} className={`workload-pod workload-${workloadState.toLowerCase().replace(/ /g, '-')} ${isActive('Pod app-1') && node === 0 ? 'component-active' : ''}`} onClick={() => setSelected('Pod')} aria-label={`Pod lifecycle state: ${workloadState}`}><Boxes size={17}/><span><b>{phase >= 2 ? `Pod · app-${node + 1}` : 'Pod · not created'}</b><small>{workloadState === 'NOT CREATED' ? 'Waiting for workload object' : 'Ready for traffic'}</small></span><span className="pod-health">{workloadState}</span></button>
              </section>)}
            </div>
          </section>
        </div>

        <div className="communication-section" aria-live="polite">
          <div className="communication-heading"><div><Network size={16}/><b>{phase === 6 ? 'APPLICATION TRAFFIC' : 'WORKLOAD CREATION'}</b></div><span>STEP {String(phase + 1).padStart(2, '0')} / {String(phases.length).padStart(2, '0')}</span></div>
          <div className={`architecture-phase-detail ${phase === 6 ? 'phase-data' : 'phase-control'}`} key={`detail-${phase}`}>
            <span className="route-step-number">{String(phase + 1).padStart(2, '0')}</span>
            <div><h2>{current.title}</h2><p>{current.description}</p><small className="map-leg-label"><b>{activeLeg.from}</b><ArrowRight size={13}/> <b>{activeLeg.to}</b> · {activeLeg.label}</small></div>
            <b className="map-lifecycle-state">{workloadState}</b>
          </div>
        </div>

        <div className="timeline-controls">
          <div className="phase-tabs" aria-label="Communication path steps">{phases.map((item, index) => <button key={item.title} onClick={() => choosePhase(index)} className={index === phase ? 'phase-tab-current' : ''} aria-label={`Step ${index + 1}: ${item.title}`}><span>{index < phase ? <CheckCircle2 size={13}/> : String(index + 1).padStart(2, '0')}</span><b>{item.title}</b></button>)}</div>
          <div className="playback-row"><div className="playback-buttons"><button onClick={togglePlay} className="playback-primary">{playing ? <Pause size={15}/> : <Play size={15}/>} {playing ? 'Pause' : 'Play'}</button><button onClick={replay} className="playback-secondary"><RotateCcw size={15}/> Replay</button><button onClick={() => choosePhase(Math.max(0, phase - 1))} aria-label="Previous animation step" className="icon-control"><ChevronLeft size={17}/></button><button onClick={() => choosePhase(Math.min(phases.length - 1, phase + 1))} aria-label="Next animation step" className="icon-control"><ChevronRight size={17}/></button></div><div className="playback-status"><span className="live-dot"/>{playing ? 'ANIMATION PLAYING' : 'PAUSED · SELECT A STEP'}</div></div>
        </div>
      </section>

      <LessonCoach task="Select the component that forwards Service traffic to a ready Pod." hint="Look on a worker node for kube-proxy / eBPF. It implements Service forwarding in the data plane; the API server stores configuration but does not carry application packets." complete={selected==='kube-proxy / eBPF'} success="Correct: Service forwarding is performed by the cluster data plane, not by etcd or the API server."/>
      <div className="architecture-bottom">
        <div className="component-inspector"><CircleHelp size={17}/><span>{selected ? <><b>{selected}</b>{componentInfo[selected] ?? 'A component in the Kubernetes control and workload path.'}</> : 'Click any component in the map to inspect its role and communication boundaries.'}</span></div>
        <div className="architecture-principle"><ShieldCheck size={16}/><span><b>Important boundary</b> Control traffic goes through the API server. Service packets are data-plane traffic; they do not pass through etcd.</span></div>
      </div>
      <LearningMaterials lessonId="architecture" onPass={() => setKnowledgePassed(true)}/>
      <footer className="architecture-footer"><span>INTERACTIVE SYSTEMS EXPLAINED · KUBERNETES ARCHITECTURE</span><button aria-label={knowledgePassed?'Continue to foundations; knowledge check passed':'Continue to interactive foundations'} onClick={onComplete}>Continue to interactive foundations <ChevronRight size={16}/></button></footer>
    </div>
  </main>
}

function stepNames(phase:number): string[] {
  if (phase === 0) return ['kubectl','API server']
  if (phase === 1) return ['API server','etcd']
  if (phase === 2) return ['Controller manager','API server']
  if (phase === 3) return ['Scheduler','API server']
  if (phase === 4) return ['API server','kubelet','CRI runtime','Pod app-1']
  if (phase === 5) return ['Pod app-1','kubelet','API server']
  return ['Client','kube-proxy / eBPF','Pod app-1']
}

function FlowLink({ active, label, direction }: { active: boolean; label: string; direction: 'right'|'left'|'down'|'up' }) {
  return <span className={`flow-link flow-link-${direction} ${active ? 'flow-link-active' : ''}`} aria-label={label}><i/><b>{label}</b></span>
}

function ComponentButton({ name, icon, selected, active, source, destination, onSelect }: { name: string; icon: ReactNode; selected: string; active: boolean; source?: boolean; destination?: boolean; onSelect: (name: string) => void }) {
  return <button data-component={name} className={`architecture-component ${active ? 'component-active' : ''} ${source ? 'component-source' : ''} ${destination ? 'component-destination' : ''} ${selected === name ? 'component-selected' : ''}`} onClick={() => onSelect(name)} aria-pressed={selected === name}><span className="component-icon">{icon}</span><span className="component-label">{name}</span>{active && <i className="component-pulse"/>}</button>
}
