import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Boxes, Container, HardDrive, Network, PackageCheck, Route } from 'lucide-react'
import LessonCoach from './LessonCoach'
import StepSequenceControls from './StepSequenceControls'
import './PodsLesson.css'
import './ModuleDiagramPolish.css'

type ContainerType = 'init' | 'sidecar' | 'ambassador'
const initSteps = [
  'The application waits while the Pod initializes.',
  'The init container runs its setup.',
  'Setup completes successfully.',
  'The application container starts.',
]

export default function PodsLesson({onSelect}:{onSelect:(name:string)=>void}) {
  const [extras,setExtras]=useState<Record<ContainerType,boolean>>({init:false,sidecar:false,ambassador:false})
  const [step,setStep]=useState(0)
  const [playing,setPlaying]=useState(false)
  const reducedMotion=useReducedMotion()
  useEffect(()=>{
    if(!playing || step>=initSteps.length-1) return
    const timer=window.setTimeout(()=>setStep(value=>value+1),2800)
    return ()=>window.clearTimeout(timer)
  },[playing,step])
  useEffect(()=>{if(step===initSteps.length-1)setPlaying(false)},[step])
  const toggle=(type:ContainerType)=>{
    if(type==='init'){
      setStep(0)
      setPlaying(!extras.init && !reducedMotion)
    }
    setExtras(current=>({...current,[type]:!current[type]}))
  }
  const complete=extras.init&&extras.sidecar&&extras.ambassador
  const appRunning=!extras.init || step===3

  return <div className="pods-scene">
    <div className="scene-label-row"><span>NODE 01 · 10.0.4.12</span><span className="healthy-label">● NODE HEALTHY</span></div>
    <div className="pod-node-boundary"><div className="pod-node-title">WORKER NODE <span>kubelet · container runtime · CNI</span></div>
      <div className="pod-runtime"><div className="pod-boundary-card"><div className="pod-boundary-title"><Boxes size={16}/> POD sandbox <span>10.244.1.8</span></div>
        <div className="pod-container-row">
          <button className={`pod-container app-container ${!appRunning?'pod-waiting':''}`} onClick={()=>onSelect('Application container')}><Container/><b>web-app</b><small>port 8080</small><i>{appRunning?'RUNNING':'WAITING'}</i></button>
          <AnimatePresence>
            {extras.init&&<motion.button key="init" className={`pod-container init-container ${step===1?'pod-init-active':''}`} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>onSelect('Init container')}><PackageCheck/><b>migrate-db</b><small>ordinary init</small><i>{step===0?'WAITING':step===1?'RUNNING':'COMPLETED'}</i></motion.button>}
            {extras.sidecar&&<motion.button key="sidecar" className="pod-container sidecar-container" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>onSelect('Sidecar container')}><Network/><b>log-agent</b><small>helper container</small><i>{appRunning?'RUNNING':'WAITING'}</i></motion.button>}
            {extras.ambassador&&<motion.button key="ambassador" className="pod-container ambassador-container" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>onSelect('Ambassador container')}><Route/><b>api-proxy</b><small>egress proxy</small><i>{appRunning?'RUNNING':'WAITING'}</i></motion.button>}
          </AnimatePresence>
        </div>
        <div className="pod-shared-row"><button onClick={()=>onSelect('Shared network namespace')}><Network size={14}/> Shared network namespace · localhost</button><button onClick={()=>onSelect('Shared volume')}><HardDrive size={14}/> Shared mounted volume</button></div>
        {extras.init&&<div className="pod-init-sequence"><p aria-live="polite"><b>{step+1} / {initSteps.length}</b> {initSteps[step]}</p><StepSequenceControls active={step} total={initSteps.length} playing={playing} onPrevious={()=>{setPlaying(false);setStep(value=>Math.max(0,value-1))}} onNext={()=>{setPlaying(false);setStep(value=>Math.min(initSteps.length-1,value+1))}} onToggle={()=>{if(step===initSteps.length-1)setStep(0);setPlaying(value=>!value)}} onReset={()=>{setPlaying(false);setStep(0)}} compact/></div>}
      </div></div>
    </div>
    <div className="pod-actions">
      <button className={extras.init?'action-active':''} onClick={()=>toggle('init')}>{extras.init?'Remove':'Add'} init container</button>
      <button className={extras.sidecar?'action-active':''} onClick={()=>toggle('sidecar')}>{extras.sidecar?'Remove':'Add'} sidecar</button>
      <button className={extras.ambassador?'action-active':''} onClick={()=>toggle('ambassador')}>{extras.ambassador?'Remove':'Add'} ambassador</button>
    </div>
    <div className="pod-insight"><b>BOUNDARY CHECK</b><span>One Pod IP · shared ports · init/setup lifecycle · helpers share the application lifecycle</span></div>
    <LessonCoach task="Build a Pod with an init container, a sidecar, and an ambassador. Then compare their roles." hint="Init containers finish in sequence before app containers start. Sidecars work alongside the app. Ambassadors proxy or abstract connections for the app." complete={complete} success="You explored all three helper patterns inside a shared Pod boundary."/>
  </div>
}
