import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Activity, HeartPulse, Pause, Play, Rocket, RotateCcw, ShieldCheck } from 'lucide-react'
import LessonCoach from './LessonCoach'
import './ProbesLesson.css'
import './ModuleDiagramPolish.css'

type Probe = 'startup' | 'readiness' | 'liveness'

type ProbeState = {
  startup: 'waiting' | 'success' | 'failure'
  readiness: 'ready' | 'not-ready'
  liveness: 'healthy' | 'failure'
}

const probeInfo:Record<Probe,{title:string;icon:typeof Rocket;color:string;endpoint:string;success:string;failure:string}>={
  startup:{title:'Startup probe',icon:Rocket,color:'#73bff0',endpoint:'/started',success:'Application initialization complete. Startup gate opened.',failure:'Initialization failed. Readiness and liveness remain gated.'},
  readiness:{title:'Readiness probe',icon:Activity,color:'#76ddb5',endpoint:'/ready',success:'Pod is Ready. Service endpoints include this Pod.',failure:'Pod is NotReady. It was removed from Service endpoints.'},
  liveness:{title:'Liveness probe',icon:HeartPulse,color:'#ff9d78',endpoint:'/healthz',success:'Liveness recovered. Container remains running.',failure:'Liveness failed. Container restart is triggered.'},
}

