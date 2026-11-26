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
  const [view,setView]=useState<'replicas'|'rollout'>('replicas')
  const [desired,setDesired]=useState(3)
  const [readyReplicas,setReadyReplicas]=useState(3)
  const [reconciling,setReconciling]=useState(false)
  const [operation,setOperation]=useState<'scale'|'delete'|null>(null)
  const [podDeleted,setPodDeleted]=useState(false)
  const [replacementCount,setReplacementCount]=useState(0)
  const [reconcileStep,setReconcileStep]=useState(0)
  const [selectedPhase,setSelectedPhase]=useState(0)
  const [rolloutStatus,setRolloutStatus]=useState<'idle'|'progressing'|'paused'|'complete'|'rolling-back'|'rolled-back'>('idle')
  const [updatedReplicas,setUpdatedReplicas]=useState(0)
  const reducedMotion=Boolean(useReducedMotion())
  const replicaStates=getReplicaStates(desired,readyReplicas,reconciling,operation)
  const readyNow=replicaStates.filter(state=>state==='ready').length
  const rolloutReplicas=3

  useEffect(()=>{
    if(rolloutStatus!=='progressing'&&rolloutStatus!=='rolling-back')return
    const timeout=window.setTimeout(()=>{
      if(rolloutStatus==='progressing'){
        const next=Math.min(rolloutReplicas,updatedReplicas+1)
        setUpdatedReplicas(next)
        if(next===rolloutReplicas)setRolloutStatus('complete')
      }else{
        const next=Math.max(0,updatedReplicas-1)
        setUpdatedReplicas(next)
        if(next===0)setRolloutStatus('rolled-back')
      }
    },850)
    return()=>window.clearTimeout(timeout)
  },[rolloutStatus,updatedReplicas])

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

  function startRollout(){
    setUpdatedReplicas(0)
    setRolloutStatus('progressing')
  }

  function rollback(){
    if(rolloutStatus==='complete'||rolloutStatus==='progressing'||rolloutStatus==='paused')setRolloutStatus('rolling-back')
  }

  return <div className={`deploy-scene ${view==='rollout'?'deploy-rollout-scene':''}`}>
    <div className="deploy-toolbar"><span><Workflow size={15}/> DEPLOYMENT RECONCILIATION</span><span className={view==='replicas'&&reconciling?'reconciling':'synced'} role="status" aria-live="polite"><i/> {view==='rollout'?'SEPARATE EXAMPLE · 3 DESIRED':reconciling?`RECONCILING · ${readyNow}/${desired} READY`:`RECONCILED · ${readyNow}/${desired} READY`}</span></div>
    <div className="deploy-view-switch" role="group" aria-label="Deployment simulations">
      <button type="button" aria-pressed={view==='replicas'} className={view==='replicas'?'active':''} onClick={()=>setView('replicas')}>Replica health</button>
      <button type="button" aria-pressed={view==='rollout'} className={view==='rollout'?'active':''} onClick={()=>setView('rollout')}>Rolling update & rollback</button>
    </div>
    {view==='replicas'?<>
      <div className="deploy-desired">
        <div><small>SPEC.REPLICAS · DESIRED</small><strong>{desired}</strong></div>
        <label className="deploy-slider-label" htmlFor="desired-replicas">Change desired replicas</label>
        <input id="desired-replicas" aria-valuetext={`${desired} desired replicas`} type="range" min="1" max="6" value={desired} onChange={e=>changeDesired(Number(e.target.value))}/>
        <div><small>READY REPLICAS · NOW</small><strong>{readyNow}</strong></div>
      </div>
      <div className="deploy-chain" aria-label="A Deployment manages a ReplicaSet, which manages Pods">
        <span className="deploy-flow" aria-hidden="true"><i/></span>
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
    </>:<>
      <div className="rollout-heading"><div><small>DEPLOYMENT · WEB</small><b>Watch a rolling Pod replacement</b></div><span className={`rollout-status rollout-${rolloutStatus}`} role="status" aria-live="polite"><i/>{rolloutStatus==='idle'?'READY TO DEPLOY':rolloutStatus==='progressing'?'PROGRESSING':rolloutStatus==='paused'?'PAUSED':rolloutStatus==='complete'?'ROLLOUT COMPLETE':rolloutStatus==='rolling-back'?'ROLLING BACK':'ROLLED BACK'}</span></div>
      <div className="rollout-progress" role="progressbar" aria-label="Updated replicas" aria-valuemin={0} aria-valuemax={rolloutReplicas} aria-valuenow={updatedReplicas}><span style={{width:`${updatedReplicas/rolloutReplicas*100}%`}}/></div>
      <div className="rollout-revisions" role="group" aria-label={`${rolloutReplicas-updatedReplicas} old and ${updatedReplicas} updated application Pods`}>
        {[{version:'v1.4.0',count:rolloutReplicas-updatedReplicas,updated:false},{version:'v1.5.0',count:updatedReplicas,updated:true}].map(revision=><section className={`rollout-revision ${revision.updated?'rollout-revision-new':''}`} key={revision.version}>
          <div className="rollout-revision-heading"><span>{revision.updated?'NEW':'PREVIOUS'} REPLICASET · {revision.version}</span><b>{revision.updated&&rolloutStatus==='idle'?'NOT CREATED':`${revision.count} PODS`}</b></div>
          <div className="rollout-replicas">
            {Array.from({length:revision.count},(_,index)=>{
              const podName=`web-${revision.updated?'new':'old'}-${index+1}`
              return <motion.button type="button" layout={!reducedMotion} key={podName} className={`rollout-pod ${revision.updated?'rollout-pod-new':''}`} onClick={()=>onSelect(`Replica Pod ${podName}`)} aria-label={`Illustrative Pod ${podName}, ${revision.version}`}>
                <Cuboid size={18}/><b>{podName}</b><small>{revision.version}</small>
              </motion.button>
            })}
            {revision.count===0&&<p className="rollout-empty">{revision.updated&&rolloutStatus==='idle'?'Created when the Pod template changes':'No Pods in this ReplicaSet'}</p>}
          </div>
        </section>)}
      </div>
      <div className="rollout-stages" aria-label="Rolling update stages"><span className={rolloutStatus==='complete'?'stage-done':rolloutStatus==='progressing'?'stage-active':''}>CREATE</span><i/><span className={rolloutStatus==='complete'?'stage-done':rolloutStatus==='progressing'?'stage-active':''}>WAIT FOR READY</span><i/><span className={rolloutStatus==='complete'?'stage-done':rolloutStatus==='progressing'?'stage-active':''}>RETIRE OLD</span></div>
      <div className="deploy-actions rollout-actions">
        {(rolloutStatus==='idle'||rolloutStatus==='rolled-back')&&<button type="button" onClick={startRollout}>Deploy v1.5.0</button>}
        {(rolloutStatus==='progressing'||rolloutStatus==='paused')&&<><button type="button" onClick={()=>setRolloutStatus(rolloutStatus==='progressing'?'paused':'progressing')}>{rolloutStatus==='progressing'?'Pause rollout':'Resume rollout'}</button><button type="button" className="rollout-undo" onClick={rollback}>Roll back to v1.4.0</button></>}
        {rolloutStatus==='complete'&&<button type="button" className="rollout-undo" onClick={rollback}>Roll back to v1.4.0</button>}
        {rolloutStatus==='rolling-back'&&<button type="button" disabled>Restoring previous version…</button>}
        {(rolloutStatus==='complete'||rolloutStatus==='rolled-back')&&<span className="rollout-confirmation">{rolloutStatus==='complete'?'All updated Pods are Ready.':'Previous ReplicaSet is serving traffic.'}</span>}
      </div>
      <p className="deploy-note">This separate three-replica example models each new Pod becoming Ready before an old one is retired; brief maxSurge capacity is omitted. The previous ReplicaSet is retained here for rollback, subject to revision history cleanup in a real cluster. Pod names are illustrative. Rollouts can stall, and rollback cannot undo external changes such as database migrations.</p>
    </>}
  </div>
}
