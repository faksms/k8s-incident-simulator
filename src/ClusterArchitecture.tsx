import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Activity, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, Cloud, Code2, Container, Network, Pause, Play, RotateCcw, ShieldCheck } from 'lucide-react'
import LessonCoach from './lessons/LessonCoach'
import StepSequenceControls from './lessons/StepSequenceControls'
import LearningMaterials from './LearningMaterials'
import { pathSegments, routeBetween } from './architectureRouting'
import type { RoutingPort, RoutingRect, RoutingSegment } from './architectureRouting'
import './ClusterArchitecture.css'

const kubernetesIcons = {
  api: new URL('./assets/kubernetes/api.svg', import.meta.url).href,
  controller: new URL('./assets/kubernetes/c-m.svg', import.meta.url).href,
  cloudController: new URL('./assets/kubernetes/c-c-m.svg', import.meta.url).href,
  controlPlane: new URL('./assets/kubernetes/control-plane.svg', import.meta.url).href,
  etcd: new URL('./assets/kubernetes/etcd.svg', import.meta.url).href,
  proxy: new URL('./assets/kubernetes/k-proxy.svg', import.meta.url).href,
  kubelet: new URL('./assets/kubernetes/kubelet.svg', import.meta.url).href,
  node: new URL('./assets/kubernetes/node.svg', import.meta.url).href,
  pod: new URL('./assets/kubernetes/pod.svg', import.meta.url).href,
  scheduler: new URL('./assets/kubernetes/sched.svg', import.meta.url).href,
}

function KubernetesIcon({ src }: { src: string }) {
  return <img className="kubernetes-icon" src={src} alt=""/>
}

const phases = [
  { title: 'Declare intent', route: ['kubectl', 'API server'], description: 'An operator submits a workload manifest. The API server authenticates, validates, and admits the request.' },
  { title: 'Persist desired state', route: ['API server', 'etcd'], description: 'The API server stores the accepted object in etcd. etcd is the durable source of cluster state.' },
  { title: 'Reconcile the workload', route: ['controller manager', 'API server'], description: 'Controllers watch API objects, compare desired with observed state, then create or update workload objects.' },
  { title: 'Assign a node', route: ['scheduler', 'API server', 'kubelet'], description: 'The scheduler filters and scores eligible nodes, then records a binding through the API server.' },
  { title: 'Start the Pod', route: ['kubelet', 'CRI runtime', 'CNI networking', 'Pod'], description: 'The kubelet asks the runtime to start the Pod; the runtime invokes CNI to configure its networking.' },
  { title: 'Report health', route: ['kubelet', 'API server', 'controller manager'], description: 'Kubelet reports Pod status and probe results. Controllers observe the update and continue reconciling.' },
  { title: 'Route application traffic', route: ['client', 'Service dataplane', 'ready Pod'], description: 'Application packets use the Service data plane to reach a ready Pod. This is separate from control-plane reconciliation.' },
]

type CommunicationLeg = { from: string; to: string; label: string }

const communicationFlows: CommunicationLeg[][] = [
  [{ from: 'kubectl', to: 'API server', label: 'kubectl submits the workload manifest to the API server' }],
  [{ from: 'API server', to: 'etcd', label: 'API server persists the accepted desired state in etcd' }],
  [{ from: 'Controller manager', to: 'API server', label: 'Controller manager observes state and reconciles through the API server' }],
  [{ from: 'Scheduler', to: 'API server', label: 'Scheduler binds the Pod to a node through the API server' }],
  [{ from: 'kubelet', to: 'API server', label: 'kubelet watches the API server for its assigned Pod' }, { from: 'kubelet', to: 'CRI runtime', label: 'kubelet asks the runtime to start the Pod' }, { from: 'CRI runtime', to: 'CNI networking', label: 'the runtime invokes CNI to configure Pod networking' }, { from: 'CNI networking', to: 'Pod app-1', label: 'CNI configures networking for Pod app-1' }, { from: 'CRI runtime', to: 'Pod app-1', label: 'the runtime starts the containers in Pod app-1' }],
  [{ from: 'Pod app-1', to: 'kubelet', label: 'Pod app-1 reports status to kubelet' }, { from: 'kubelet', to: 'API server', label: 'kubelet reports health to the API server' }],
  [{ from: 'Client', to: 'kube-proxy / eBPF', label: 'the client sends traffic to a Service VIP via the Service data plane' }, { from: 'kube-proxy / eBPF', to: 'Pod app-1', label: 'Service traffic reaches Pod app-1' }],
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
  'Client': 'An application client sends traffic to a Service virtual IP; the Service data plane forwards it to a ready endpoint.',
}