export default function ProbesLesson({onSelect}:{onSelect:(name:string)=>void}){
  const [active,setActive]=useState<Probe>('startup')
  const [state,setState]=useState<ProbeState>({startup:'waiting',readiness:'ready',liveness:'healthy'})
  const [playing,setPlaying]=useState(false)
  const [phase,setPhase]=useState(0)
  const [restartCount,setRestartCount]=useState(0)
  const [eventCount,setEventCount]=useState(0)
  const [tested,setTested]=useState<Set<Probe>>(()=>new Set())
  const reducedMotion=useReducedMotion()
  const info=probeInfo[active]
  const Icon=info.icon

  useEffect(()=>{
    if(!playing)return
    if(reducedMotion){setPhase(3);setPlaying(false);return}
    if(phase>=3){setPlaying(false);return}
    const timer=window.setTimeout(()=>setPhase(current=>current+1),950)
    return ()=>window.clearTimeout(timer)
  },[playing,phase,reducedMotion])

  useEffect(()=>{
    if(!playing)return
    if(phase===1)setEventCount(value=>value+1)
  },[phase,playing])

  function run(failure=false){
    setTested(current=>new Set(current).add(active))
    setPhase(0)
    setPlaying(!reducedMotion)
    if(reducedMotion)setPhase(3)

    if(active==='startup') setState(current=>({...current,startup:failure?'failure':'success'}))
    if(active==='readiness') setState(current=>({...current,readiness:failure?'not-ready':'ready'}))
    if(active==='liveness'){
      setState(current=>({...current,liveness:failure?'failure':'healthy'}))
      if(failure)setRestartCount(value=>value+1)
    }
  }

  function reset(){
    setPlaying(false);setPhase(0);setEventCount(0);setRestartCount(0)
    setState({startup:'waiting',readiness:'ready',liveness:'healthy'})
  }

  function togglePlayback(){
    if(playing){setPlaying(false);return}
    setPhase(0)
    setPlaying(!reducedMotion)
    if(reducedMotion)setPhase(3)
  }

  const startupFailed=state.startup==='failure'
  const readinessFailed=state.readiness==='not-ready'
  const livenessFailed=state.liveness==='failure'
  const activeFailure=active==='startup'?startupFailed:active==='readiness'?readinessFailed:livenessFailed

  return <div className={`probes-scene ${activeFailure?'probes-failure':''}`}>
    <div className="probe-tabs" role="tablist" aria-label="Container probes">
      {(Object.keys(probeInfo) as Probe[]).map(key=>{const item=probeInfo[key];const ProbeIcon=item.icon;const failure=key==='startup'?startupFailed:key==='readiness'?readinessFailed:livenessFailed;return <button key={key} role="tab" aria-selected={active===key} className={`${active===key?'probe-tab-active':''} ${failure?'probe-tab-failed':''}`} onClick={()=>{setActive(key);setPhase(0);setPlaying(false);onSelect(item.title)}}><ProbeIcon size={15}/><b>{item.title}</b><small>{key==='startup'?'INITIALIZATION':key==='readiness'?'TRAFFIC ELIGIBILITY':'PROCESS HEALTH'}{failure?' · FAILURE':''}</small></button>})}
    </div>

    <motion.section key={active} className="probe-workbench" initial={{opacity:0,y:7}} animate={{opacity:1,y:0}}>
      <header><span><Icon size={18}/> LIVE PROBE FLOW</span><div><small>EVENTS {String(eventCount).padStart(2,'0')}</small><button onClick={togglePlayback} aria-label={playing?'Pause probe flow':'Play probe flow'}>{playing?<Pause size={14}/>:<Play size={14}/>}</button><button onClick={reset} aria-label="Reset probe simulation"><RotateCcw size={14}/></button></div></header>

      <div className="probe-flow" aria-label={`${info.title} animated flow`}>
        <span className="probe-flow-line"/>
        <motion.i className="probe-flow-packet" animate={{left:phase===0?'9%':phase===1?'38%':phase===2?'68%':'91%'}} transition={reducedMotion?{duration:0}:{type:'spring',stiffness:95,damping:18}}/>

        <button className={`probe-node kubelet-node ${phase===0?'node-active':''}`} onClick={()=>onSelect('Kubelet')}><ShieldCheck size={18}/><b>kubelet</b><small>probe worker</small></button>
        <motion.button className={`probe-node request-node ${phase===1?'node-active':''} ${activeFailure?'node-failed':''}`} onClick={()=>onSelect(info.title)} animate={activeFailure&&phase>=1?{scale:[1,.96,1]}:{scale:1}} transition={{duration:.7,repeat:activeFailure&&phase>=1?Infinity:0}}><Icon size={18}/><b>{info.title}</b><small>{info.endpoint}</small></motion.button>
        <button className={`probe-node container-node ${phase===2?'node-active':''} ${livenessFailed?'node-failed':''}`} onClick={()=>onSelect('Application container')}><Activity size={18}/><b>container</b><small>{livenessFailed?'RESTARTING':active==='startup'&&startupFailed?'NOT STARTED':active==='readiness'&&readinessFailed?'NOT READY':'RUNNING'}</small></button>
        <button className={`probe-node endpoint-node ${phase===3?'node-active':''} ${readinessFailed?'endpoint-blocked':''}`} onClick={()=>onSelect('Service endpoints')}><HeartPulse size={18}/><b>Service endpoint</b><small>{readinessFailed?'REMOVED':'ELIGIBLE'}</small></button>
      </div>

      <motion.div key={`${active}-${activeFailure}-${phase}`} className={`probe-live-result ${activeFailure?'probe-live-failure':''}`} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} aria-live="polite">
        <i/><div><b>{phase===0?'WAITING FOR PROBE':active.toUpperCase()+` · ${activeFailure?'FAILURE':'SUCCESS'}`}</b><p>{activeFailure?info.failure:info.success}</p></div><span>{activeFailure?'LIVE FAILURE':'LIVE STATE'}</span>
      </motion.div>

      <div className="probe-controls">
        <button className="probe-pass" onClick={()=>run(false)}><Play size={14}/> Simulate success</button>
        <button className="probe-fail" onClick={()=>run(true)}><HeartPulse size={14}/> Trigger failure</button>
      </div>
    </motion.section>

    <div className="probe-lifecycle">
      <span className={state.startup==='success'?'lifecycle-active':''}><b>1</b><span><strong>STARTUP</strong>{startupFailed?'blocked':state.startup==='success'?'gate opened':'waiting'}</span></span>
      <span className={readinessFailed?'lifecycle-failed':state.readiness==='ready'?'lifecycle-active':''}><b>2</b><span><strong>READINESS</strong>{readinessFailed?'NotReady':'Ready endpoint'}</span></span>
      <span className={livenessFailed?'lifecycle-failed':'lifecycle-active'}><b>3</b><span><strong>LIVENESS</strong>{livenessFailed?`restart ${restartCount}`:'healthy'}</span></span>
    </div>
    <LessonCoach task="Run success and trigger failure for each probe. Watch the animated packet and observe which Kubernetes behavior changes." hint="Startup can gate the other checks. Readiness controls Service endpoint eligibility. Repeated liveness failure causes a container restart." complete={tested.size===3&&activeFailure===false&&restartCount>0} success="You tested all probe states and saw their live Kubernetes effects."/>
  </div>
}
