import { useState } from 'react'
import type { ComponentType } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, ShieldCheck, Sparkles } from 'lucide-react'
import PodsLesson from './lessons/PodsLesson'
import ProbesLesson from './lessons/ProbesLesson'
import DeploymentLesson from './lessons/DeploymentLesson'
import ServiceLesson from './lessons/ServiceLesson'
import TrafficLesson from './lessons/TrafficLesson'
import TopologyLesson from './lessons/TopologyLesson'
import ResourceQuotaLesson from './lessons/ResourceQuotaLesson'
import ResourceRequestsLesson from './lessons/ResourceRequestsLesson'
import LearningMaterials from './LearningMaterials'
import './lessons/CourseShell.css'
import './CourseTypography.css'

type LessonProps = { onSelect: (name: string) => void }
type Lesson = { id:string; title:string; subtitle:string; body:string; takeaway:string; Component:ComponentType<LessonProps> }
const lessons:Lesson[] = [
  {id:'pods',title:'Pods & containers',subtitle:'02 · THE POD ABSTRACTION',body:'A Pod is the smallest deployable unit. Containers in one Pod share a network identity and can share mounted volumes. Compare application, init, sidecar, and ambassador containers.',takeaway:'The Pod is the scheduling unit—not an individual container.',Component:PodsLesson},
  {id:'probes',title:'Startup, readiness & liveness',subtitle:'03 · CONTAINER HEALTH',body:'Kubernetes probes let a container report initialization, traffic readiness, and process health. Compare how each result changes Pod behavior and endpoint eligibility.',takeaway:'Startup gates checks, readiness gates traffic, and liveness can restart a container.',Component:ProbesLesson},
  {id:'deployments',title:'Deployments & reconciliation',subtitle:'04 · DESIRED STATE',body:'A Deployment declares how many replicas should exist. Its controller continually reconciles observed state toward that target, creating replacements when Pods disappear.',takeaway:'Controllers repair drift by acting on declared intent.',Component:DeploymentLesson},
  {id:'services',title:'Services & ready endpoints',subtitle:'05 · DISCOVERY AND ROUTING',body:'A Service provides a stable virtual address. Selectors identify matching Pods, and readiness determines which matching Pods are published as usable endpoints.',takeaway:'Matching labels are not enough: only Ready endpoints should receive traffic.',Component:ServiceLesson},
  {id:'traffic',title:'Ingress to application traffic',subtitle:'06 · REQUEST JOURNEY',body:'External HTTP traffic travels through infrastructure and Kubernetes resources before reaching a container. Watch each hop and distinguish the edge, routing, and workload responsibilities.',takeaway:'Ingress/Gateway routes to a Service; the Service data plane selects a ready Pod.',Component:TrafficLesson},
  {id:'topology',title:'Resilience across failure domains',subtitle:'07 · SCHEDULING AND AVAILABILITY',body:'Topology spread constraints influence placement across zones or nodes. Simulate an outage and see how policy and remaining capacity affect replacement scheduling.',takeaway:'Spread reduces correlated failure risk; it does not create capacity.',Component:TopologyLesson},
  {id:'resource-requests',title:'Pod resource requests & limits',subtitle:'08 · SCHEDULING AND RUNTIME',body:'Tune a Pod’s CPU and memory requests and limits. Watch requests determine placement while runtime usage can trigger CPU throttling or a memory OOM kill.',takeaway:'Requests shape scheduling; limits constrain runtime consumption.',Component:ResourceRequestsLesson},
  {id:'resource-quota',title:'Namespace resource quotas',subtitle:'09 · RESOURCE GOVERNANCE',body:'ResourceQuota places hard aggregate limits on namespaced resources. See how the API admission check compares a new workload with the namespace budget before creating Pods.',takeaway:'A workload request is admitted only when all applicable hard quotas have room.',Component:ResourceQuotaLesson},
]

