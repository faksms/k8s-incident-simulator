import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, ArrowDown, ArrowRight, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, Cloud, Container, Cuboid, Network, Play, RotateCcw, Server, ShieldCheck, Sparkles, Workflow } from 'lucide-react'

type Lesson = { title: string; subtitle: string; body: string; takeaway: string; interaction: string }
const lessons: Lesson[] = [
  { title: 'A cluster is a team of computers', subtitle: 'THE KUBERNETES CLUSTER', body: 'Kubernetes coordinates a group of machines so applications can keep running. The control plane makes decisions; worker nodes provide the compute where your app runs.', takeaway: 'Control plane = coordination. Nodes = capacity for your workloads.', interaction: 'Select a part of the cluster to learn what it does.' },
  { title: 'Pods are where containers run', subtitle: 'PODS & CONTAINERS', body: 'A Pod is Kubernetes’ smallest deployable unit. It wraps one or more tightly coupled containers and gives them shared networking and storage. Pods are replaceable; do not treat a Pod as a permanent machine.', takeaway: 'You usually manage Pods through a Deployment—not by hand.', interaction: 'Click the Pod or container to explore the relationship.' },
  { title: 'Deployments keep the desired number running', subtitle: 'DECLARATIVE WORKLOADS', body: 'You describe the desired state—such as three replicas—and a Deployment works to make reality match. If a Pod disappears, Kubernetes creates a replacement. A rollout updates the app in a controlled way.', takeaway: 'Desired state → controller reconciliation → healthy replicas.', interaction: 'Change the replica count and watch the Deployment respond.' },
  { title: 'Services give changing Pods a stable address', subtitle: 'SERVICE DISCOVERY', body: 'Pods can be replaced and their IPs change. A Service selects matching Pods by labels and provides a stable name and virtual IP. It routes traffic to ready endpoints.', takeaway: 'Labels connect Pods to Services; readiness determines eligible endpoints.', interaction: 'Send a request through the Service and watch it choose a ready Pod.' },
  { title: 'A request travels through the application', subtitle: 'PUTTING THE PIECES TOGETHER', body: 'External traffic commonly enters through an Ingress or Gateway, reaches a Service, and is sent to a ready Pod. Kubernetes provides the building blocks; your platform configuration defines the exact route.', takeaway: 'Ingress/Gateway → Service → ready Pod → container.', interaction: 'Play the request flow, then continue to hands-on incident practice.' },
]
const partInfo: Record<string, string> = {
  'Control plane': 'The API server, scheduler, and controllers coordinate the cluster and reconcile declared state.',
  'Worker node': 'A worker provides CPU, memory, networking, and a container runtime for Pods.',
  'Pod': 'The smallest Kubernetes workload unit. It can contain one or more containers that share network identity.',
  'Container': 'The running application process and its packaged dependencies, inside a Pod.',
  'Deployment': 'A controller that manages ReplicaSets and keeps the requested number of Pods available.',
  'Service': 'A stable network endpoint that selects Pods by labels and routes to ready endpoints.',
  'Ingress': 'An HTTP entry point that maps external host/path traffic to Services; it requires an ingress controller.',
}

