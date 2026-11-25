import { useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, HeartPulse, Play, Rocket } from 'lucide-react'
import LessonCoach from './LessonCoach'
import './ProbesLesson.css'
import './ModuleDiagramPolish.css'

type Probe = 'startup' | 'readiness' | 'liveness'

const probeInfo:Record<Probe,{title:string;icon:typeof Rocket;color:string;action:string;effect:string}>={
  startup:{title:'Startup probe',icon:Rocket,color:'#73bff0',action:'check initialization',effect:'While startup fails, liveness and readiness checks are not started.'},
  readiness:{title:'Readiness probe',icon:Activity,color:'#76ddb5',action:'check request readiness',effect:'Failure removes the Pod from Service endpoints, but does not restart it.'},
  liveness:{title:'Liveness probe',icon:HeartPulse,color:'#ff9d78',action:'check process health',effect:'Repeated failure restarts the container according to its restart policy.'},
}

export default function ProbesLesson({onSelect}:{onSelect:(name:string)=>void}){
  const [active,setActive]=useState<Probe>('startup')
  const [started,setStarted]=useState(false)
  const [ready,setReady]=useState(false)
  const [healthy,setHealthy]=useState(true)
  const [restart,setRestart]=useState(0)
  const [tested,setTested]=useState<Set<Probe>>(()=>new Set())
  const info=probeInfo[active]
  const Icon=info.icon

  function runProbe(){
    setTested(current=>new Set(current).add(active))
    if(active==='startup') setStarted(current=>!current)
    if(active==='readiness') setReady(current=>!current)
    if(active==='liveness'){
      if(healthy){setHealthy(false);setRestart(current=>current+1)}
      else setHealthy(true)
    }
  }

  return <div className="probes-scene">
    <div className="probe-tabs" role="tablist" aria-label="Container probes">
      {(Object.keys(probeInfo) as Probe[]).map(key=>{const item=probeInfo[key];const ProbeIcon=item.icon;return <button key={key} role="tab" aria-selected={active===key} className={active===key?'probe-tab-active':''} onClick={()=>{setActive(key);onSelect(item.title)}}><ProbeIcon size={15}/><b>{item.title}</b><small>{key==='startup'?'INITIALIZATION':key==='readiness'?'TRAFFIC ELIGIBILITY':'PROCESS HEALTH'}</small></button>})}
    </div>

    <motion.section key={active} className="probe-workbench" initial={{opacity:0,y:7}} animate={{opacity:1,y:0}}>
      <header><span><Icon size={18}/> {info.title}</span><b>{started&&active==='startup'?'STARTED':ready&&active==='readiness'?'READY':healthy?'HEALTHY':'FAILURE'}</b></header>
      <div className="probe-timeline">
        <div className={`probe-stage ${started?'probe-stage-active':''}`}><Rocket size={15}/><b>startup</b><small>{started?'complete':'waiting'}</small></div>
        <span className="probe-link"/><div className={`probe-stage ${ready?'probe-stage-active':''}`}><Activity size={15}/><b>readiness</b><small>{ready?'Ready':'NotReady'}</small></div>
        <span className="probe-link"/><div className={`probe-stage ${!healthy?'probe-stage-failed':'probe-stage-active'}`}><HeartPulse size={15}/><b>liveness</b><small>{healthy?'alive':`restart ${restart}`}</small></div>
      </div>
      <motion.div className="probe-result" animate={{borderColor:active==='liveness'&&!healthy?'#ff9d78':'#35506a'}}><i style={{background:info.color}}/><div><b>{info.action}</b><p>{info.effect}</p></div></motion.div>
      <button className="run-probe" onClick={runProbe}><Play size={14}/>{active==='liveness'?'Simulate probe failure':'Toggle probe state'}</button>
    </motion.section>

    <div className="probe-lifecycle"><span><b>1</b> Startup gates app initialization</span><span><b>2</b> Readiness gates traffic</span><span><b>3</b> Liveness can restart a container</span></div>
    <LessonCoach task="Try startup, readiness, and liveness behavior. Notice that one probe removes traffic eligibility while another restarts a container." hint="Startup does not receive traffic decisions. Readiness affects endpoint membership. Liveness repeated failure causes a container restart." complete={tested.size===3} success="You compared all three probe purposes and their distinct outcomes."/>
  </div>
}
