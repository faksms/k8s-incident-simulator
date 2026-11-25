import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Boxes, Container, HardDrive, Network, PackageCheck, Route } from 'lucide-react'
import LessonCoach from './LessonCoach'
import SignalTrace from './SignalTrace'
import './PodsLesson.css'
import './ModuleDiagramPolish.css'

type ContainerType = 'init' | 'sidecar' | 'ambassador'

export default function PodsLesson({onSelect}:{onSelect:(name:string)=>void}) {
  const [extras,setExtras]=useState<Record<ContainerType,boolean>>({init:false,sidecar:false,ambassador:false})
  const toggle=(type:ContainerType)=>setExtras(current=>({...current,[type]:!current[type]}))
  const complete=extras.init&&extras.sidecar&&extras.ambassador
  const traceSteps=['web-app request']
  if(extras.ambassador) traceSteps.push('ambassador proxy')
  if(extras.sidecar) traceSteps.push('log-agent ships telemetry')
  if(extras.init) traceSteps.push('init setup complete')

  return <div className="pods-scene">
    <div className="scene-label-row"><span>NODE 01 · 10.0.4.12</span><span className="healthy-label">● NODE HEALTHY</span></div>
    <div className="pod-node-boundary"><div className="pod-node-title">WORKER NODE <span>kubelet · container runtime · CNI</span></div>
      <div className="pod-runtime"><div className="pod-boundary-card"><div className="pod-boundary-title"><Boxes size={16}/> POD sandbox <span>10.244.1.8</span></div>
        <div className="pod-container-row">
          <button className="pod-container app-container" onClick={()=>onSelect('Application container')}><Container/><b>web-app</b><small>port 8080</small><i>RUNNING</i></button>
          <AnimatePresence>
            {extras.init&&<motion.button className="pod-container init-container" initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.8}} onClick={()=>onSelect('Init container')}><PackageCheck/><b>migrate-db</b><small>runs first</small><i>COMPLETED</i></motion.button>}
            {extras.sidecar&&<motion.button className="pod-container sidecar-container" initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.8}} onClick={()=>onSelect('Sidecar container')}><Network/><b>log-agent</b><small>ships logs</small><i>RUNNING</i></motion.button>}
            {extras.ambassador&&<motion.button className="pod-container ambassador-container" initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.8}} onClick={()=>onSelect('Ambassador container')}><Route/><b>api-proxy</b><small>egress proxy</small><i>RUNNING</i></motion.button>}
          </AnimatePresence>
        </div>
        <div className="pod-shared-row"><button onClick={()=>onSelect('Shared network namespace')}><Network size={14}/> Shared network namespace · localhost</button><button onClick={()=>onSelect('Shared volume')}><HardDrive size={14}/> Shared mounted volume</button></div>
      </div></div>
    </div>
    <div className="pod-actions">
      <button className={extras.init?'action-active':''} onClick={()=>toggle('init')}>{extras.init?'Remove':'Add'} init container</button>
      <button className={extras.sidecar?'action-active':''} onClick={()=>toggle('sidecar')}>{extras.sidecar?'Remove':'Add'} sidecar</button>
      <button className={extras.ambassador?'action-active':''} onClick={()=>toggle('ambassador')}>{extras.ambassador?'Remove':'Add'} ambassador</button>
    </div>
    <SignalTrace title="POD CONTAINER PATH" steps={traceSteps} onSelect={step=>onSelect(step.includes('ambassador')?'Ambassador container':step.includes('log-agent')?'Sidecar container':step.includes('init')?'Init container':'Application container')}/>
    <div className="pod-insight"><b>BOUNDARY CHECK</b><span>One Pod IP · shared ports · init/setup lifecycle · helpers share the application lifecycle</span></div>
    <LessonCoach task="Build a Pod with an init container, a sidecar, and an ambassador. Then compare their roles." hint="Init containers finish in sequence before app containers start. Sidecars work alongside the app. Ambassadors proxy or abstract connections for the app." complete={complete} success="You explored all three helper patterns inside a shared Pod boundary."/>
  </div>
}