export default function KubernetesCourse({ onComplete, onSkip }: { onComplete: () => void; onSkip: () => void }) {
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState('')
  const [replicas, setReplicas] = useState(3)
  const [request, setRequest] = useState(0)
  const [playing, setPlaying] = useState(false)
  const lesson = lessons[step]

  function next() {
    setSelected('')
    if (step === lessons.length - 1) { onComplete(); return }
    setStep(value => value + 1)
  }
  function previous() { setSelected(''); setStep(value => Math.max(0, value - 1)) }
  function playFlow() {
    if (playing) return
    setPlaying(true)
    setRequest(value => value + 1)
    window.setTimeout(() => setPlaying(false), 1800)
  }

  return <main className="course-page">
    <header className="course-header"><a className="course-brand" href="#course" onClick={event => event.preventDefault()}><span className="course-logo"><Cloud size={19}/></span><span><b>Kubernetes, visually</b><small>INTERACTIVE FOUNDATIONS</small></span></a><div className="course-progress-label">FOUNDATIONS <b>{step + 1} / {lessons.length}</b></div><button className="course-skip" onClick={onSkip}>Skip to incident exercises <ArrowRight size={15}/></button></header>
    <div className="course-shell">
      <nav className="course-steps" aria-label="Kubernetes foundations lessons">{lessons.map((item, index) => <button key={item.title} onClick={() => { setStep(index); setSelected('') }} className={`course-step ${step === index ? 'active' : ''} ${index < step ? 'done' : ''}`}><span>{index < step ? <CheckCircle2 size={16}/> : index + 1}</span><b>{item.title}</b></button>)}</nav>
      <section className="lesson-area">
        <div className="lesson-copy"><p className="course-kicker"><Sparkles size={14}/>{lesson.subtitle}</p><h1>{lesson.title}</h1><p className="lesson-description">{lesson.body}</p><div className="learning-takeaway"><BookOpen size={18}/><span><b>Remember</b>{lesson.takeaway}</span></div><div className="lesson-instruction"><CircleHelp size={17}/>{lesson.interaction}</div>{selected && <motion.div className="component-explanation" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}><b>{selected}</b><p>{partInfo[selected]}</p></motion.div>}</div>
        <div className="visual-card"><div className="visual-top"><span><Activity size={15}/> INTERACTIVE MODEL</span><span className="demo-badge">SIMULATION</span></div>
          <AnimatePresence mode="wait"><motion.div key={step} className={`lesson-visual visual-${step}`} initial={{opacity:0,x:14}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-14}} transition={{duration:.22}}>
            {step === 0 && <div className="cluster-model"><InteractiveNode name="Control plane" icon={<Cloud/>} onClick={setSelected} selected={selected}/><div className="model-connector vertical"><i/></div><div className="worker-row"><InteractiveNode name="Worker node" icon={<Server/>} onClick={setSelected} selected={selected}/><InteractiveNode name="Worker node" icon={<Server/>} onClick={setSelected} selected={selected}/></div><div className="model-caption">One control plane coordinates the worker nodes</div></div>}
            {step === 1 && <div className="pod-model"><InteractiveNode name="Worker node" icon={<Server/>} onClick={setSelected} selected={selected}/><div className="pod-boundary"><span className="boundary-label">POD</span><InteractiveNode name="Pod" icon={<Cuboid/>} onClick={setSelected} selected={selected}/><div className="container-inside"><InteractiveNode name="Container" icon={<Container/>} onClick={setSelected} selected={selected}/></div></div><div className="model-caption">A Pod wraps the container and provides its shared runtime context</div></div>}
            {step === 2 && <div className="deployment-model"><button className="replica-control" onClick={() => setReplicas(value => Math.max(1, value - 1))} aria-label="Decrease replicas">−</button><div className="deployment-hub"><Workflow size={25}/><b>Deployment</b><small>desired: {replicas} replicas</small></div><button className="replica-control" onClick={() => setReplicas(value => Math.min(5, value + 1))} aria-label="Increase replicas">+</button><div className="replica-line"/><div className="replica-pods">{Array.from({length: replicas}, (_, i) => <motion.div layout key={i} className="replica-pod"><Cuboid size={19}/><span>Pod {i + 1}</span><small>Ready</small></motion.div>)}</div><div className="model-caption">Use + / − to change desired replicas. The controller reconciles the Pod count.</div></div>}
            {step === 3 && <div className="service-model"><div className="service-source"><span>CLIENT</span><div className="client-node"><Network size={20}/><b>Request</b></div></div><div className="service-connector"><i className={request ? 'flowing' : ''}/><ArrowRight size={17}/></div><button className="service-hub" onClick={() => setSelected('Service')}><Activity size={22}/><b>Service</b><small>stable address</small></button><div className="service-fan"><i/><i/><i/></div><div className="service-pods">{[1, 2, 3].map((n) => <div key={n} className={`service-pod ${n === 2 ? 'not-ready' : ''}`}><Cuboid size={17}/><span>Pod {n}</span><small>{n === 2 ? 'Not ready' : 'Ready endpoint'}</small></div>)}</div>{request > 0 && <motion.div key={request} className="request-packet" initial={{left:'8%',top:'43%',opacity:0}} animate={{left:'74%',top:request % 2 ? '26%' : '70%',opacity:[0,1,1,0]}} transition={{duration:1.5}}/>}<div className="model-caption">The Service only routes to ready endpoints selected by matching labels</div></div>}
            {step === 4 && <div className="flow-model"><div className="flow-nodes"><FlowNode label="User" icon={<Network/>}/><FlowArrow active={playing}/><button className="flow-node" onClick={() => setSelected('Ingress')}><Cloud/><b>Ingress</b><small>HTTP entry</small></button><FlowArrow active={playing}/><button className="flow-node" onClick={() => setSelected('Service')}><Activity/><b>Service</b><small>stable route</small></button><FlowArrow active={playing}/><FlowNode label="Ready Pod" icon={<Cuboid/>}/></div>{playing && <motion.div className="flow-packet" initial={{left:'4%'}} animate={{left:'91%'}} transition={{duration:1.35,ease:'easeInOut'}}/>}<button className="play-flow" onClick={playFlow} disabled={playing}><Play size={16} fill="currentColor"/>{playing ? 'Request in flight…' : 'Play request flow'}</button><div className="model-caption">This is a common pattern; Gateway API or platform-specific routing may differ</div></div>}
          </motion.div></AnimatePresence>
          {step === 3 && <button className="visual-action" onClick={playFlow} disabled={playing}><Play size={14}/> {playing ? 'Request in flight…' : 'Send a test request'}</button>}
          <div className="visual-footer"><span><span className="legend-dot"/> Kubernetes concept</span><button onClick={() => { setSelected(''); setRequest(0); setReplicas(3) }}><RotateCcw size={13}/> Reset model</button></div>
        </div>
      </section>
      <footer className="course-footer"><button className="course-back" onClick={previous} disabled={step === 0}><ChevronLeft size={17}/> Previous</button><span>Lesson {step + 1} of {lessons.length}</span><button className="course-next" onClick={next}>{step === lessons.length - 1 ? 'Start incident exercises' : 'Next concept'} <ChevronRight size={17}/></button></footer>
      <p className="course-safety"><ShieldCheck size={14}/> Learning sandbox: interactive diagrams only—nothing connects to a real cluster.</p>
    </div>
  </main>
}

function InteractiveNode({ name, icon, onClick, selected }: { name: string; icon: React.ReactNode; onClick: (name: string) => void; selected: string }) {
  return <button onClick={() => onClick(name)} className={`interactive-node ${selected === name ? 'picked' : ''}`}>{icon}<b>{name}</b><small>Click to explore</small></button>
}
function FlowNode({ label, icon }: { label: string; icon: React.ReactNode }) { return <div className="flow-node">{icon}<b>{label}</b></div> }
function FlowArrow({ active }: { active: boolean }) { return <span className={`flow-arrow ${active ? 'active' : ''}`}><ArrowRight size={19}/></span> }
