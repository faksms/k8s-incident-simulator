import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Boxes, Container, HardDrive, Network } from 'lucide-react'
import LessonCoach from './LessonCoach'
import './PodsLesson.css'
export default function PodsLesson({onSelect}:{onSelect:(name:string)=>void}) {
  const [sidecar,setSidecar]=useState(false)
  return <div className="pods-scene">
    <div className="scene-label-row"><span>NODE 01 · 10.0.4.12</span><span className="healthy-label">● NODE HEALTHY</span></div>
    <div className="pod-node-boundary"><div className="pod-node-title">WORKER NODE <span>kubelet · container runtime · CNI</span></div>
      <div className="pod-runtime"><div className="pod-boundary-card"><div className="pod-boundary-title"><Boxes size={16}/> POD sandbox <span>10.244.1.8</span></div><div className="pod-container-row">
        <button className="pod-container app-container" onClick={()=>onSelect('Application container')}><Container/><b>web-app</b><small>port 8080</small><i>RUNNING</i></button>
        <AnimatePresence>{sidecar&&<motion.button className="pod-container sidecar-container" initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.8}} onClick={()=>onSelect('Sidecar container')}><Network/><b>log-agent</b><small>ships logs</small><i>RUNNING</i></motion.button>}</AnimatePresence>
      </div><div className="pod-shared-row"><button onClick={()=>onSelect('Shared network namespace')}><Network size={14}/> Shared network namespace · localhost</button><button onClick={()=>onSelect('Shared volume')}><HardDrive size={14}/> Shared mounted volume</button></div></div></div>
    </div>
    <div className="pod-actions"><button onClick={()=>setSidecar(v=>!v)}>{sidecar?'Remove sidecar':'Add sidecar container'}</button><span>Containers can be added or removed; the Pod remains one scheduling unit.</span></div>
    <div className="pod-insight"><b>BOUNDARY CHECK</b><span>One Pod IP · shared ports · optional shared volumes · containers scheduled together</span></div>
    <LessonCoach task="Add the log-agent sidecar and watch what changes inside the Pod." hint="A sidecar is a second container in the same Pod. It shares the Pod network namespace and can use a shared mounted volume." complete={sidecar} success="Both containers remain in one Pod and share its network identity; the Pod is still scheduled as one unit."/>
  </div>
}
