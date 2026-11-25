import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Activity, HeartPulse, Pause, Play, RefreshCw, Rocket, RotateCcw, ShieldCheck, Waypoints } from 'lucide-react'
import LessonCoach from './LessonCoach'
import './ProbesLesson.css'
import './ModuleDiagramPolish.css'

const stages = [
  {title:'CONTAINER BOOT',detail:'Kubelet starts the container and waits for the process to initialize.'},
  {title:'STARTUP PROBE',detail:'The kubelet calls /started until application initialization succeeds.'},
  {title:'STARTUP GATE',detail:'Startup probe success opens readiness and liveness checks.'},
  {title:'READINESS PROBE',detail:'The kubelet checks /ready before publishing Pod 10.244.1.8.'},
  {title:'ENDPOINT UPDATE',detail:'EndpointSlice membership is updated for Service 10.96.20.40.'},
  {title:'CLUSTERIP TRAFFIC',detail:'ClusterIP sends traffic only to Ready Pods.'},
  {title:'LIVENESS PROBE',detail:'The kubelet periodically calls /healthz to detect an unrecoverable process.'},
  {title:'HEALTH RESULT',detail:'Success keeps the container running; failure enters recovery.'},
  {title:'CONTAINER KILL',detail:'Liveness failure kills the container and removes its process from the node.'},
  {title:'CONTAINER RESTART',detail:'The runtime restarts the container in the existing Pod network namespace.'},
  {title:'BOOT AGAIN',detail:'Startup runs again before readiness traffic is restored.'},
]

