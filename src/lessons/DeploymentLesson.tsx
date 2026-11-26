import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Cuboid, RotateCcw, Workflow } from 'lucide-react'
import LessonCoach from './LessonCoach'
import './DeploymentLesson.css'
import './DeploymentLessonInteraction.css'
import './ModuleDiagramPolish.css'

const reconcilePhases=[{name:'OBSERVE',detail:'The ReplicaSet counts matching Pods, even if they are not Ready.'},{name:'COMPARE',detail:'It compares that count with the requested number, spec.replicas.'},{name:'ACT',detail:'It creates or removes Pods to move toward the requested number.'},{name:'REPEAT',detail:'It keeps checking and acts again when needed.'}]

export default function DeploymentLesson({onSelect}:{onSelect:(name:string)=>void}) {
  const [desired,setDesired]=useState(3)
  const [pods,setPods]=useState(3)
  const [recovering,setRecovering]=useState(false)
  const [podDeleted,setPodDeleted]=useState(false)
  const [replacementCount,setReplacementCount]=useState(0)
  const [reconcileStep,setReconcileStep]=useState(0)
  useEffect(()=>{if(!recovering)return;setReconcileStep(0);const interval=window.setInterval(()=>setReconcileStep(value=>Math.min(value+1,reconcilePhases.length-1)),350);const timeout=window.setTimeout(()=>{setPods(desired);setRecovering(false);setReconcileStep(reconcilePhases.length-1)},1400);return()=>{window.clearInterval(interval);window.clearTimeout(timeout)}},[recovering,desired])
  function simulateDelete(){if(recovering||pods===0)return;setPodDeleted(true);setReplacementCount(value=>value+1);setPods(v=>Math.max(0,v-1));setRecovering(true)}
  function changeDesired(n:number){setDesired(n);setPodDeleted(false);setRecovering(true)}
  return <div className="deploy-scene">
    <div className="deploy-toolbar"><span><Workflow size={15}/> DEPLOYMENT CONTROLLER</span><span className={recovering?'reconciling':'synced'}><i/> {recovering?'MATCHING THE REQUEST':'COPIES MATCH THE REQUEST'}</span></div>
    <div className="deploy-desired"><div><small>SPEC.REPLICAS · DESIRED</small><strong>{desired}</strong></div><input aria-label="Desired replica count" type="range" min="1" max="6" value={desired} onChange={e=>changeDesired(Number(e.target.value))}/><div><small>EXAMPLE READY COPIES</small><strong>{pods}</strong></div></div>
    <div className="reconcile-loop">{reconcilePhases.map((phase,index)=><span className="reconcile-phase-wrap" key={phase.name}><button className={`reconcile-phase ${reconcileStep===index?'reconcile-phase-active':''} ${index<reconcileStep?'reconcile-phase-done':''}`} onClick={()=>{setReconcileStep(index);onSelect(`Reconcile loop: ${phase.name.toLowerCase()}`)}} aria-current={reconcileStep===index?'step':undefined}>{phase.name}</button>{index<reconcilePhases.length-1&&<Activity size={15}/>}</span>)}</div>
    <p className="reconcile-detail" aria-live="polite">{recovering?'WORKING · ':''}{reconcilePhases[reconcileStep].detail}</p>
    <div className="deploy-pods">{Array.from({length:Math.max(desired,pods)},(_,i)=>{const isReplacement=podDeleted&&!recovering&&i===pods-1;const podName=isReplacement?`web-replacement-${replacementCount}`:`web-${i+1}`;return <motion.button key={podName} layout className={`deploy-pod ${i>=pods?'pod-pending':''} ${isReplacement?'pod-replacement':''}`} onClick={()=>onSelect(`Replica Pod ${podName}`)}><Cuboid size={18}/><b>{podName}</b><small>{i<pods?'READY':recovering?'CREATING':'PENDING'}</small></motion.button>})}</div>
    <div className="deploy-actions"><button onClick={simulateDelete} disabled={recovering||pods===0}>Delete a Pod · observe recovery</button><button className="deploy-reset" onClick={()=>{setDesired(3);setPods(3);setRecovering(false);setPodDeleted(false);setReplacementCount(0);setReconcileStep(0)}}><RotateCcw size={14}/> Reset</button></div>
    <p className="deploy-note">A Deployment manages a ReplicaSet, which creates replacement Pods. It creates a new Pod instead of fixing the deleted one.</p>
    <LessonCoach task="Delete one Pod and wait for a replacement." hint="The ReplicaSet notices there are fewer Pods than requested and creates another one." complete={podDeleted&&!recovering&&pods===desired} success={`The ReplicaSet created a replacement. The Deployment is back at ${desired} Ready copies.`}/>
  </div>
}
