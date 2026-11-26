import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Activity, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, Cloud, Code2, Container, Network, Pause, Play, RotateCcw, ShieldCheck } from 'lucide-react'
import LessonCoach from './lessons/LessonCoach'
import StepSequenceControls from './lessons/StepSequenceControls'
import LearningMaterials from './LearningMaterials'
import ArchitectureExperiment from './ArchitectureExperiment'
import { pathSegments, routeBetween } from './architectureRouting'
import type { RoutingPort, RoutingRect, RoutingSegment } from './architectureRouting'
import './ClusterArchitecture.css'
import './ArchitectureReadability.css'

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
  { title: 'Describe what you want', route: ['kubectl', 'API server'], description: 'You send an app configuration file to the API server. It checks who you are, your access, and the request.' },
  { title: 'Save the configuration', route: ['API server', 'etcd'], description: 'The API server saves the accepted configuration in etcd. etcd keeps this cluster information so the control plane can remember it.' },
  { title: 'Work toward the goal', route: ['controller manager', 'API server'], description: 'Controllers compare what you asked for with what is running. They create or update objects to bring the two closer together.' },
  { title: 'Choose a node', route: ['scheduler', 'API server', 'kubelet'], description: 'The scheduler checks which nodes can run the Pod, chooses one, and records the choice through the API server.' },
  { title: 'Start the Pod', route: ['kubelet', 'CRI runtime', 'CNI networking', 'Pod'], description: 'The kubelet asks the container runtime to start the Pod. The runtime calls a network plugin to set up its network.' },
  { title: 'Report health', route: ['kubelet', 'API server', 'controller manager'], description: 'The kubelet reports the Pod’s status and health check results. Controllers use this information to decide what to do next.' },
  { title: 'Send traffic to the app', route: ['client', 'Service dataplane', 'ready Pod'], description: 'A Service forwards app traffic to a ready Pod. This traffic is separate from the control plane’s work to manage the cluster.' },
]

type CommunicationLeg = { from: string; to: string; label: string }

const communicationFlows: CommunicationLeg[][] = [
  [{ from: 'kubectl', to: 'API server', label: 'kubectl sends the app configuration to the API server' }],
  [{ from: 'API server', to: 'etcd', label: 'the API server saves the accepted configuration in etcd' }],
  [{ from: 'Controller manager', to: 'API server', label: 'controllers check and update objects through the API server' }],
  [{ from: 'Scheduler', to: 'API server', label: 'the scheduler records the chosen node for the Pod' }],
  [{ from: 'kubelet', to: 'API server', label: 'kubelet watches the API server for its assigned Pod' }, { from: 'kubelet', to: 'CRI runtime', label: 'kubelet asks the runtime to start the Pod' }, { from: 'CRI runtime', to: 'CNI networking', label: 'the runtime invokes CNI to configure Pod networking' }, { from: 'CNI networking', to: 'Pod app-1', label: 'CNI configures networking for Pod app-1' }, { from: 'CRI runtime', to: 'Pod app-1', label: 'the runtime starts the containers in Pod app-1' }],
  [{ from: 'Pod app-1', to: 'kubelet', label: 'Pod app-1 reports status to kubelet' }, { from: 'kubelet', to: 'API server', label: 'kubelet reports health to the API server' }],
  [{ from: 'Client', to: 'kube-proxy / eBPF', label: 'the client sends traffic to the Service address' }, { from: 'kube-proxy / eBPF', to: 'Pod app-1', label: 'Service traffic reaches Pod app-1' }],
]

