import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Activity, Cuboid, RotateCcw, Workflow } from 'lucide-react'
import LessonCoach from './LessonCoach'
import { getReplicaStates } from './deploymentModel'
import './DeploymentLesson.css'
import './DeploymentLessonInteraction.css'
import './ModuleDiagramPolish.css'

const reconcilePhases=[
  {name:'OBSERVE',detail:'The Deployment manages ReplicaSets; the active ReplicaSet observes its matching Pods.'},
  {name:'COMPARE',detail:'The ReplicaSet compares its desired replica count with the Pods it observes.'},
  {name:'ACT',detail:'The ReplicaSet requests Pod creation or deletion. Scheduling and readiness still take time.'},
  {name:'REPEAT',detail:'Controllers reconcile again after changes. A matching replica count does not guarantee app health.'},
]
const lastReconcilePhase=reconcilePhases.length-1
const reconcileDurationMs=1800
const reconcilePhaseIntervalMs=450

export default function DeploymentLesson({onSelect}:{onSelect:(name:string)=>void}) {
  const [desired,setDesired]=useState(3)
  const [readyReplicas,setReadyReplicas]=useState(3)
  const [reconciling,setReconciling]=useState(false)
  const [operation,setOperation]=useState<'scale'|'delete'|null>(null)
  const [podDeleted,setPodDeleted]=useState(false)
  const [replacementCount,setReplacementCount]=useState(0)
  const [reconcileStep,setReconcileStep]=useState(0)
  const [selectedPhase,setSelectedPhase]=useState(0)
  const reducedMotion=Boolean(useReducedMotion())
  const replicaStates=getReplicaStates(desired,readyReplicas,reconciling,operation)
  const readyNow=replicaStates.filter(state=>state==='ready').length

  useEffect(()=>{
    if(!reconciling)return
    if(reducedMotion){
      setReadyReplicas(desired)
      setReconciling(false)
      setOperation(null)
      setReconcileStep(lastReconcilePhase)
      setSelectedPhase(lastReconcilePhase)
      return
    }

    setReconcileStep(0)
    setSelectedPhase(0)
    let phase=0
    const interval=window.setInterval(()=>{
      phase=Math.min(phase+1,lastReconcilePhase)
      setReconcileStep(phase)
      setSelectedPhase(phase)
    },reconcilePhaseIntervalMs)
    const timeout=window.setTimeout(()=>{
      setReadyReplicas(desired)
      setReconciling(false)
      setOperation(null)
      setReconcileStep(lastReconcilePhase)
      setSelectedPhase(lastReconcilePhase)
    },reconcileDurationMs)
    return()=>{window.clearInterval(interval);window.clearTimeout(timeout)}
  },[reconciling,desired,reducedMotion])

  function simulateDelete(){
    if(reconciling||readyReplicas===0)return
    setPodDeleted(true)
    setReplacementCount(value=>value+1)
    setReadyReplicas(value=>Math.max(0,value-1))
    setOperation('delete')
    setReconciling(true)
    setSelectedPhase(0)
  }

  function changeDesired(n:number){
    setDesired(n)
    setPodDeleted(false)
    setOperation('scale')
    setReconciling(true)
    setSelectedPhase(0)
  }

  function reset(){
    setDesired(3)
    setReadyReplicas(3)
    setReconciling(false)
    setOperation(null)
    setPodDeleted(false)
    setReplacementCount(0)
    setReconcileStep(0)
    setSelectedPhase(0)
  }

  return <div className="deploy-scene">
    <div className="deploy-toolbar"><span><Workflow size={15}/> DEPLOYMENT RECONCILIATION</span><span className={reconciling?'reconciling':'synced'} role="status" aria-live="polite"><i/> {reconciling?`RECONCILING · ${readyNow}/${desired} READY`:`RECONCILED · ${readyNow}/${desired} READY`}</span></div>
    <div className="deploy-desired">
      <div><small>SPEC.REPLICAS · DESIRED</small><strong>{desired}</strong></div>
      <label className="deploy-slider-label" htmlFor="desired-replicas">Change desired replicas</label>
      <input id="desired-replicas" aria-valuetext={`${desired} desired replicas`} type="range" min="1" max="6" value={desired} onChange={e=>changeDesired(Number(e.target.value))}/>
      <div><small>READY REPLICAS · NOW</small><strong>{readyNow}</strong></div>
    </div>
    <div className="deploy-chain" aria-label="A Deployment manages a ReplicaSet, which manages Pods">
      <div className="deploy-chain-node"><b>Deployment</b><small>declares desired state</small></div><Activity size={16}/><div className="deploy-chain-node"><b>ReplicaSet</b><small>maintains replica count</small></div><Activity size={16}/><div className="deploy-chain-node"><b>Pods</b><small>run the application</small></div>
    </div>
    <div className="reconcile-loop" aria-label="Reconciliation phases">{reconcilePhases.map((phase,index)=><span className="reconcile-phase-wrap" key={phase.name}><button type="button" className={`reconcile-phase ${reconcileStep===index?'reconcile-phase-active':''} ${index<reconcileStep?'reconcile-phase-done':''}`} onClick={()=>{setSelectedPhase(index);onSelect(`Reconcile loop: ${phase.name.toLowerCase()}`)}} aria-pressed={selectedPhase===index}>{phase.name}</button>{index<reconcilePhases.length-1&&<Activity size={15} aria-hidden="true"/>}</span>)}</div>
    <p className="reconcile-detail" role="status" aria-live="polite">{reconciling?'WORKING · ':''}{reconcilePhases[selectedPhase].detail}</p>
    <div className="deploy-pods" role="group" aria-label={`ReplicaSet Pods: ${readyNow} ready, ${replicaStates.filter(state=>state==='creating').length} creating, ${replicaStates.filter(state=>state==='terminating').length} terminating`}>
      {replicaStates.map((state,index)=>{
        const isReplacement=podDeleted&&index===desired-1
        const podName=isReplacement?`web-replacement-${replacementCount}`:`web-${index+1}`
        return <motion.button type="button" key={podName} layout={!reducedMotion} className={`deploy-pod pod-${state} ${isReplacement?'pod-replacement':''}`} onClick={()=>onSelect(`Replica Pod ${podName}`)} aria-label={`${podName}, ${state}`}>
          <Cuboid size={18}/><b>{podName}</b><small>{state.toUpperCase()}</small>
        </motion.button>
      })}
    </div>
    <div className="deploy-actions"><button type="button" onClick={simulateDelete} disabled={reconciling||readyReplicas===0}>Delete a Pod · observe recovery</button><button type="button" className="deploy-reset" onClick={reset}><RotateCcw size={14}/> Reset</button></div>
    <p className="deploy-note">The ReplicaSet creates a new Pod after one is deleted; it cannot repair the deleted Pod. A new Pod must still be scheduled and become Ready. This simplified example assumes capacity is available.</p>
    <LessonCoach task="Delete one Pod and wait for a replacement." hint="The ReplicaSet notices there are fewer Pods than requested and creates another one." complete={podDeleted&&!reconciling&&readyReplicas===desired} success={`The ReplicaSet created a replacement. The Deployment is back at ${desired} Ready copies.`}/>
  </div>
}
