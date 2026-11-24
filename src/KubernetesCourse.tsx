import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, ArrowRight, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, Cloud, Container, Cuboid, Network, Play, RotateCcw, Server, ShieldCheck, Sparkles, Workflow } from 'lucide-react'

type Lesson = { title:string; subtitle:string; body:string; takeaway:string; interaction:string }

const lessons: Lesson[] = [
  {title:'A cluster is a team of computers',subtitle:'THE KUBERNETES CLUSTER',body:'A Kubernetes cluster coordinates machines as one system. The control plane makes decisions; worker nodes provide the compute where workloads run.',takeaway:'Control plane coordinates. Worker nodes execute.',interaction:'Select each component to reveal its role.'},
  {title:'Pods are where containers run',subtitle:'PODS & CONTAINERS',body:'A Pod is Kubernetes’ smallest deployable unit. Containers inside a Pod share networking and lifecycle, and Pods are replaced rather than treated as permanent machines.',takeaway:'Manage applications through workloads, not by repairing individual Pods.',interaction:'Compare the worker, Pod, and container.'},
  {title:'Deployments maintain desired state',subtitle:'DECLARATIVE WORKLOADS',body:'You declare how many replicas you want. A Deployment reconciles the cluster until the desired state is reached, replacing unhealthy or missing Pods.',takeaway:'Desired state → controller → healthy replicas.',interaction:'Change the replica count and watch the model respond.'},
  {title:'Services route traffic safely',subtitle:'SERVICE DISCOVERY',body:'A Service provides a stable address and routes traffic to Pods selected by labels that are Ready. Readiness failures remove a Pod from traffic without deleting it.',takeaway:'Labels select Pods. Readiness controls whether traffic reaches them.',interaction:'Toggle a Pod between Ready and Not Ready, then send requests.'},
  {title:'A request follows the application path',subtitle:'PUTTING IT ALL TOGETHER',body:'External traffic enters through an Ingress or Gateway, reaches a Service, and is sent to a ready Pod. Every hop has a purpose and can be observed.',takeaway:'Ingress/Gateway → Service → ready Pod → container.',interaction:'Play the request flow and follow the moving packet.'},
]

const componentDetails:Record<string,string> = {
  'Control plane':'Makes cluster decisions: schedules workloads, runs controllers, and exposes the Kubernetes API.',
  'Worker node':'Provides CPU, memory, storage, networking, and a container runtime for Pods.',
  'Pod':'The smallest deployable unit; wraps containers that share a network identity and lifecycle.',
  'Container':'Runs the application process and packaged dependencies inside a Pod.',
  'Deployment':'Maintains the requested number of Pods and coordinates safe rollouts.',
  'Service':'Uses labels and readiness to expose a stable route to a changing set of Pods.',
  'Ingress':'Terminates or routes external HTTP traffic to a Kubernetes Service.',
}