const componentInfo: Record<string, string> = {
  'kubectl': 'The command-line tool for Kubernetes. It sends requests to the API server, not directly to Pods or etcd.',
  'API server': 'The front door for managing Kubernetes. It checks identity, access, and requests before accepting changes.',
  'etcd': 'The cluster’s key-value database. It stores cluster configuration and state so the control plane can remember them. The API server accesses it directly.',
  'Scheduler': 'Finds Pods that need a node, checks their requirements and available space, then records its choice through the API server.',
  'Controller manager': 'Runs controllers that compare what you requested with what is running and work to close the gap.',
  'Cloud controller': 'An optional component that connects Kubernetes to cloud features such as load balancers and node information.',
  'kubelet': 'An agent on each node. It watches for Pods assigned to that node, works with the runtime to start them, and reports their status.',
  'kube-proxy / eBPF': 'Helps send Service traffic to a suitable Pod. Some clusters use eBPF instead of kube-proxy.',
  'CRI runtime': 'Software such as containerd or CRI-O that runs containers. The kubelet talks to it through the Container Runtime Interface (CRI).',
  'CNI networking': 'A network plugin that sets up Pod addresses and connections.',
  'Pod': 'A group of one or more containers placed together on one node, with its own Pod IP.',
  'Service dataplane': 'The network forwarding that sends traffic from a Service address to a ready endpoint. This traffic does not pass through etcd.',
  'Client': 'An app that sends traffic to a Service address. Service forwarding then sends it to a ready endpoint.',
}

