import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, ArrowRight, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, Cloud, Container, Cuboid, Network, Pause, Play, RotateCcw, Server, ShieldCheck, Sparkles, Workflow } from 'lucide-react'

type Lesson = { title:string; subtitle:string; body:string; takeaway:string; interaction:string }
const lessons:Lesson[] = [
  {title:'A cluster is a team of computers',subtitle:'01 · CLUSTER ARCHITECTURE',body:'A Kubernetes cluster coordinates machines as one system. The control plane makes decisions; worker nodes provide the compute where your workloads run.',takeaway:'The control plane coordinates. Worker nodes execute.',interaction:'Select a component to reveal its responsibility.'},
  {title:'Pods are where containers run',subtitle:'02 · THE POD ABSTRACTION',body:'A Pod is the smallest deployable unit. Containers inside one Pod share networking and lifecycle. Pods are replaceable; they are not permanent machines.',takeaway:'A Pod is a wrapper around one or more tightly related containers.',interaction:'Explore how a Pod relates to its node and container.'},
  {title:'Deployments maintain desired state',subtitle:'03 · RECONCILIATION',body:'Declare the number of replicas you want. The Deployment controller continually compares desired and observed state, then creates or removes Pods to converge.',takeaway:'Desired state → reconciliation loop → running replicas.',interaction:'Change the replica target and watch the controller converge.'},
  {title:'Services route to ready Pods',subtitle:'04 · DISCOVERY & ENDPOINTS',body:'A Service gives clients a stable name and virtual address. Label selectors find matching Pods; readiness determines which Pods are eligible endpoints.',takeaway:'A matching Pod only receives Service traffic when it is Ready.',interaction:'Toggle Pod readiness, then send a request through the Service.'},
  {title:'Follow a request through the cluster',subtitle:'05 · TRAFFIC FLOW',body:'External traffic commonly enters through an Ingress or Gateway, reaches a Service, and is routed to a ready Pod. Each hop is a separate resource and responsibility.',takeaway:'Ingress or Gateway → Service → ready Pod → container.',interaction:'Play the request flow and follow the moving packet.'},
  {title:'Spread replicas across failure domains',subtitle:'06 · RESILIENCE & SCHEDULING',body:'Topology spread constraints influence where the scheduler places matching Pods across zones or nodes. Balanced placement reduces the chance that one failure domain takes every replica down.',takeaway:'maxSkew limits imbalance; topologyKey defines the domain; whenUnsatisfiable decides the trade-off.',interaction:'Play the placement sequence, take a zone offline, and compare scheduling policies.'},
]
const details:Record<string,string> = {
  'Control plane':'The API server, scheduler, and controllers coordinate cluster state and reconcile declared intent.',
  'Worker node':'Provides compute, storage, networking, and a container runtime for Pods.',
  'Pod':'The smallest deployable unit. Its containers share network identity and lifecycle.',
  'Container':'Runs the application process and its packaged dependencies inside a Pod.',
  'Deployment':'Manages ReplicaSets and keeps the desired number of Pods running through reconciliation.',
  'Service':'Provides a stable virtual address and routes traffic to matching, ready endpoints.',
  'Ingress':'An HTTP routing resource. It requires an Ingress controller to implement the rules.',
}
const sceneCaptions = ['Six replicas begin in one zone: a single zone failure could remove the whole workload.','The scheduler places new replicas across zones while respecting the selected spread policy.','Zone B fails. Its Pods are unavailable; surviving replicas continue serving.','Replacement Pods are scheduled into healthy zones when the policy and available capacity permit.']