export default function ClusterArchitecture({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [selected, setSelected] = useState('')
  const [knowledgePassed, setKnowledgePassed] = useState(false)
  const [legIndex, setLegIndex] = useState(0)
  const mapRef = useRef<HTMLDivElement>(null)
  const [flowGeometry, setFlowGeometry] = useState<{ width:number; height:number; path:string; color:string }>({ width:0, height:0, path:'', color:'#34d399' })
  const [topologyGeometry, setTopologyGeometry] = useState<{ width:number; height:number; lines:Array<{d:string; from:string; to:string; data:boolean}> }>({ width:0, height:0, lines:[] })
  const current = phases[phase]
  const flow = communicationFlows[phase]
  const activeLeg = flow[legIndex]
  const stepColor = phase === 5 ? '#fbbf24' : phase === 4 || phase === 6 ? '#38bdf8' : '#34d399'

  useEffect(() => {
    function measureActiveFlow() {
      const map = mapRef.current
      if (!map) return
      const mapRect = map.getBoundingClientRect()
      const cards = new Map<string, RoutingRect>()
      map.querySelectorAll<HTMLElement>('[data-flow-id]').forEach(card => {
        const rect = card.getBoundingClientRect()
        cards.set(card.dataset.flowId!, {
          left: rect.left - mapRect.left, right: rect.right - mapRect.left,
          top: rect.top - mapRect.top, bottom: rect.bottom - mapRect.top,
        })
      })
      const route = (from: string, to: string, avoid: RoutingSegment[] = [], ports: { from?: RoutingPort; to?: RoutingPort } = {}) => {
        const start = cards.get(from)
        const end = cards.get(to)
        if (!start || !end) {
          console.error(`Missing architecture component for ${from} → ${to}`)
          return ''
        }
        const path = routeBetween(start, end, Array.from(cards.values()), avoid, ports)
        if (!path) console.error(`Unable to route architecture connection ${from} → ${to}`)
        return path
      }
      const id = (name: string) => ['kubelet', 'kube-proxy / eBPF', 'CRI runtime', 'CNI networking'].includes(name) ? `${name}-1` : name

      const api = cards.get('API server')
      if (!api) {
        console.error('Missing architecture component for API server')
        return
      }
      const apiOffset = (name: string) => {
        const card = cards.get(name)
        if (!card) throw new Error(`Missing architecture component for ${name}`)
        return ((card.top + card.bottom) / 2 - api.top) / (api.bottom - api.top)
      }
      type TopologyLink = { from: string; to: string; data: boolean; ports?: { from?: RoutingPort; to?: RoutingPort } }
      const pairs: TopologyLink[] = [
        { from:'kubectl', to:'API server', data:false, ports:{ from:{ side:'bottom' }, to:{ side:'top' } } },
        { from:'Scheduler', to:'API server', data:false, ports:{ from:{ side:'right' }, to:{ side:'left', offset:apiOffset('Scheduler') } } },
        { from:'Cloud controller', to:'API server', data:false, ports:{ from:{ side:'right' }, to:{ side:'left', offset:apiOffset('Cloud controller') } } },
        { from:'Controller manager', to:'API server', data:false, ports:{ from:{ side:'left' }, to:{ side:'right', offset:apiOffset('Controller manager') } } },
        { from:'API server', to:'etcd', data:false, ports:{ from:{ side:'right', offset:apiOffset('etcd') }, to:{ side:'left' } } },
        ...[1, 2].map(node => ({ from:`kubelet-${node}`, to:'API server', data:false, ports:{ to:{ side:'bottom' as const, offset:node === 1 ? 0.3 : 0.7 } } })),
        ...[1, 2].flatMap(node => [
          { from:'Client', to:`kube-proxy / eBPF-${node}`, data:true, ports:{ from:{ side:'bottom' as const, offset:node === 1 ? 0.3 : 0.7 }, to:{ side:'top' as const } } },
          { from:`kube-proxy / eBPF-${node}`, to:`Pod app-${node}`, data:true },
        ]),
      ]
      const activeFrom = id(activeLeg.from)
      const activeTo = id(activeLeg.to)
      const activePorts = pairs.find(pair => pair.from === activeFrom && pair.to === activeTo)?.ports
      setFlowGeometry({ width:mapRect.width, height:mapRect.height, path:route(activeFrom, activeTo, [], activePorts), color:stepColor })
      const occupied: RoutingSegment[] = []
      const lines = pairs.flatMap(({ from, to, data, ports }) => {
        const d = route(from, to, occupied, ports)
        if (d) occupied.push(...pathSegments(d))
        return d ? [{ d, from, to, data }] : []
      })
      setTopologyGeometry({ width:mapRect.width, height:mapRect.height, lines })
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

  const isActive = (name: string) => activeLeg.from === name || activeLeg.to === name
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
        <div className="board-topline"><span><Activity size={15}/> LIVE ARCHITECTURE MAP</span><span>DOTTED: HIGH-LEVEL LINKS <span aria-hidden="true">·</span> SOLID: ACTIVE HOP</span></div>
        <div ref={mapRef} className={`architecture-map flow-dimming map-phase-${phase}`}>
          {topologyGeometry.lines.length > 0 && <svg className="k8s-static-topology" viewBox={`0 0 ${topologyGeometry.width} ${topologyGeometry.height}`} preserveAspectRatio="none" aria-hidden="true">
            <defs><marker id="k8s-topology-control-arrow" viewBox="0 0 10 10" refX="13" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#76b79e"/></marker><marker id="k8s-topology-data-arrow" viewBox="0 0 10 10" refX="13" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#70bfe8"/></marker></defs>
            <g className="k8s-static-lines">{topologyGeometry.lines.map(line => <path key={`${line.from}-${line.to}`} data-from={line.from} data-to={line.to} className={line.data ? 'topology-data' : ''} markerEnd={line.data ? 'url(#k8s-topology-data-arrow)' : 'url(#k8s-topology-control-arrow)'} d={line.d}/>)}</g>
          </svg>}
          {flowGeometry.path && <svg id="k8s-flow-overlay" className="k8s-flow-overlay" viewBox={`0 0 ${flowGeometry.width} ${flowGeometry.height}`} preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="k8s-step-gradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={phase === 6 ? '#38bdf8' : stepColor}/><stop offset="100%" stopColor={phase === 6 ? '#34d399' : stepColor}/></linearGradient>
              <filter id="k8s-packet-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <marker id="k8s-flow-arrow" viewBox="0 0 10 10" refX="13" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill={stepColor}/></marker>
            </defs>
            <path id="k8s-active-flow-path" d={flowGeometry.path} fill="none" stroke={phase === 6 ? 'url(#k8s-step-gradient)' : flowGeometry.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" markerEnd="url(#k8s-flow-arrow)" className="k8s-flow-path"/>
            {playing && <circle r="4" fill={phase === 5 ? '#fbbf24' : flowGeometry.color} filter="url(#k8s-packet-glow)" className="k8s-flow-packet"><animateMotion dur="1.8s" repeatCount="indefinite" rotate="auto"><mpath href="#k8s-active-flow-path"/></animateMotion></circle>}
          </svg>}
          <div className="architecture-external architecture-kubectl">
            <ComponentButton name="kubectl" icon={<Code2/>} selected={selected} active={isActive('kubectl')} source={isSource('kubectl')} destination={isDestination('kubectl')} onSelect={setSelected}/>
          </div>
          <section className="plane control-plane">
            <div className="plane-heading"><div><KubernetesIcon src={kubernetesIcons.controlPlane}/><b>CONTROL PLANE</b></div><small>CLUSTER BRAIN · RECONCILES DESIRED STATE</small></div>
            <div className="control-components">
              <ComponentButton name="API server" icon={<KubernetesIcon src={kubernetesIcons.api}/>} selected={selected} active={isActive('API server')} source={isSource('API server')} destination={isDestination('API server')} onSelect={setSelected}/>
              <ComponentButton name="etcd" icon={<KubernetesIcon src={kubernetesIcons.etcd}/>} selected={selected} active={isActive('etcd')} source={isSource('etcd')} destination={isDestination('etcd')} onSelect={setSelected}/>
              <ComponentButton name="Scheduler" icon={<KubernetesIcon src={kubernetesIcons.scheduler}/>} selected={selected} active={isActive('Scheduler')} source={isSource('Scheduler')} destination={isDestination('Scheduler')} onSelect={setSelected}/>
              <ComponentButton name="Controller manager" icon={<KubernetesIcon src={kubernetesIcons.controller}/>} selected={selected} active={isActive('Controller manager')} source={isSource('Controller manager')} destination={isDestination('Controller manager')} onSelect={setSelected}/>
              <ComponentButton name="Cloud controller" icon={<KubernetesIcon src={kubernetesIcons.cloudController}/>} selected={selected} active={false} onSelect={setSelected}/>
            </div>
          </section>
          <div className="architecture-external architecture-client">
            <ComponentButton name="Client" icon={<Network/>} selected={selected} active={isActive('Client')} source={isSource('Client')} destination={isDestination('Client')} onSelect={setSelected}/>
          </div>
          <section className="plane worker-plane">
            <div className="plane-heading"><div><KubernetesIcon src={kubernetesIcons.node}/><b>WORKER NODES</b></div><small>DATA PLANE · RUNS APPLICATION WORKLOADS</small></div>
            <div className="worker-grid">
              {[0, 1].map(node => <section className="worker-node" key={node}>
                <div className="worker-title"><KubernetesIcon src={kubernetesIcons.node}/><b>NODE 0{node + 1}</b><span>HEALTHY</span></div>
                <div className="node-components">
                  <ComponentButton node={node + 1} name="kubelet" icon={<KubernetesIcon src={kubernetesIcons.kubelet}/>} selected={selected} active={node === 0 && isActive('kubelet')} source={node === 0 && isSource('kubelet')} destination={node === 0 && isDestination('kubelet')} onSelect={setSelected}/>
                  <ComponentButton node={node + 1} name="kube-proxy / eBPF" icon={<KubernetesIcon src={kubernetesIcons.proxy}/>} selected={selected} active={node === 0 && isActive('kube-proxy / eBPF')} source={node === 0 && isSource('kube-proxy / eBPF')} destination={node === 0 && isDestination('kube-proxy / eBPF')} onSelect={setSelected}/>
                  <ComponentButton node={node + 1} name="CRI runtime" icon={<Container/>} selected={selected} active={node === 0 && isActive('CRI runtime')} source={node === 0 && isSource('CRI runtime')} destination={node === 0 && isDestination('CRI runtime')} onSelect={setSelected}/>
                  <ComponentButton node={node + 1} name="CNI networking" icon={<Network/>} selected={selected} active={node === 0 && isActive('CNI networking')} source={node === 0 && isSource('CNI networking')} destination={node === 0 && isDestination('CNI networking')} onSelect={setSelected}/>
                </div>
                <button data-component={`Pod app-${node + 1}`} data-flow-id={`Pod app-${node + 1}`} className={`workload-pod workload-${workloadState.toLowerCase().replace(/ /g, '-')} ${isActive('Pod app-1') && node === 0 ? 'component-active' : ''}`} onClick={() => setSelected('Pod')} aria-label={`Pod lifecycle state: ${workloadState}`}><KubernetesIcon src={kubernetesIcons.pod}/><span><b>{phase >= 2 ? `Pod · app-${node + 1}` : 'Pod · not created'}</b><small>{workloadState === 'NOT CREATED' ? 'Waiting for workload object' : 'Ready for traffic'}</small></span><span className="pod-health">{workloadState}</span></button>
              </section>)}
            </div>
          </section>
        </div>

        <div className="topology-explainer">
          <p><b>CONTROL</b> kubectl, the scheduler, controllers and kubelets use the API server; only the API server accesses etcd.</p>
          <p><b>TRAFFIC</b> Client → Service forwarding (kube-proxy / eBPF) → ready Pod. Packets do not pass through the API server.</p>
          <p><b>POD SETUP</b> Kubelet asks the runtime to start Pods; the runtime invokes CNI for networking. Play the steps to see the details.</p>
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

function ComponentButton({ name, node, icon, selected, active, source, destination, onSelect }: { name: string; node?: number; icon: ReactNode; selected: string; active: boolean; source?: boolean; destination?: boolean; onSelect: (name: string) => void }) {
  return <button data-component={name} data-flow-id={node ? `${name}-${node}` : name} className={`architecture-component ${active ? 'component-active' : ''} ${source ? 'component-source' : ''} ${destination ? 'component-destination' : ''} ${selected === name ? 'component-selected' : ''}`} onClick={() => onSelect(name)} aria-pressed={selected === name}><span className="component-icon">{icon}</span><span className="component-label">{name}</span>{active && <i className="component-pulse"/>}</button>
}
