import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Activity, ArrowDown, ArrowRight, Boxes, CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, Cloud, Code2, Container, Database, Network, Pause, Play, RotateCcw, Server, ShieldCheck, Workflow } from 'lucide-react'
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
  const current = phases[phase]

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => setPhase(value => {
      if (value >= phases.length - 1) {
        setPlaying(false)
        return value
      }
      return value + 1
    }), 2800)
    return () => window.clearInterval(timer)
  }, [playing])

  function choosePhase(index: number) {
    setPhase(index)
    setPlaying(false)
  }

  function replay() {
    setPhase(0)
    setPlaying(true)
  }

  function togglePlay() {
    if (phase === phases.length - 1 && !playing) {
      setPhase(0)
      setPlaying(true)
      return
    }
    setPlaying(value => !value)
  }

  const isActive = (name: string) => current.route.includes(name)
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
        <div className={`architecture-map map-phase-${phase}`}>
          <span className="architecture-map-packet" key={`map-packet-${phase}`} aria-hidden="true"/>
          <section className="plane control-plane">
            <div className="plane-heading"><div><Cloud size={17}/><b>CONTROL PLANE</b></div><small>CLUSTER BRAIN · RECONCILES DESIRED STATE</small></div>
            <div className="control-components">
              <ComponentButton name="API server" icon={<Workflow/>} selected={selected} active={isActive('API server')} onSelect={setSelected}/>
              <ComponentButton name="etcd" icon={<Database/>} selected={selected} active={isActive('etcd')} onSelect={setSelected}/>
              <ComponentButton name="Scheduler" icon={<Activity/>} selected={selected} active={isActive('scheduler')} onSelect={setSelected}/>
              <ComponentButton name="Controller manager" icon={<Workflow/>} selected={selected} active={isActive('controller manager')} onSelect={setSelected}/>
              <ComponentButton name="Cloud controller" icon={<Cloud/>} selected={selected} active={isActive('controller manager')} onSelect={setSelected}/>
            </div>
          </section>

          <div className="architecture-bridge" aria-hidden="true"><div className={`bridge-line ${phase < 6 ? 'bridge-control-active' : 'bridge-data-active'}`}><span className="bridge-packet" key={`bridge-${phase}`}/></div><span>API / NODE BOUNDARY</span><div className="bridge-arrow"><ArrowDown size={16}/></div></div>

          <section className="plane worker-plane">
            <div className="plane-heading"><div><Server size={17}/><b>WORKER NODES</b></div><small>DATA PLANE · RUNS APPLICATION WORKLOADS</small></div>
            <div className="worker-grid">
              {[0, 1].map(node => <section className="worker-node" key={node}>
                <div className="worker-title"><Server size={15}/><b>NODE 0{node + 1}</b><span>HEALTHY</span></div>
                <div className="node-components">
                  <ComponentButton name="kubelet" icon={<Activity/>} selected={selected} active={isActive('kubelet')} onSelect={setSelected}/>
                  <ComponentButton name="kube-proxy / eBPF" icon={<Network/>} selected={selected} active={isActive('Service dataplane')} onSelect={setSelected}/>
                  <ComponentButton name="CRI runtime" icon={<Container/>} selected={selected} active={isActive('CRI runtime')} onSelect={setSelected}/>
                  <ComponentButton name="CNI networking" icon={<Network/>} selected={selected} active={isActive('CNI networking')} onSelect={setSelected}/>
                </div>
                <button className={`workload-pod workload-${workloadState.toLowerCase().replace(/ /g, '-')} ${isActive('Pod') || isActive('ready Pod') ? 'component-active' : ''}`} onClick={() => setSelected('Pod')} aria-label={`Pod lifecycle state: ${workloadState}`}><Boxes size={17}/><span><b>{phase >= 2 ? `Pod · app-${node + 1}` : 'Pod · not created'}</b><small>{workloadState === 'NOT CREATED' ? 'Waiting for workload object' : phase === 2 ? 'ReplicaSet reconcile' : phase === 3 ? 'Scheduler binding' : phase === 4 ? 'Runtime and CNI setup' : 'Probe passed'}</small></span><span className="pod-health">{workloadState}</span></button>
              </section>)}
            </div>
          </section>
        </div>

        <div className="communication-section" aria-live="polite">
          <div className="communication-heading"><div><Network size={16}/><b>{phase === 6 ? 'APPLICATION TRAFFIC' : 'WORKLOAD CREATION'}</b></div><span>STEP {String(phase + 1).padStart(2, '0')} / {String(phases.length).padStart(2, '0')}</span></div>
          <div className={`architecture-phase-detail ${phase === 6 ? 'phase-data' : 'phase-control'}`} key={`detail-${phase}`}>
            <span className="route-step-number">{String(phase + 1).padStart(2, '0')}</span>
            <div><h2>{current.title}</h2><p>{current.description}</p></div>
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

function ComponentButton({ name, icon, selected, active, onSelect }: { name: string; icon: ReactNode; selected: string; active: boolean; onSelect: (name: string) => void }) {
  return <button className={`architecture-component ${active ? 'component-active' : ''} ${selected === name ? 'component-selected' : ''}`} onClick={() => onSelect(name)} aria-pressed={selected === name}><span className="component-icon">{icon}</span><span className="component-label">{name}</span>{active && <i className="component-pulse"/>}</button>
}
