import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Cuboid, RotateCcw, Workflow } from 'lucide-react'
import LessonCoach from './LessonCoach'
import SignalTrace from './SignalTrace'
import './DeploymentLesson.css'
import './DeploymentLessonInteraction.css'
import './ModuleDiagramPolish.css'

const reconcilePhases=[{name:'OBSERVE',detail:'The ReplicaSet observes the number of matching Pods, regardless of readiness.'},{name:'COMPARE',detail:'The number of matching Pods is compared with spec.replicas.'},{name:'ACT',detail:'The ReplicaSet creates or removes Pods to match the target.'},{name:'REPEAT',detail:'The controller watches again until observed state converges.'}]

export default function DeploymentLesson({onSelect}:{onSelect:(name:string)=>void}) {
  const [desired,setDesired]=useState(3)
  const [pods,setPods]=useState(3)
  const [recovering,setRecovering]=useState(false)
  const [podDeleted,setPodDeleted]=useState(false)
  const [replacementCount,setReplacementCount]=useState(0)
  const [reconcileStep,setReconcileStep]=useState(0)
  const [traceToken,setTraceToken]=useState(0)
  useEffect(()=>{if(!recovering)return;setReconcileStep(0);const interval=window.setInterval(()=>setReconcileStep(value=>Math.min(value+1,reconcilePhases.length-1)),350);const timeout=window.setTimeout(()=>{setPods(desired);setRecovering(false);setReconcileStep(reconcilePhases.length-1)},1400);return()=>{window.clearInterval(interval);window.clearTimeout(timeout)}},[recovering,desired])
  function simulateDelete(){if(recovering||pods===0)return;setPodDeleted(true);setReplacementCount(value=>value+1);setPods(v=>Math.max(0,v-1));setRecovering(true);setTraceToken(value=>value+1)}
  function changeDesired(n:number){setDesired(n);setPodDeleted(false);setRecovering(true);setTraceToken(value=>value+1)}
  return <div className="deploy-scene">
    <div className="deploy-toolbar"><span><Workflow size={15}/> DEPLOYMENT CONTROLLER</span><span className={recovering?'reconciling':'synced'}><i/> {recovering?'RECONCILING':'DESIRED STATE SYNCED'}</span></div>
    <div className="deploy-desired"><div><small>SPEC.REPLICAS · DESIRED</small><strong>{desired}</strong></div><input aria-label="Desired replica count" type="range" min="1" max="6" value={desired} onChange={e=>changeDesired(Number(e.target.value))}/><div><small>STATUS.REPLICAS · READY</small><strong>{recovering?pods:pods}</strong></div></div>
    <div className="reconcile-loop">{reconcilePhases.map((phase,index)=><span className="reconcile-phase-wrap" key={phase.name}><button className={`reconcile-phase ${reconcileStep===index?'reconcile-phase-active':''} ${index<reconcileStep?'reconcile-phase-done':''}`} onClick={()=>{setReconcileStep(index);onSelect(`Reconcile loop: ${phase.name.toLowerCase()}`)}} aria-current={reconcileStep===index?'step':undefined}>{phase.name}</button>{index<reconcilePhases.length-1&&<Activity size={15}/>}</span>)}</div>
    <p className="reconcile-detail" aria-live="polite">{recovering?'RECONCILING · ':''}{reconcilePhases[reconcileStep].detail}</p>
    <SignalTrace title="RECONCILIATION SIGNAL" steps={[
      {label:'Deployment spec',detail:`The Deployment declares a target of ${desired} replicas. The slider changes that desired state.`},
      {label:'ReplicaSet controller',detail:`The ReplicaSet compares its matching Pods with the target. ${recovering ? 'The example is reconciling the difference.' : 'The example is currently reconciled.'}`},
      {label:'replacement Pod',detail:'When a managed Pod is deleted, the ReplicaSet creates a new Pod rather than repairing the deleted object.'},
    ]} playToken={traceToken}/>
    <div className="deploy-pods">{Array.from({length:desired},(_,i)=>{const isReplacement=podDeleted&&i===pods-1;const podName=isReplacement?`web-replacement-${replacementCount}`:`web-${i+1}`;return <motion.button key={podName} layout className={`deploy-pod ${i>=pods?'pod-pending':''} ${isReplacement?'pod-replacement':''}`} onClick={()=>onSelect(`Replica Pod ${podName}`)}><Cuboid size={18}/><b>{podName}</b><small>{i<pods?'READY':recovering?'CREATING':'PENDING'}</small></motion.button>})}</div>
    <div className="deploy-actions"><button onClick={simulateDelete} disabled={recovering||pods===0}>Delete a Pod · observe recovery</button><button className="deploy-reset" onClick={()=>{setPods(desired);setRecovering(false);setPodDeleted(false);setReplacementCount(0)}}><RotateCcw size={14}/> Reset</button></div>
    <p className="deploy-note">A Deployment owns a ReplicaSet; the ReplicaSet creates replacement Pods. It does not repair the deleted Pod in place.</p>
    <LessonCoach task="Delete one Pod and wait for the Deployment to restore the desired replica count." hint="The controller notices that observed replicas are below spec.replicas and creates a replacement Pod through its ReplicaSet." complete={podDeleted&&!recovering&&pods===desired} success={`The ReplicaSet created a replacement. The Deployment is back at ${desired} Ready replicas.`}/>
  </div>
}
