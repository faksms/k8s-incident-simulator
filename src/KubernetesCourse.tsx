import { useState } from 'react'
import type { ComponentType } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, ShieldCheck, Sparkles } from 'lucide-react'
import PodsLesson from './lessons/PodsLesson'
import DeploymentLesson from './lessons/DeploymentLesson'
import ServiceLesson from './lessons/ServiceLesson'
import TrafficLesson from './lessons/TrafficLesson'
import TopologyLesson from './lessons/TopologyLesson'
import './lessons/CourseShell.css'

type LessonProps = { onSelect: (name: string) => void }
type Lesson = { id:string; title:string; subtitle:string; body:string; takeaway:string; Component:ComponentType<LessonProps> }
const lessons:Lesson[] = [
  {id:'pods',title:'Pods & containers',subtitle:'02 · THE POD ABSTRACTION',body:'A Pod is the smallest deployable unit. Containers in one Pod share a network identity and can share mounted volumes. Explore how the boundary shapes an application.',takeaway:'The Pod is the scheduling unit—not an individual container.',Component:PodsLesson},
  {id:'deployments',title:'Deployments & reconciliation',subtitle:'03 · DESIRED STATE',body:'A Deployment declares how many replicas should exist. Its controller continually reconciles observed state toward that target, creating replacements when Pods disappear.',takeaway:'Controllers repair drift by acting on declared intent.',Component:DeploymentLesson},
  {id:'services',title:'Services & ready endpoints',subtitle:'04 · DISCOVERY AND ROUTING',body:'A Service provides a stable virtual address. Selectors identify matching Pods, and readiness determines which matching Pods are published as usable endpoints.',takeaway:'Matching labels are not enough: only Ready endpoints should receive traffic.',Component:ServiceLesson},
  {id:'traffic',title:'Ingress to application traffic',subtitle:'05 · REQUEST JOURNEY',body:'External HTTP traffic travels through infrastructure and Kubernetes resources before reaching a container. Watch each hop and distinguish the edge, routing, and workload responsibilities.',takeaway:'Ingress/Gateway routes to a Service; the Service data plane selects a ready Pod.',Component:TrafficLesson},
  {id:'topology',title:'Resilience across failure domains',subtitle:'06 · SCHEDULING AND AVAILABILITY',body:'Topology spread constraints influence placement across zones or nodes. Simulate an outage and see how policy and remaining capacity affect replacement scheduling.',takeaway:'Spread reduces correlated failure risk; it does not create capacity.',Component:TopologyLesson},
]

export default function KubernetesCourse({onComplete,onSkip}:{onComplete:()=>void;onSkip:()=>void}) {
  const [index,setIndex] = useState(0)
  const [selected,setSelected] = useState('')
  const lesson = lessons[index]
  const Scene = lesson.Component
  function move(next:number) { setSelected(''); if(next >= lessons.length) { onComplete(); return } setIndex(Math.max(0,next)) }

  return <main className="course-page">
    <header className="course-header"><div className="course-brand"><span className="course-logo"><Sparkles size={19}/></span><span><b>Kubernetes, visually</b><small>INTERACTIVE FOUNDATIONS · FIELD NOTES</small></span></div><div className="course-progress-label">FOUNDATIONS <b>{String(index+2).padStart(2,'0')} / 06</b></div><button className="course-skip" onClick={onSkip}>Skip to incident exercises <ArrowRight size={15}/></button></header>
    <div className="course-shell">
      <nav className="course-steps" aria-label="Kubernetes learning topics"><button className="course-step done" onClick={onSkip}><span><CheckCircle2 size={15}/></span><b>Cluster architecture</b></button>{lessons.map((item,i)=><button key={item.id} className={`course-step ${index===i?'active':''} ${i<index?'done':''}`} onClick={()=>move(i)}><span>{i<index?<CheckCircle2 size={15}/>:String(i+2).padStart(2,'0')}</span><b>{item.title}</b></button>)}</nav>
      <section className="lesson-area">
        <div className="lesson-copy"><p className="course-kicker"><Sparkles size={14}/>{lesson.subtitle}</p><h1>{lesson.title}</h1><p className="lesson-description">{lesson.body}</p><div className="learning-takeaway"><BookOpen size={18}/><span><b>OPERATING PRINCIPLE</b>{lesson.takeaway}</span></div><div className="lesson-instruction"><CircleHelp size={17}/>Interact with the architecture model; each control changes simulated cluster state.</div>{selected&&<div className="component-explanation"><b>{selected}</b><p>Inspect this component in the visual model. The diagram is an educational simulation and does not connect to a real cluster.</p></div>}</div>
        <div className="visual-card topic-visual"><div className="visual-top"><span><Sparkles size={15}/> SYSTEMS / EXPLAINED</span><span className="demo-badge">K8S · {String(index+2).padStart(2,'0')}</span></div><AnimatePresence mode="wait"><motion.div key={lesson.id} className="lesson-visual topic-lesson-visual" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.2}}><Scene onSelect={setSelected}/></motion.div></AnimatePresence><div className="visual-footer"><span><span className="legend-dot"/> SIMULATED CLUSTER</span><span>NO REAL INFRASTRUCTURE</span></div></div>
      </section>
      <footer className="course-footer"><button className="course-back" onClick={()=>move(index-1)}><ChevronLeft size={17}/> Previous topic</button><span>TOPIC {String(index+2).padStart(2,'0')} / 06</span><button className="course-next" onClick={()=>move(index+1)}>{index===lessons.length-1?'Start incident exercises':'Next topic'} <ChevronRight size={17}/></button></footer>
      <p className="course-safety"><ShieldCheck size={14}/> Interactive training simulation · no connection to a real cluster.</p>
      <p className="course-accessibility"><CircleHelp size={13}/> Each topic is an independent module; use the topic navigation to revisit concepts.</p>
    </div>
  </main>
}
