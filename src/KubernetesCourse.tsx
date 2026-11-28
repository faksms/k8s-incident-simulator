import { useEffect, useRef, useState } from 'react'
import type { ComponentType } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, Search, ShieldCheck, Sparkles } from 'lucide-react'
import PodsLesson from './lessons/PodsLesson'
import ProbesLesson from './lessons/ProbesLesson'
import DeploymentLesson from './lessons/DeploymentLesson'
import DeploymentVisualGuide from './lessons/DeploymentVisualGuide'
import ServiceLesson from './lessons/ServiceLesson'
import ServiceVisualGuide from './lessons/ServiceVisualGuide'
import PriorityAnimation, { PriorityIntro } from './lessons/PriorityLesson'
import SchedulingGuide from './lessons/SchedulingGuide'
import AutoscalingGuide from './lessons/AutoscalingGuide'
import TrafficLesson from './lessons/TrafficLesson'
import TopologyLesson from './lessons/TopologyLesson'
import ResourceQuotaLesson from './lessons/ResourceQuotaLesson'
import ResourceRequestsLesson from './lessons/ResourceRequestsLesson'
import { AccessLab, ConfigurationLab, DiscoveryLab, NamespaceLab, RolloutLab, SchedulingLab, StorageLab } from './lessons/ConceptLabs'
import { foundationLabs } from './lessons/FoundationLabs'
import { administrationLabs } from './lessons/AdministrationLabs'
import { networkStorageLessonLabs } from './lessons/NetworkStorageLabs'
import TerminologyGuide from './lessons/TerminologyGuide'
import LearningMaterials, { materials } from './LearningMaterials'
import type { Material } from './LearningMaterials'
import { extendedLessons } from './ExtendedLessons'
import { ckaLessons } from './ckaLessons'
import { courseChapters, filterTopics, flattenTopics } from './courseCatalog'
import { learningPaths, pathChapters } from './learningPaths'
import { incidentTopics } from './App'
import type { TopicNode } from './courseCatalog'
import './lessons/CourseShell.css'
import './CourseTypography.css'
import './lessons/WorkloadMotion.css'

type LessonProps = { onSelect: (name: string) => void }
type Lesson = { id:string; title:string; subtitle:string; body:string; takeaway:string; Component:ComponentType<LessonProps> }
const lessons:Lesson[] = [
  {id:'pods',title:'Pods & containers',subtitle:'02 · THE POD ABSTRACTION',body:'A Pod is the smallest unit Kubernetes places on a node. Its containers share an IP address and can share files. Compare the app container with containers that help it.',takeaway:'Kubernetes places the whole Pod on a node, not each container separately.',Component:PodsLesson},
  {id:'probes',title:'Startup, readiness & liveness',subtitle:'03 · CONTAINER HEALTH',body:'Probes are health checks. See how Kubernetes checks whether an app has started, is ready for traffic, or needs a restart.',takeaway:'Startup waits for the app; readiness controls traffic; liveness can restart a container.',Component:ProbesLesson},
  {id:'deployments',title:'Deployments & reconciliation',subtitle:'04 · DESIRED STATE',body:'Declare desired replicas, watch controllers replace missing Pods, then trace a rolling update and rollback.',takeaway:'A Deployment manages ReplicaSets; reconciliation maintains replicas and revisions enable controlled updates.',Component:DeploymentLesson},
  {id:'services',title:'Services & ready endpoints',subtitle:'05 · DISCOVERY AND ROUTING',body:'A Service gives an app a stable address. It uses labels to find matching Pods, then normally sends traffic to those that are ready.',takeaway:'Labels must match, and Pods normally need to be ready to receive traffic.',Component:ServiceLesson},
  {id:'traffic',title:'Ingress to application traffic',subtitle:'06 · REQUEST JOURNEY',body:'Follow an HTTP request from outside the cluster to an app container. See what the entry point, routing rules, and Service each do.',takeaway:'Ingress or Gateway routes to a Service; the Service normally sends traffic to a ready Pod.',Component:TrafficLesson},
  {id:'topology',title:'Resilience across failure domains',subtitle:'07 · SCHEDULING AND AVAILABILITY',body:'Spread rules help place app copies across nodes or zones. Try an outage and see whether the remaining nodes have room for replacement Pods.',takeaway:'Spreading copies can reduce the impact of a failure, but it does not create extra capacity.',Component:TopologyLesson},
  {id:'resource-requests',title:'Pod resource requests & limits',subtitle:'08 · SCHEDULING AND RUNTIME',body:'Change a Pod’s CPU and memory requests and limits. See how requests help find a node and how limits can slow or stop a container.',takeaway:'Requests help place a Pod; limits control how much a container can use.',Component:ResourceRequestsLesson},
  {id:'resource-quota',title:'Namespace resource quotas',subtitle:'09 · RESOURCE GOVERNANCE',body:'A ResourceQuota sets a shared resource budget for a namespace. See how the API checks the budget before accepting new Pods.',takeaway:'A new Pod must fit within all the quotas that apply to it.',Component:ResourceQuotaLesson},
]
const allExtendedLessons = [...extendedLessons, ...ckaLessons]
export const specializedLessonScenes: Record<string, ComponentType> = {
  ...foundationLabs, ...administrationLabs, ...networkStorageLessonLabs,
  dns: DiscoveryLab, storage: StorageLab, rbac: AccessLab, scheduling: SchedulingLab, 'priority-classes': PriorityIntro,
  namespaces: NamespaceLab, configuration: ConfigurationLab, rollouts: RolloutLab,
}
const allLessons = [...lessons, ...allExtendedLessons]
const orderedIds = courseChapters.flatMap(chapter => flattenTopics(chapter.topics))
export const courseLessonIds = allLessons.map(lesson => lesson.id)
export const initialLessonIndex = allLessons.findIndex(lesson => lesson.id === orderedIds[1])