export default function KubernetesCourse({onComplete,onSkip}:{onComplete:()=>void;onSkip:()=>void}) {
  const [step,setStep] = useState(0)
  const [selected,setSelected] = useState('')
  const [replicas,setReplicas] = useState(3)
  const [ready,setReady] = useState([true,true,true])
  const [packet,setPacket] = useState(0)
  const [playing,setPlaying] = useState(false)
  const lesson = lessons[step]

  function next() { setSelected(''); if(step === lessons.length-1){onComplete();return} setStep(v=>v+1) }
  function previous() { setSelected(''); setStep(v=>Math.max(0,v-1)) }
  function sendPacket() {
    if(playing)return
    setPacket(v=>v+1)
    setPlaying(true)
    window.setTimeout(()=>setPlaying(false),1500)
  }
  function togglePod(index:number) { setReady(v=>v.map((value,i)=>i===index?!value:value)) }

  return <main className="course-page">
    <header className="course-header">
      <div className="course-brand"><span className="course-logo"><Cloud size={19}/></span><span><b>Kubernetes, visually</b><small>INTERACTIVE FOUNDATIONS</small></span></div>
      <div className="course-progress-label">FOUNDATIONS <b>{step+1} / {lessons.length}</b></div>
      <button className="course-skip" onClick={onSkip}>Skip to incident exercises <ArrowRight size={15}/></button>
    </header>

    <div className="course-shell">
      <nav className="course-steps" aria-label="Kubernetes foundation lessons">
        {lessons.map((item,index)=><button key={item.title} className={`course-step ${step===index?'active':''} ${index<step?'done':''}`} onClick={()=>{setStep(index);setSelected('')}}><span>{index<step?<CheckCircle2 size={15}/>:index+1}</span><b>{item.title}</b></button>)}
      </nav>

      <section className="lesson-area">
        <div className="lesson-copy">
          <p className="course-kicker"><Sparkles size={14}/>{lesson.subtitle}</p>
          <h1>{lesson.title}</h1>
          <p className="lesson-description">{lesson.body}</p>
          <div className="learning-takeaway"><BookOpen size={18}/><span><b>Remember</b>{lesson.takeaway}</span></div>
          <div className="lesson-instruction"><CircleHelp size={17}/>{lesson.interaction}</div>
          <AnimatePresence>{selected&&<motion.div className="component-explanation" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}}><b>{selected}</b><p>{componentDetails[selected]}</p></motion.div>}</AnimatePresence>
        </div>

        <div className="visual-card">
          <div className="visual-top"><span><Activity size={15}/> INTERACTIVE MODEL</span><span className="demo-badge">SIMULATION</span></div>
          <AnimatePresence mode="wait">
            <motion.div key={step} className="lesson-visual" initial={{opacity:0,x:18,scale:.98}} animate={{opacity:1,x:0,scale:1}} exit={{opacity:0,x:-18,scale:.98}} transition={{duration:.28}}>

              {step===0&&<div className="cluster-model">
                <button className="interactive-node" onClick={()=>setSelected('Control plane')}><Cloud/><b>Control plane</b><small>Decide & coordinate</small></button>
                <div className="vertical-link"><span/><span/><span/></div>
                <div className="worker-row">
                  <button className="interactive-node" onClick={()=>setSelected('Worker node')}><Server/><b>Worker node</b><small>Run workloads</small></button>
                  <button className="interactive-node" onClick={()=>setSelected('Worker node')}><Server/><b>Worker node</b><small>Run workloads</small></button>
                </div>
              </div>}

              {step===1&&<div className="pod-model">
                <button className="interactive-node" onClick={()=>setSelected('Worker node')}><Server/><b>Worker node</b></button>
                <div className="pod-boundary">
                  <span className="boundary-label">POD</span>
                  <button className="interactive-node" onClick={()=>setSelected('Pod')}><Cuboid/><b>Pod</b></button>
                  <div className="container-inside"><button className="interactive-node" onClick={()=>setSelected('Container')}><Container/><b>Container</b></button></div>
                </div>
              </div>}

              {step===2&&<div className="deployment-model">
                <button className="replica-control" onClick={()=>setReplicas(v=>Math.max(1,v-1))} aria-label="Decrease replicas">−</button>
                <button className="deployment-hub" onClick={()=>setSelected('Deployment')}><Workflow/><b>Deployment</b><small>desired: {replicas}</small></button>
                <button className="replica-control" onClick={()=>setReplicas(v=>Math.min(5,v+1))} aria-label="Increase replicas">+</button>
                <div className="replica-line"><span/></div>
                <div className="replica-pods">{Array.from({length:replicas},(_,i)=><motion.div layout key={i} className="replica-pod" initial={{scale:.7,opacity:0}} animate={{scale:1,opacity:1}}><Cuboid size={19}/><span>Pod {i+1}</span><small>Ready</small></motion.div>)}</div>
              </div>}

              {step===3&&<div className="service-demo">
                <div className="service-client"><Network/><b>Client</b><small>Request</small></div>
                <div className="service-route"><span className="route-base"/><motion.div key={packet} className="packet packet-service" animate={packet?{x:[0,92,92],opacity:[0,1,0]}:{}} transition={{duration:1.5}}/></div>
                <button className="service-hub" onClick={()=>setSelected('Service')}><Activity/><b>Service</b><small>stable address</small></button>
                <div className="pod-fan">{ready.map((isReady,i)=><i key={i}/>)}</div>
                <div className="service-pods">
                  {ready.map((isReady,i)=><button key={i} className={`service-pod ${isReady?'':'not-ready'}`} onClick={()=>togglePod(i)}><Cuboid/><b>Pod {i+1}</b><small>{isReady?'Ready':'Not Ready'}</small><span>{isReady?'Receiving':'Blocked'}</span></button>)}
                </div>
                {packet>0&&ready.some(Boolean)&&<motion.div key={`result-${packet}`} className="route-result" initial={{opacity:0}} animate={{opacity:[0,1,1,0]}} transition={{duration:1.5}}>routed to Ready Pod</motion.div>}
                {packet>0&&!ready.some(Boolean)&&<motion.div key={`blocked-${packet}`} className="route-result blocked" initial={{opacity:0}} animate={{opacity:[0,1,1,0]}} transition={{duration:1.5}}>no Ready endpoints</motion.div>}
              </div>}

              {step===4&&<div className="flow-demo">
                <button className="flow-node" onClick={()=>setSelected('Worker node')}><Network/><b>User</b><small>request</small></button>
                <div className="flow-link"><span/><ArrowRight/></div>
                <button className="flow-node" onClick={()=>setSelected('Ingress')}><Cloud/><b>Ingress</b><small>route</small></button>
                <div className="flow-link"><span/><ArrowRight/></div>
                <button className="flow-node" onClick={()=>setSelected('Service')}><Activity/><b>Service</b><small>endpoint</small></button>
                <div className="flow-link"><span/><ArrowRight/></div>
                <button className="flow-node" onClick={()=>setSelected('Pod')}><Cuboid/><b>Ready Pod</b><small>container</small></button>
                {playing&&<motion.div className="packet packet-flow" initial={{left:'7%',opacity:0}} animate={{left:'91%',opacity:[0,1,1,0]}} transition={{duration:1.5}}/>}
              </div>}
            </motion.div>
          </AnimatePresence>

          <div className="visual-controls">
            {step===2&&<button onClick={()=>setReplicas(3)}><RotateCcw size={14}/> Reset replicas</button>}
            {step===3&&<button onClick={sendPacket} disabled={playing}><Play size={14}/>{playing?'Packet in flight…':'Send test request'}</button>}
            {step===4&&<button onClick={sendPacket} disabled={playing}><Play size={14}/>{playing?'Request flowing…':'Play request flow'}</button>}
          </div>

          <div className="visual-footer"><span><span className="legend-dot"/> Live Kubernetes model</span><button onClick={()=>{setSelected('');setReplicas(3);setReady([true,true,true]);setPacket(0)}}><RotateCcw size={13}/> Reset model</button></div>
        </div>
      </section>

      <footer className="course-footer"><button className="course-back" onClick={previous} disabled={step===0}><ChevronLeft size={17}/> Previous</button><span>Lesson {step+1} of {lessons.length}</span><button className="course-next" onClick={next}>{step===lessons.length-1?'Start incident exercises':'Next concept'} <ChevronRight size={17}/></button></footer>
      <p className="course-safety"><ShieldCheck size={14}/> Learning sandbox: visual simulation only. It does not connect to a real cluster.</p>
    </div>
  </main>
}