export default function KubernetesCourse({onComplete,onSkip}:{onComplete:()=>void;onSkip:()=>void}) {
  const [step,setStep] = useState(0)
  const [selected,setSelected] = useState('')
  const [replicas,setReplicas] = useState(3)
  const [ready,setReady] = useState([true,true,true])
  const [packet,setPacket] = useState(0)
  const [playing,setPlaying] = useState(false)
  const [spreadScene,setSpreadScene] = useState(0)
  const [zoneBAvailable,setZoneBAvailable] = useState(true)
  const [policy,setPolicy] = useState<'DoNotSchedule'|'ScheduleAnyway'>('DoNotSchedule')
  const lesson = lessons[step]

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setSpreadScene(scene => {
        if (scene >= sceneCaptions.length - 1) { setPlaying(false); return scene }
        return scene + 1
      })
    }, 1900)
    return () => window.clearInterval(timer)
  }, [playing])

  function next() { setSelected(''); if (step === lessons.length - 1) { onComplete(); return } setStep(v => v + 1) }
  function previous() { setSelected(''); setStep(v => Math.max(0, v - 1)) }
  function sendPacket() { if (playing) return; setPacket(v => v + 1); setPlaying(true); if (step !== 5) window.setTimeout(() => setPlaying(false), 1500) }
  function togglePod(index:number) { setReady(v => v.map((value,i) => i === index ? !value : value)) }
  function resetSpread() { setPlaying(false); setSpreadScene(0); setZoneBAvailable(true); setPolicy('DoNotSchedule') }

  return <main className="course-page">
    <header className="course-header"><div className="course-brand"><span className="course-logo"><Cloud size={19}/></span><span><b>Kubernetes, visually</b><small>INTERACTIVE FOUNDATIONS · FIELD NOTES</small></span></div><div className="course-progress-label">FOUNDATIONS <b>{String(step + 1).padStart(2,'0')} / {lessons.length}</b></div><button className="course-skip" onClick={onSkip}>Skip to incident exercises <ArrowRight size={15}/></button></header>
    <div className="course-shell">
      <nav className="course-steps" aria-label="Kubernetes foundation lessons">{lessons.map((item,index)=><button key={item.title} className={`course-step ${step === index ? 'active' : ''} ${index < step ? 'done' : ''}`} onClick={() => {setStep(index);setSelected('')}}><span>{index < step ? <CheckCircle2 size={15}/> : String(index + 1).padStart(2,'0')}</span><b>{item.title}</b></button>)}</nav>
      <section className="lesson-area">
        <div className="lesson-copy"><p className="course-kicker"><Sparkles size={14}/>{lesson.subtitle}</p><h1>{lesson.title}</h1><p className="lesson-description">{lesson.body}</p><div className="learning-takeaway"><BookOpen size={18}/><span><b>CORE IDEA</b>{lesson.takeaway}</span></div><div className="lesson-instruction"><CircleHelp size={17}/>{lesson.interaction}</div><AnimatePresence>{selected && <motion.div className="component-explanation" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}}><b>{selected}</b><p>{details[selected] ?? 'A Kubernetes scheduling policy that shapes workload placement across infrastructure failure domains.'}</p></motion.div>}</AnimatePresence></div>
        <div className={`visual-card ${step === 5 ? 'cinematic-card' : ''}`}>
          <div className="visual-top"><span><Activity size={15}/> SYSTEMS / EXPLAINED</span><span className="demo-badge">K8S · {String(step + 1).padStart(2,'0')}</span></div>
          <AnimatePresence mode="wait"><motion.div key={step} className="lesson-visual" initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-16}} transition={{duration:.25}}>
            {step === 0 && <div className="cluster-model"><InteractiveNode name="Control plane" sub="Decide & coordinate" icon={<Cloud/>} onClick={setSelected}/><div className="vertical-link"><span/><span/><span/></div><div className="worker-row"><InteractiveNode name="Worker node" sub="Run workloads" icon={<Server/>} onClick={setSelected}/><InteractiveNode name="Worker node" sub="Run workloads" icon={<Server/>} onClick={setSelected}/></div><div className="model-caption">The control plane coordinates capacity across worker nodes.</div></div>}
            {step === 1 && <div className="pod-model"><InteractiveNode name="Worker node" sub="Compute host" icon={<Server/>} onClick={setSelected}/><div className="pod-boundary"><span className="boundary-label">POD SANDBOX</span><InteractiveNode name="Pod" sub="Shared network identity" icon={<Cuboid/>} onClick={setSelected}/><div className="container-inside"><InteractiveNode name="Container" sub="Application process" icon={<Container/>} onClick={setSelected}/></div></div><div className="model-caption">A Pod is scheduled as one unit onto a worker node.</div></div>}
            {step === 2 && <div className="deployment-model"><button className="replica-control" onClick={() => setReplicas(v => Math.max(1,v-1))} aria-label="Decrease desired replicas">−</button><button className="deployment-hub" onClick={() => setSelected('Deployment')}><Workflow/><b>Deployment</b><small>desired replicas: {replicas}</small></button><button className="replica-control" onClick={() => setReplicas(v => Math.min(5,v+1))} aria-label="Increase desired replicas">+</button><div className="replica-line"><span/></div><div className="replica-pods">{Array.from({length:replicas},(_,i)=><motion.div layout key={i} className="replica-pod" initial={{scale:.7,opacity:0}} animate={{scale:1,opacity:1}}><Cuboid size={19}/><span>Pod {String(i+1).padStart(2,'0')}</span><small>READY</small></motion.div>)}</div><div className="model-caption">Change desired state; the controller works to reconcile the observed state.</div></div>}
            {step === 3 && <div className="service-demo"><div className="service-client"><Network/><b>CLIENT</b><small>request</small></div><div className="service-route"><span className="route-base"/><motion.div key={packet} className="packet packet-service" animate={packet ? {x:[0,82,82],opacity:[0,1,0]} : {}} transition={{duration:1.5}}/></div><button className="service-hub" onClick={() => setSelected('Service')}><Activity/><b>Service</b><small>stable address</small></button><div className="pod-fan">{ready.map((_,i)=><i key={i}/>)}</div><div className="service-pods">{ready.map((isReady,i)=><button key={i} className={`service-pod ${isReady?'':'not-ready'}`} onClick={() => togglePod(i)}><Cuboid/><b>Pod {String(i+1).padStart(2,'0')}</b><small>{isReady?'Ready endpoint':'Not Ready'}</small><span>{isReady?'IN ROTATION':'OUT OF ROTATION'}</span></button>)}</div>{packet > 0 && <div className="route-result">{ready.some(Boolean)?'Request routed to a Ready endpoint':'No Ready endpoints — request fails'}</div>}</div>}
            {step === 4 && <div className="flow-demo"><InteractiveNode name="User" sub="HTTPS request" icon={<Network/>} onClick={setSelected}/><FlowArrow active={playing}/><InteractiveNode name="Ingress" sub="Host & path rule" icon={<Cloud/>} onClick={setSelected}/><FlowArrow active={playing}/><InteractiveNode name="Service" sub="Stable endpoint" icon={<Activity/>} onClick={setSelected}/><FlowArrow active={playing}/><InteractiveNode name="Ready Pod" sub="Application" icon={<Cuboid/>} onClick={setSelected}/>{playing && <motion.div className="packet packet-flow" initial={{left:'5%'}} animate={{left:'92%'}} transition={{duration:1.5}}/>}<div className="model-caption">Routing is composed from separate Kubernetes resources.</div></div>}
            {step === 5 && <TopologySpreadScene scene={spreadScene} zoneBAvailable={zoneBAvailable} policy={policy} setPolicy={setPolicy} onToggleZone={() => setZoneBAvailable(v => !v)} onSelect={setSelected}/>}
          </motion.div></AnimatePresence>
          <div className="scene-controls">
            {step === 2 && <button onClick={() => setReplicas(3)}><RotateCcw size={14}/> Reset replicas</button>}
            {(step === 3 || step === 4) && <button onClick={sendPacket} disabled={playing}><Play size={14}/>{playing ? 'Packet in flight…' : step === 3 ? 'Send test request' : 'Play request flow'}</button>}
            {step === 5 && <><button onClick={() => setPlaying(v => !v)}>{playing ? <Pause size={14}/> : <Play size={14}/>} {playing ? 'Pause' : 'Play sequence'}</button><button onClick={resetSpread}><RotateCcw size={14}/> Replay</button><span>STEP {spreadScene + 1} OF {sceneCaptions.length}</span></>}
          </div>
          <div className="visual-footer"><span><span className="legend-dot"/> SIMULATED CLUSTER</span><button onClick={() => {setSelected('');setReplicas(3);setReady([true,true,true]);setPacket(0);resetSpread()}}><RotateCcw size={13}/> Reset model</button></div>
        </div>
      </section>
      <footer className="course-footer"><button className="course-back" onClick={previous} disabled={step === 0}><ChevronLeft size={17}/> Previous</button><span>LESSON {String(step+1).padStart(2,'0')} / {String(lessons.length).padStart(2,'0')}</span><button className="course-next" onClick={next}>{step === lessons.length-1 ? 'Start incident exercises' : 'Next concept'} <ChevronRight size={17}/></button></footer>
      <p className="course-safety"><ShieldCheck size={14}/> Interactive training simulation · no connection to a real cluster.</p>
    </div>
  </main>
}