export function matchesTopic(query: string, title: string, body: string, material: Material, keywords = '') {
  const search = query.trim().toLowerCase()
  return !search || [title, body, material.title, material.objective, ...material.concepts.flatMap(concept => [concept.term, concept.detail]), keywords].join(' ').toLowerCase().includes(search)
}

function describeSelection(name:string) {
  const descriptions:Record<string,string> = {
    'Application container':'Runs the main app, such as a website or an API.',
    'Init container':'An ordinary init container finishes its job before app containers start. Init containers run one at a time and can prepare things the app needs.',
    'Sidecar container':'A helper that runs alongside the app. Here it is a regular app container. Kubernetes also supports restartable sidecars under initContainers; those can start before app containers.',
    'Ambassador container':'A helper that handles connections for the app. The app talks to it through localhost, and it can connect to another service.',
    'Startup probe':'A health check that waits for the app to start. Until it succeeds, the container’s readiness and liveness checks do not run.',
    'Readiness probe':'Checks whether the app is ready for traffic. Failure makes the Pod NotReady for normal Service traffic; it does not by itself restart the container.',
    'Liveness probe':'Checks whether the container is healthy. Repeated failures can restart it according to the Pod restart policy.',
    'Shared network namespace':'Containers in this Pod share an IP address and can talk using localhost. They must avoid using the same listening port.',
    'Shared volume':'Containers in a Pod can mount the same volume to share files. The type of volume determines how long those files last.',
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

export default function KubernetesCourse({index,track,onIndexChange,passedLessons,onPass,onArchitecture,onComplete,onSkip,onPractical,onDashboard,onRelatedIncident}:{index:number;track?:string;onIndexChange:(index:number,track?:string)=>void;passedLessons:Set<string>;onPass:(id:string)=>void;onArchitecture:(track?:string)=>void;onComplete:()=>void;onSkip:()=>void;onPractical:()=>void;onDashboard:()=>void;onRelatedIncident:(index:number)=>void}) {
  const [selected,setSelected] = useState('')
  const [query, setQuery] = useState('')
  const [indexOpen, setIndexOpen] = useState(false)
  const lessonHeading = useRef<HTMLHeadingElement>(null)
  const focusLesson = useRef(false)
  const selectedControl = useRef<HTMLElement | null>(null)
  const lesson = allLessons[index]
  const standardLesson = lessons[index]
  const extendedLesson = allExtendedLessons[index - lessons.length]
  const Scene = standardLesson?.Component
  const SpecializedScene = specializedLessonScenes[lesson.id]
  if (!Scene && !SpecializedScene) throw new Error(`Missing interactive scene for lesson: ${lesson.id}`)
  const currentPosition = orderedIds.indexOf(lesson.id)
  const activePath = learningPaths.find(path => path.id === track)
  const navigationIds = activePath ? pathChapters(activePath).flatMap(chapter => chapter.topics.map(topic => topic.id)) : orderedIds
  const navigationPosition = navigationIds.indexOf(lesson.id)
  const currentChapter = courseChapters.find(chapter => flattenTopics(chapter.topics).includes(lesson.id))!
  const matchingChapters = courseChapters.map(chapter => ({
    ...chapter,
    topics: filterTopics(chapter.topics, id => {
      if (id === 'architecture') return matchesTopic(query, 'Cluster architecture', '', materials.architecture, 'control plane nodes scheduler api server etcd networking')
      const item = allLessons.find(candidate => candidate.id === id)!
      const material = 'material' in item ? item.material : materials[item.id]
      return matchesTopic(query, item.title, item.body, material, 'keywords' in item ? item.keywords : '')
    }, Boolean(query.trim()) && `${chapter.title} ${chapter.description}`.toLowerCase().includes(query.trim().toLowerCase())),
  })).filter(chapter => chapter.topics.length > 0)
  const shownCount = matchingChapters.reduce((count, chapter) => count + flattenTopics(chapter.topics).length, 0)
  useEffect(() => {
    setSelected('')
    selectedControl.current = null
  }, [index])
  useEffect(() => {
    if (focusLesson.current) {
      lessonHeading.current?.focus({ preventScroll: true })
      focusLesson.current = false
    }
  }, [index, indexOpen])
  function move(id: string) {
    setSelected('')
    selectedControl.current = null
    setIndexOpen(false)
    const nextTrack = activePath?.topics.some(topic => topic.id === id) ? activePath.id : undefined
    if (id === 'architecture') { onArchitecture(nextTrack); return }
    const next = allLessons.findIndex(item => item.id === id)
    if (next < 0) throw new Error(`Unknown course topic: ${id}`)
    focusLesson.current = true
    onIndexChange(next, nextTrack)
    window.scrollTo(0, 0)
  }
  function selectComponent(name: string) {
    const active = document.activeElement
    selectedControl.current = active instanceof HTMLElement && active.closest('.lesson-visual') ? active : null
    setSelected(name)
  }
  function closeExplanation() {
    selectedControl.current?.focus({ preventScroll: true })
    selectedControl.current = null
    setSelected('')
  }
  function renderTopics(nodes: TopicNode[]) {
    return <ul>{nodes.map(node => {
      const item = allLessons.find(candidate => candidate.id === node.id)
      const title = node.id === 'architecture' ? 'Cluster architecture' : item!.title
      return <li key={node.id}><button className={`course-step ${lesson.id === node.id ? 'active' : ''} ${passedLessons.has(node.id) ? 'done' : ''}`} onClick={() => move(node.id)} aria-current={lesson.id === node.id ? 'page' : undefined}><span>{passedLessons.has(node.id) ? <CheckCircle2 size={15}/> : String(orderedIds.indexOf(node.id) + 1).padStart(2, '0')}</span><b>{title}</b></button>{node.children && renderTopics(node.children)}</li>
    })}</ul>
  }

  return <main className="course-page">
    <header className="course-header"><div className="course-brand"><span className="course-logo"><Sparkles size={19}/></span><span><b>Kubernetes, visually</b><small>INTERACTIVE FOUNDATIONS · FIELD NOTES</small></span></div><div className="course-progress-label">CHECKS PASSED <b>{allLessons.filter(item=>passedLessons.has(item.id)).length + (passedLessons.has('architecture') ? 1 : 0)} / {allLessons.length + 1}</b></div><button className="course-skip" onClick={onDashboard}>Learning dashboard</button><button className="course-skip" onClick={onSkip}>Incident exercises <ArrowRight size={15}/></button></header>
    <div className="course-shell">
      <details className="topic-index" open={indexOpen} onToggle={event=>setIndexOpen(event.currentTarget.open)}>
        <summary><span><BookOpen size={18}/><b>Explore the topic index</b></span><small>{allLessons.length + 1} topics · Search and jump to a lesson</small></summary>
        <div className="index-content">
          <label className="index-search"><Search size={18}/><span className="sr-only">Search Kubernetes topics</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search topics, concepts, or keywords"/></label>
          <p className="index-count" aria-live="polite">{shownCount} lessons shown{query.trim() ? ' · including parent topics' : ''}</p>
          <nav className="chapter-index" aria-label="Kubernetes learning topics">{matchingChapters.map(chapter => <section key={chapter.id} className="index-chapter" aria-labelledby={`chapter-${chapter.id}`}><div className="index-chapter-heading"><h2 id={`chapter-${chapter.id}`}>{chapter.title}</h2><p>{chapter.description}</p></div>{renderTopics(chapter.topics)}</section>)}</nav>
          {shownCount === 0 && <p className="index-empty">No topics match. Try a broader term such as storage, networking, or security.</p>}
        </div>
      </details>
      <section className="lesson-area">
        {activePath && <p className="course-path-context">Learning path: <b>{activePath.title}</b> · Topic {navigationPosition + 1} of {navigationIds.length}. Next and Previous follow this path.</p>}
        <div className="lesson-copy"><p className="course-kicker"><Sparkles size={14}/>{currentChapter.title.toUpperCase()} · {String(currentPosition+1).padStart(2,'0')} / {String(orderedIds.length).padStart(2,'0')}</p><h1 ref={lessonHeading} tabIndex={-1}>{lesson.title}</h1><p className="lesson-description">{lesson.body}</p><div className="learning-takeaway"><BookOpen size={18}/><span><b>KEY IDEA</b>{lesson.takeaway}</span></div><div className="lesson-instruction"><CircleHelp size={17}/>Try the example: change a setting and see what happens.</div>{lesson.id === 'services' && <button className="course-next practical-lesson-link" onClick={onPractical}>Practice in the simulated terminal <ArrowRight size={15}/></button>}{incidentTopics.includes(lesson.id) && <button className="course-back practical-lesson-link" onClick={() => onRelatedIncident(incidentTopics.indexOf(lesson.id))}>Practice a related incident <ArrowRight size={15}/></button>}</div>
        <div className="visual-card topic-visual"><div className="visual-top"><span><Sparkles size={15}/> SYSTEMS / EXPLAINED</span><span className="demo-badge">K8S · {String(currentPosition+1).padStart(2,'0')}</span></div>{selected&&<div className="component-explanation"><div role="status"><b>{selected}</b><p>{describeSelection(selected)}</p></div><button type="button" onClick={closeExplanation} aria-label="Close component explanation">Close</button></div>}<motion.div key={lesson.id} className={`lesson-visual topic-lesson-visual topic-lesson-${lesson.id}`} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.2}}>{Scene ? <Scene onSelect={selectComponent}/> : <SpecializedScene/>}</motion.div><div className="visual-footer"><span><span className="legend-dot"/> SIMULATED CLUSTER</span><span>NO REAL INFRASTRUCTURE</span></div></div>
      </section>
      {lesson.id === 'deployments' && <DeploymentVisualGuide/>}
      {lesson.id === 'services' && <ServiceVisualGuide/>}
      {lesson.id === 'scheduling' && <SchedulingGuide/>}
      {lesson.id === 'autoscaling' && <AutoscalingGuide/>}
      {lesson.id === 'terminology' && <TerminologyGuide onTopic={move}/>}
      <LearningMaterials key={lesson.id} lessonId={lesson.id} extraMaterial={extendedLesson?.material} passed={passedLessons.has(lesson.id)} onPass={()=>onPass(lesson.id)}/>
      {lesson.id === 'priority-classes' && <PriorityAnimation/>}
      <footer className="course-footer"><button className="course-back" disabled={navigationPosition===0} onClick={()=>move(navigationIds[navigationPosition-1])}><ChevronLeft size={17}/> Previous topic</button><span>{activePath ? 'PATH TOPIC' : 'TOPIC'} {String(navigationPosition+1).padStart(2,'0')} / {String(navigationIds.length).padStart(2,'0')}</span><button className="course-next" onClick={()=>navigationPosition===navigationIds.length-1 ? activePath ? onDashboard() : onComplete() : move(navigationIds[navigationPosition+1])}>{navigationPosition===navigationIds.length-1 ? activePath ? 'Back to paths' : 'Start incident exercises' : 'Next topic'} <ChevronRight size={17}/></button></footer>
      <p className="course-safety"><ShieldCheck size={14}/> Interactive training simulation · no connection to a real cluster.</p>
      <p className="course-accessibility"><CircleHelp size={13}/> Explore the simulation, read the notes, then try the knowledge check. Passed checks are saved in this browser when storage is available.</p>
    </div>
  </main>
}