function describeSelection(name:string) {
  const descriptions:Record<string,string> = {
    'Application container':'Runs the main application process and typically serves traffic or performs the workload’s primary function.',
    'Init container':'Runs to completion before application containers start. Init containers run sequentially and can perform migrations or setup that must finish first.',
    'Sidecar container':'A helper that runs alongside the application. This example uses a regular app container; native restartable sidecars instead use initContainers with restartPolicy: Always and can start before app containers.',
    'Ambassador container':'Acts as a local proxy or gateway for the application container. The app can use localhost while the ambassador translates destinations, protocols, authentication, or routing.',
    'Startup probe':'Checks whether the application has finished initialization. While it fails, startup gates liveness and readiness checks for that container.',
    'Readiness probe':'Determines whether the container is ready to receive traffic. Failure marks the Pod NotReady and removes it from normal Service endpoints without necessarily restarting it.',
    'Liveness probe':'Checks whether the container process is running correctly. Repeated failure restarts the container according to the Pod restart policy.',
    'Shared network namespace':'Containers in this Pod share one IP address and localhost. They must coordinate ports to avoid collisions.',
    'Shared volume':'A mounted volume lets containers in one Pod read or write shared files. The volume type determines how long that data lasts.',
    'Service':'A stable virtual endpoint. Its selector identifies Pods, while readiness and port mapping determine usable backends.',
    'Client':'A caller uses a stable Service name rather than relying on replaceable Pod IP addresses.',
    'Ingress / Gateway':'A controller interprets host, path, and listener rules and routes toward a backend Service.',
    'Load balancer':'An external entry point forwards traffic toward the cluster. Provider and controller configuration determine its behavior.',
    'Pod + container':'The final hop reaches a Pod IP and the port on which the application is listening.',
    'cpu requests quota':'The namespace sums CPU requests across applicable Pods and checks the total against requests.cpu.',
    'memory requests quota':'The namespace sums memory requests and checks the total against requests.memory.',
    'Application Pod':'This Pod’s requests are considered by the scheduler before placement. Once running, its container limits constrain CPU and memory consumption.',
    'Reconcile loop: observe':'The controller reads current workload state from the API and observes how many matching Pods exist.',
    'Reconcile loop: compare':'The controller compares observed replicas with the desired spec.replicas value.',
    'Reconcile loop: act':'The ReplicaSet creates or removes Pods to reduce the difference between observed and desired state.',
    'Reconcile loop: repeat':'Reconciliation continues over time. Controllers respond to changes rather than running once and exiting.',
  }
  if (descriptions[name]) return descriptions[name]
  if (name.startsWith('Replica Pod')) return 'This Pod is one replica in the Deployment workload. If it disappears, the ReplicaSet attempts to create a replacement.'
  if (name.startsWith('Replica ')) return 'This replica is placed in a failure domain. Losing that zone affects every replica located there; spreading limits correlated impact.'
  if (name.startsWith('api-')) return 'This Pod is a potential Service endpoint. It receives traffic only when its labels match the selector and it is Ready.'
  return 'Inspect the simulation state and compare it with the field notes below to understand this component’s role.'
}

export default function KubernetesCourse({onComplete,onSkip}:{onComplete:()=>void;onSkip:()=>void}) {
  const [index,setIndex] = useState(0)
  const [selected,setSelected] = useState('')
  const [passedLessons,setPassedLessons] = useState<Set<string>>(() => new Set())
  const lesson = lessons[index]
  const Scene = lesson.Component
  function move(next:number) { setSelected(''); if(next >= lessons.length) { onComplete(); return } setIndex(Math.max(0,next)) }
  function markPassed() { setPassedLessons(current => new Set(current).add(lesson.id)) }

  return <main className="course-page">
    <header className="course-header"><div className="course-brand"><span className="course-logo"><Sparkles size={19}/></span><span><b>Kubernetes, visually</b><small>INTERACTIVE FOUNDATIONS · FIELD NOTES</small></span></div><div className="course-progress-label">MASTERED <b>{passedLessons.size} / {lessons.length}</b></div><button className="course-skip" onClick={onSkip}>Skip to incident exercises <ArrowRight size={15}/></button></header>
    <div className="course-shell">
      <nav className="course-steps" aria-label="Kubernetes learning topics"><button className="course-step done" onClick={onSkip}><span><CheckCircle2 size={15}/></span><b>Cluster architecture</b></button>{lessons.map((item,i)=><button key={item.id} className={`course-step ${index===i?'active':''} ${passedLessons.has(item.id)?'done':''}`} onClick={()=>move(i)} aria-current={index===i?'step':undefined}><span>{passedLessons.has(item.id)?<CheckCircle2 size={15}/>:String(i+2).padStart(2,'0')}</span><b>{item.title}</b></button>)}</nav>
      <section className="lesson-area">
        <div className="lesson-copy"><p className="course-kicker"><Sparkles size={14}/>{lesson.subtitle}</p><h1>{lesson.title}</h1><p className="lesson-description">{lesson.body}</p><div className="learning-takeaway"><BookOpen size={18}/><span><b>OPERATING PRINCIPLE</b>{lesson.takeaway}</span></div><div className="lesson-instruction"><CircleHelp size={17}/>Interact with the simulation; inspect components and watch cluster behavior change.</div>{selected&&<div className="component-explanation"><b>{selected}</b><p>{describeSelection(selected)}</p></div>}</div>
        <div className="visual-card topic-visual"><div className="visual-top"><span><Sparkles size={15}/> SYSTEMS / EXPLAINED</span><span className="demo-badge">K8S · {String(index+2).padStart(2,'0')}</span></div><AnimatePresence mode="wait"><motion.div key={lesson.id} className={`lesson-visual topic-lesson-visual topic-lesson-${lesson.id}`} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.2}}><Scene onSelect={setSelected}/></motion.div></AnimatePresence><div className="visual-footer"><span><span className="legend-dot"/> SIMULATED CLUSTER</span><span>NO REAL INFRASTRUCTURE</span></div></div>
      </section>
      <LearningMaterials key={lesson.id} lessonId={lesson.id} onPass={markPassed}/>
      <footer className="course-footer"><button className="course-back" onClick={()=>move(index-1)}><ChevronLeft size={17}/> Previous topic</button><span>TOPIC {String(index+2).padStart(2,'0')} / {String(lessons.length+1).padStart(2,'0')}</span><button className="course-next" onClick={()=>move(index+1)}>{index===lessons.length-1?'Start incident exercises':'Next topic'} <ChevronRight size={17}/></button></footer>
      <p className="course-safety"><ShieldCheck size={14}/> Interactive training simulation · no connection to a real cluster.</p>
      <p className="course-accessibility"><CircleHelp size={13}/> Each topic is an independent module; use the topic navigation to revisit concepts.</p>
    </div>
  </main>
}