function InteractiveNode({name,sub,icon,onClick}:{name:string;sub:string;icon:React.ReactNode;onClick:(name:string)=>void}) { return <button className="interactive-node" onClick={() => onClick(name)}>{icon}<b>{name}</b><small>{sub}</small></button> }
function FlowArrow({active}:{active:boolean}) { return <span className={`flow-arrow ${active?'active':''}`}><ArrowRight size={18}/></span> }

function TopologySpreadScene({scene,zoneBAvailable,policy,setPolicy,onToggleZone,onSelect}:{scene:number;zoneBAvailable:boolean;policy:'DoNotSchedule'|'ScheduleAnyway';setPolicy:(value:'DoNotSchedule'|'ScheduleAnyway')=>void;onToggleZone:()=>void;onSelect:(name:string)=>void}) {
  const zonePods = scene === 0 ? [[1,2,3,4,5,6],[],[]] : scene === 1 ? [[1,2],[3,4],[5,6]] : scene === 2 ? [[1,2],[],[5,6]] : [[1,2,3],[4],[5,6]]
  const zoneNames = ['Zone A','Zone B','Zone C']
  const zoneIds = ['eu-west-1a','eu-west-1b','eu-west-1c']
  return <div className="spread-scene">
    <div className="spread-headline"><span>{sceneCaptions[scene]}</span><b>“Keep replicas apart. Keep the service resilient.”</b></div>
    <div className="spread-config"><div><small>PLACEMENT POLICY</small><strong>maxSkew: 1 <i/> topologyKey: zone</strong></div><label htmlFor="spread-policy">whenUnsatisfiable</label><select id="spread-policy" value={policy} onChange={event => setPolicy(event.target.value as 'DoNotSchedule'|'ScheduleAnyway')}><option value="DoNotSchedule">DoNotSchedule · strict</option><option value="ScheduleAnyway">ScheduleAnyway · best effort</option></select></div>
    <div className="zone-grid">{zoneNames.map((name,index)=>{
      const available = index !== 1 || zoneBAvailable
      const pods = zonePods[index]
      const pending = scene === 3 && index === 1 && !zoneBAvailable && policy === 'DoNotSchedule'
      return <section className={`zone-card ${!available?'zone-offline':''}`} key={name}><header><span>{name.toUpperCase()}</span><i className={available?'online':'offline'}/></header><small className="zone-id">{zoneIds[index]}</small><div className="zone-capacity">{available ? 'NODE POOL · HEALTHY' : 'ZONE UNAVAILABLE'}</div><div className="zone-pods">{pods.map((pod,podIndex)=><motion.div layout key={pod} className="zone-pod" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:podIndex*.08}} onClick={() => onSelect('Pod')}><span>pod-{String(pod).padStart(2,'0')}</span><i/></motion.div>)}{pending&&<motion.div className="zone-pod pending" initial={{opacity:0}} animate={{opacity:1}}><span>pod-07 · Pending</span><i/></motion.div>}</div><div className="zone-count">{pods.length} {pods.length===1?'REPLICA':'REPLICAS'}{pending?' · 1 PENDING':''}</div></section>
    })}</div>
    <div className="spread-bottom"><button className={`zone-failure ${!zoneBAvailable?'restore':''}`} onClick={onToggleZone}>{zoneBAvailable?'Simulate Zone B failure':'Restore Zone B'}</button><div className="spread-status"><CheckCircle2 size={15}/>{scene === 2 ? 'Surviving zones still host replicas' : scene === 3 && !zoneBAvailable && policy === 'DoNotSchedule' ? 'Strict policy leaves replacement Pending' : 'Placement is distributed across failure domains'}</div></div>
    <div className="spread-caption"><span>TOPOLOGY SPREAD</span><span>{String(scene+1).padStart(2,'0')} / 04</span></div>
  </div>
}