export default function ProbesLesson({onSelect}:{onSelect:(name:string)=>void}){
  const [stage,setStage]=useState(0)
  const [playing,setPlaying]=useState(true)
  const [startupFailure,setStartupFailure]=useState(false)
  const [readinessFailure,setReadinessFailure]=useState(false)
  const [livenessFailure,setLivenessFailure]=useState(false)
  const [restartCount,setRestartCount]=useState(0)
  const [tested,setTested]=useState<Set<string>>(()=>new Set())
  const reducedMotion=useReducedMotion()

  useEffect(()=>{
    if(!playing||reducedMotion)return
    const timer=window.setTimeout(()=>{
      setStage(current=>{
        if(current===1&&startupFailure)return 1
        if(current===3&&readinessFailure)return 4
        if(current===7&&livenessFailure)return 8
        if(current===8)return 9
        if(current===9){setRestartCount(value=>value+1);return 10}
        if(current===10)return 0
        return current+1
      })
    },stage===8||stage===9?1350:900)
    return ()=>window.clearTimeout(timer)
  },[playing,reducedMotion,stage,startupFailure,readinessFailure,livenessFailure])

  useEffect(()=>{if(stage===8)setRestartCount(value=>value)},[stage])

  function reset(){setStage(0);setRestartCount(0);setStartupFailure(false);setReadinessFailure(false);setLivenessFailure(false);setPlaying(true);setTested(new Set())}

  const startupBlocked=stage===1&&startupFailure
  const readinessBlocked=stage>=3&&readinessFailure
  const killed=stage===8||(stage===9&&livenessFailure)
  const endpointEligible=!readinessBlocked&&!startupBlocked&&!killed
  const current=stages[stage]

  function toggleFailure(type:'startup'|'readiness'|'liveness'){
    if(type==='startup')setStartupFailure(value=>{setTested(current=>new Set(current).add('startup'));return !value})
    if(type==='readiness')setReadinessFailure(value=>{setTested(current=>new Set(current).add('readiness'));return !value})
    if(type==='liveness')setLivenessFailure(value=>{setTested(current=>new Set(current).add('liveness'));return !value})
  }

  return <div className="probes-scene probes-continuous">
    <div className="probe-sim-toolbar">
      <div><span className="probe-live-dot"/> CONTINUOUS POD LIFECYCLE</div>
      <div><button onClick={()=>setPlaying(value=>!value)}>{playing?<Pause size={14}/>:<Play size={14}/>} {playing?'Pause':'Play'}</button><button onClick={reset}><RotateCcw size={14}/> Reset</button></div>
    </div>

    <motion.section className={`probe-lifecycle-workbench ${startupBlocked||readinessBlocked||killed?'probe-lifecycle-failure':''}`} key={stage} initial={{opacity:.72,y:6}} animate={{opacity:1,y:0}}>
      <header>
        <div><small>{String(stage+1).padStart(2,'0')} / {String(stages.length).padStart(2,'0')}</small><b>{current.title}</b></div>
        <span className="probe-phase-status">{killed?'CONTAINER KILLED':startupBlocked?'STARTUP BLOCKED':readinessBlocked?'NOT READY':'LIVE'}</span>
      </header>

      <div className="pod-lifecycle-map">
        <motion.div className="lifecycle-packet" animate={{left: `${8+stage*(84/(stages.length-1))}%`}} transition={reducedMotion?{duration:0}:{type:'spring',stiffness:70,damping:16}}/>

        <motion.button className={`lifecycle-node kubelet-node ${stage<=2?'lifecycle-node-active':''}`} onClick={()=>onSelect('Kubelet')}><ShieldCheck size={18}/><b>Kubelet</b><small>probe orchestration</small></motion.button>

        <motion.button className={`lifecycle-node startup-node ${stage===1?'lifecycle-node-active':''} ${startupBlocked?'lifecycle-node-failed':''}`} onClick={()=>onSelect('Startup probe')}><Rocket size={18}/><b>Startup</b><small>/started · {startupBlocked?'FAILURE':'gate'}</small></motion.button>

        <motion.button className={`lifecycle-node container-node ${stage===0||stage>=8?'lifecycle-node-active':''} ${killed?'lifecycle-node-failed':''} ${stage===9?'lifecycle-node-restarting':''}`} onClick={()=>onSelect('Application container')}><Activity size={18}/><b>Container</b><small>{killed?'KILLED':stage===9?'RESTARTING':stage===0?'BOOTING':'RUNNING'}</small></motion.button>

        <motion.button className={`lifecycle-node readiness-node ${stage===3?'lifecycle-node-active':''} ${readinessBlocked?'lifecycle-node-failed':''}`} onClick={()=>onSelect('Readiness probe')}><HeartPulse size={18}/><b>Readiness</b><small>/ready · {readinessBlocked?'NotReady':'Ready'}</small></motion.button>

        <motion.button className={`lifecycle-node service-node ${stage>=4&&stage<=6?'lifecycle-node-active':''} ${!endpointEligible?'lifecycle-node-failed':''}`} onClick={()=>onSelect('Service ClusterIP')}><Waypoints size={18}/><b>ClusterIP</b><small>10.96.20.40</small></motion.button>

        <motion.button className={`lifecycle-node liveness-node ${stage===6||stage===7?'lifecycle-node-active':''} ${stage===7&&livenessFailure?'lifecycle-node-failed':''}`} onClick={()=>onSelect('Liveness probe')}><RefreshCw size={18}/><b>Liveness</b><small>/healthz · {stage===7&&livenessFailure?'KILL':livenessFailure?'armed':'healthy'}</small></motion.button>

        <span className="lifecycle-line one"/><span className="lifecycle-line two"/><span className="lifecycle-line three"/><span className="lifecycle-line four"/>
      </div>

      <div className="pod-network-state">
        <div className={killed?'network-killed':''}><small>POD IP</small><b>10.244.1.8</b><span>{killed?'NAMESPACE PAUSED':'NETWORK READY'}</span></div>
        <div className={!endpointEligible?'endpoint-removed':''}><small>ENDPOINTSLICE</small><b>{endpointEligible?'10.244.1.8:8080':'NO ENDPOINT'}</b><span>{endpointEligible?'READY · RECEIVE':'REMOVED · NO TRAFFIC'}</span></div>
        <div><small>RESTART POLICY</small><b>Always</b><span>restart #{restartCount}</span></div>
      </div>

      <motion.div className={`probe-explanation ${startupBlocked||readinessBlocked||killed?'probe-explanation-fail':''}`} key={current.title} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} aria-live="polite"><i/><div><b>{current.title}</b><p>{startupBlocked?'Startup has not passed. Liveness and readiness stay gated, and no traffic is published.':readinessBlocked?'Readiness failed. The Pod stays running, but EndpointSlice removes it and ClusterIP sends no traffic to 10.244.1.8.':killed?'Liveness failed. kubelet restarts the container, while Pod IP and ClusterIP configuration remain stable.':current.detail}</p></div></motion.div>
    </motion.section>

    <div className="probe-failure-controls">
      <button className={startupFailure?'failure-active':''} onClick={()=>toggleFailure('startup')}><Rocket size={14}/> Startup failure</button>
      <button className={readinessFailure?'failure-active':''} onClick={()=>toggleFailure('readiness')}><HeartPulse size={14}/> Readiness failure</button>
      <button className={livenessFailure?'failure-active':''} onClick={()=>toggleFailure('liveness')}><RefreshCw size={14}/> Liveness / kill</button>
    </div>

    <LessonCoach task="Let the Pod boot through probes, then enable startup, readiness, or liveness failure and observe exactly what traffic and restart behavior changes." hint="Startup blocks later probes. Readiness removes only endpoint traffic eligibility. Liveness kills and restarts the container but the Pod IP remains stable." complete={tested.size===3} success="You traced the complete probe lifecycle and every traffic or container recovery branch."/>
  </div>
}