export default function ClusterArchitecture({ onComplete, onPractical, onDashboard, passed, onPass, trackName }: { onComplete: () => void; onPractical: () => void; onDashboard: () => void; passed: boolean; onPass: () => void; trackName?: string }) {
  const reducedMotion = useReducedMotion()
  const [phase, setPhase] = useState(0)
  const [playing, setPlaying] = useState(() => !reducedMotion)
  const [selected, setSelected] = useState('')
  const [diagramView, setDiagramView] = useState<'experiment' | 'map'>('experiment')
  const [legIndex, setLegIndex] = useState(0)
  const mapRef = useRef<HTMLDivElement>(null)
  const [flowGeometry, setFlowGeometry] = useState<{ width:number; height:number; path:string; color:string }>({ width:0, height:0, path:'', color:'#34d399' })
  const [topologyGeometry, setTopologyGeometry] = useState<{ width:number; height:number; lines:Array<{d:string; from:string; to:string; data:boolean}> }>({ width:0, height:0, lines:[] })
  const current = phases[phase]
  const flow = communicationFlows[phase]
  const activeLeg = flow[legIndex]
  const stepColor = phase === 5 ? '#fbbf24' : phase === 4 || phase === 6 ? '#38bdf8' : '#34d399'

  useEffect(() => {
    if (reducedMotion) setPlaying(false)
  }, [reducedMotion])

  useEffect(() => {
    if (diagramView !== 'map') return
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
  }, [phase, legIndex, stepColor, diagramView])

  useEffect(() => {
    if (!playing || diagramView !== 'map') return
    const timer = window.setTimeout(() => {
      if (legIndex < flow.length - 1) {
        setLegIndex(value => value + 1)
        return
      }
      if (phase >= phases.length - 1) {
        setPhase(0)
        setLegIndex(0)
        return
      }
      setPhase(value => value + 1)
      setLegIndex(0)
    }, 1400)
    return () => window.clearTimeout(timer)
  }, [playing, phase, legIndex, flow.length, diagramView])

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
  const workloadDetail: Record<string, string> = {
    'NOT CREATED': 'Waiting for workload object',
    'REPLICASET CREATING': 'Controller creating replicas',
    'POD SCHEDULING': 'Waiting for node assignment',
    'CONTAINER STARTING': 'Starting container',
    'READY': 'Ready for traffic',
  }

  return <main className="architecture-page">
    <header className="architecture-header">
      <div className="architecture-brand"><span className="architecture-mark"><Cloud size={20}/></span><span><b>Kubernetes, visually</b><small>CLUSTER CONTROL &amp; DATA PATHS</small></span></div>
      <div className="architecture-header-note"><span className="live-dot"/> SIMULATED CLUSTER</div>
      <button className="architecture-skip" onClick={onComplete}>Browse lessons &amp; topic index <ArrowRight size={16}/></button>
    </header>

    <div className="architecture-shell">
      <section className="architecture-intro">
        <div><p className="architecture-kicker">START HERE · 01 / CLUSTER ARCHITECTURE</p><h1>Learn Kubernetes<br/><em>one step at a time.</em></h1><p className="architecture-lede">Kubernetes helps run and manage containerized applications across computers. Start with the map below, then explore Pods, networking, and hands-on incidents. No cluster setup is needed.</p>{trackName && <p className="architecture-lede">Learning path: <strong>{trackName}</strong>. Continue to the next topic in this path when you are ready.</p>}</div>
        <div className="architecture-legend"><span><i className="legend-control"/> CONTROL PLANE</span><span><i className="legend-data"/> DATA PLANE</span><span><i className="legend-state"/> STATE / STATUS</span></div>
      </section>

      <section className="beginner-guide" aria-label="Getting started">
        <div><b>First, the basics</b><p>A <strong>container</strong> packages an application. A <strong>Pod</strong> is the unit Kubernetes runs; a <strong>node</strong> is a computer that runs Pods. A <strong>cluster</strong> is the group of computers managed together.</p></div>
        <div><b>How to learn here</b><p>Try the cluster experiment, or switch to the workflow map to follow its steps. Select components to learn what they do, then try the knowledge check below.</p><div className="architecture-learning-actions"><button className="architecture-skip" onClick={onDashboard}>Explore learning paths <ArrowRight size={16}/></button><button className="architecture-skip" onClick={onPractical}>Try the simulated terminal lab <ArrowRight size={16}/></button></div></div>
      </section>

      <div className="architecture-view-switch" aria-label="Architecture view"><button type="button" aria-pressed={diagramView === 'experiment'} onClick={() => setDiagramView('experiment')}>Cluster experiment</button><button type="button" aria-pressed={diagramView === 'map'} onClick={() => setDiagramView('map')}>Workflow map</button></div>
      <div hidden={diagramView !== 'experiment'}><ArchitectureExperiment/></div>
      <section className="architecture-board" aria-label="Interactive Kubernetes architecture diagram" hidden={diagramView !== 'map'}>
        <div className="board-topline"><span><Activity size={15}/> INTERACTIVE CLUSTER MAP</span><span>DOTTED: CONNECTIONS <span aria-hidden="true">·</span> SOLID: CURRENT STEP</span></div>
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
            <div className="plane-heading"><div><KubernetesIcon src={kubernetesIcons.controlPlane}/><b>CONTROL PLANE</b></div><small>MANAGES THE CLUSTER</small></div>
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
            <div className="plane-heading"><div><KubernetesIcon src={kubernetesIcons.node}/><b>WORKER NODES</b></div><small>RUN YOUR APPLICATIONS</small></div>
            <div className="worker-grid">
              {[0, 1].map(node => <section className="worker-node" key={node}>
                <div className="worker-title"><KubernetesIcon src={kubernetesIcons.node}/><b>NODE 0{node + 1}</b><span>HEALTHY</span></div>
                <div className="node-components">
                  <ComponentButton node={node + 1} name="kubelet" icon={<KubernetesIcon src={kubernetesIcons.kubelet}/>} selected={selected} active={node === 0 && isActive('kubelet')} source={node === 0 && isSource('kubelet')} destination={node === 0 && isDestination('kubelet')} onSelect={setSelected}/>
                  <ComponentButton node={node + 1} name="kube-proxy / eBPF" icon={<KubernetesIcon src={kubernetesIcons.proxy}/>} selected={selected} active={node === 0 && isActive('kube-proxy / eBPF')} source={node === 0 && isSource('kube-proxy / eBPF')} destination={node === 0 && isDestination('kube-proxy / eBPF')} onSelect={setSelected}/>
                  <ComponentButton node={node + 1} name="CRI runtime" icon={<Container/>} selected={selected} active={node === 0 && isActive('CRI runtime')} source={node === 0 && isSource('CRI runtime')} destination={node === 0 && isDestination('CRI runtime')} onSelect={setSelected}/>
                  <ComponentButton node={node + 1} name="CNI networking" icon={<Network/>} selected={selected} active={node === 0 && isActive('CNI networking')} source={node === 0 && isSource('CNI networking')} destination={node === 0 && isDestination('CNI networking')} onSelect={setSelected}/>
                </div>
                <button data-component={`Pod app-${node + 1}`} data-flow-id={`Pod app-${node + 1}`} className={`workload-pod workload-${workloadState.toLowerCase().replace(/ /g, '-')} ${isActive('Pod app-1') && node === 0 ? 'component-active' : ''}`} onClick={() => setSelected('Pod')} aria-label={`Pod lifecycle state: ${workloadState}`}><KubernetesIcon src={kubernetesIcons.pod}/><span><b>{phase >= 2 ? `Pod · app-${node + 1}` : 'Pod · not created'}</b><small>{workloadDetail[workloadState]}</small></span><span className="pod-health">{workloadState}</span></button>
              </section>)}
            </div>
          </section>
        </div>

        <div className="topology-explainer">
          <p><b>CONTROL</b> kubectl, the scheduler, controllers and kubelets use the API server; only the API server accesses etcd.</p>
          <p><b>TRAFFIC</b> Client → Service forwarding (kube-proxy / eBPF) → ready Pod. Packets do not pass through the API server.</p>
          <p><b>POD SETUP</b> Kubelet asks the runtime to start Pods. The runtime calls a CNI plugin to set up networking. Pause or select a step to look more closely.</p>
        </div>
        <div className="communication-section" aria-live={playing ? 'off' : 'polite'}>
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

      <div className="architecture-map-details" hidden={diagramView !== 'map'}><LessonCoach task="Select the component that forwards Service traffic to a ready Pod." hint="Look on a worker node for kube-proxy / eBPF. It implements Service forwarding in the data plane; the API server stores configuration but does not carry application packets." complete={selected==='kube-proxy / eBPF'} success="Correct: Service forwarding is performed by the cluster data plane, not by etcd or the API server."/>
      <div className="architecture-bottom">
        <div className="component-inspector"><CircleHelp size={17}/><span>{selected ? <><b>{selected}</b>{componentInfo[selected] ?? 'A component that helps manage or run the cluster.'}</> : 'Select a component in the map to learn what it does.'}</span></div>
        <div className="architecture-principle"><ShieldCheck size={16}/><span><b>Important boundary</b> Control traffic goes through the API server. Service packets are data-plane traffic; they do not pass through etcd.</span></div>
      </div>
      </div>
      <LearningMaterials lessonId="architecture" passed={passed} onPass={onPass}/>
      <footer className="architecture-footer"><span>INTERACTIVE SYSTEMS EXPLAINED · KUBERNETES ARCHITECTURE</span><button onClick={onComplete}>Continue to interactive foundations <ChevronRight size={16}/></button></footer>
    </div>
  </main>
}

function ComponentButton({ name, node, icon, selected, active, source, destination, onSelect }: { name: string; node?: number; icon: ReactNode; selected: string; active: boolean; source?: boolean; destination?: boolean; onSelect: (name: string) => void }) {
  return <button data-component={name} data-flow-id={node ? `${name}-${node}` : name} className={`architecture-component ${active ? 'component-active' : ''} ${source ? 'component-source' : ''} ${destination ? 'component-destination' : ''} ${selected === name ? 'component-selected' : ''}`} onClick={() => onSelect(name)} aria-pressed={selected === name}><span className="component-icon">{icon}</span><span className="component-label">{name}</span>{active && <i className="component-pulse"/>}</button>
}
