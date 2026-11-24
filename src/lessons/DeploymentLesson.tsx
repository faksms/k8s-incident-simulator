import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Cuboid, RotateCcw, Workflow } from 'lucide-react'
import './DeploymentLesson.css'
export default function DeploymentLesson({onSelect}:{onSelect:(name:string)=>void}) {
  const [desired,setDesired]=useState(3)
  const [pods,setPods]=useState(3)
  const [recovering,setRecovering]=useState(false)
  useEffect(()=>{if(!recovering)return;const t=window.setTimeout(()=>{setPods(desired);setRecovering(false)},1300);return()=>window.clearTimeout(t)},[recovering,desired])
  function simulateDelete(){if(recovering||pods===0)return;setPods(v=>Math.max(0,v-1));setRecovering(true)}
  function changeDesired(n:number){setDesired(n);if(!recovering)setPods(n)}
  return <div className="deploy-scene">
    <div className="deploy-toolbar"><span><Workflow size={15}/> DEPLOYMENT CONTROLLER</span><span className={recovering?'reconciling':'synced'}><i/> {recovering?'RECONCILING':'DESIRED STATE SYNCED'}</span></div>
    <div className="deploy-desired"><div><small>SPEC.REPLICAS · DESIRED</small><strong>{desired}</strong></div><input aria-label="Desired replica count" type="range" min="1" max="6" value={desired} onChange={e=>changeDesired(Number(e.target.value))}/><div><small>STATUS.REPLICAS · READY</small><strong>{recovering?pods:pods}</strong></div></div>
    <div className="reconcile-loop"><span>OBSERVE</span><Activity size={15}/><span>COMPARE</span><Activity size={15}/><span>ACT</span><Activity size={15}/><span>REPEAT</span></div>
    <div className="deploy-pods">{Array.from({length:desired},(_,i)=><motion.button key={i} layout className={`deploy-pod ${i>=pods?'pod-pending':''}`} onClick={()=>onSelect(`Replica Pod ${i+1}`)}><Cuboid size={18}/><b>web-{i+1}</b><small>{i<pods?'READY':recovering?'CREATING':'PENDING'}</small></motion.button>)}</div>
    <div className="deploy-actions"><button onClick={simulateDelete} disabled={recovering||pods===0}>Delete a Pod · observe recovery</button><button className="deploy-reset" onClick={()=>{setPods(desired);setRecovering(false)}}><RotateCcw size={14}/> Reset</button></div>
    <p className="deploy-note">A Deployment owns a ReplicaSet; the ReplicaSet creates replacement Pods. It does not repair the deleted Pod in place.</p>
  </div>
}
