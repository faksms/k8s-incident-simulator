import { useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Cuboid, Network, Play } from 'lucide-react'
import LessonCoach from './LessonCoach'
import SignalTrace from './SignalTrace'
import './ServiceLesson.css'
import './ModuleDiagramPolish.css'
type Pod={name:string;ready:boolean;labels:boolean}
export default function ServiceLesson({onSelect}:{onSelect:(name:string)=>void}) {
  const [pods,setPods]=useState<Pod[]>([{name:'api-01',ready:true,labels:true},{name:'api-02',ready:true,labels:true},{name:'api-03',ready:false,labels:true}])
  const [result,setResult]=useState('Toggle readiness or labels, then send a request.')
  const [request,setRequest]=useState(0)
  const [changedPodState,setChangedPodState]=useState(false)
  const [verifiedChangedState,setVerifiedChangedState]=useState(false)
  const candidates=pods.filter(p=>p.ready&&p.labels)
  function update(i:number,key:'ready'|'labels'){setPods(v=>v.map((p,n)=>n===i?{...p,[key]:!p[key]}:p));setChangedPodState(true)}
  function send(){setRequest(v=>v+1);setResult(candidates.length?`EndpointSlice includes ${candidates.length} Ready Pod${candidates.length===1?'':'s'}; request routed to ${candidates[request%candidates.length].name}.`:'No eligible endpoints. Service has nowhere Ready to send this request.');if(changedPodState)setVerifiedChangedState(true)}
  return <div className="service-scene">
    <div className="service-flow-row"><div className="service-client"><Network/><b>CLIENT</b><small>stable DNS name</small></div><span className="service-line"><i/></span><button className="service-hub-card" onClick={()=>onSelect('Service')}><Activity/><b>Service · api</b><small>selector: app=api</small><code>10.96.14.20</code></button><span className="service-line"><i/></span><div className="endpoint-list">{pods.map((p,i)=><motion.button layout key={p.name} className={`endpoint-pod ${p.ready&&p.labels?'endpoint-ready':''}`} onClick={()=>onSelect(p.name)}><Cuboid size={16}/><b>{p.name}</b><small>{!p.labels?'LABEL MISMATCH':p.ready?'READY ENDPOINT':'NOT READY'}</small></motion.button>)}</div></div>
    <div className="pod-toggles"><b>SIMULATE POD STATE</b>{pods.map((p,i)=><div key={p.name}><span>{p.name}</span><button className={p.ready?'toggle-on':'toggle-off'} onClick={()=>update(i,'ready')}>Ready: {p.ready?'yes':'no'}</button><button className={p.labels?'toggle-on':'toggle-off'} onClick={()=>update(i,'labels')}>Label match: {p.labels?'yes':'no'}</button></div>)}</div>
    <SignalTrace title="SERVICE REQUEST PATH" steps={['client', 'Service VIP', 'EndpointSlice', candidates.length?`ready Pod · ${candidates[request%candidates.length].name}`:'no eligible endpoint']} playToken={request} onSelect={step => onSelect(step.includes('ready Pod') ? step.split('· ')[1] : step === 'Service VIP' ? 'Service' : step)}/>
    <div className="service-result-row"><button className="send-request" onClick={send}><Play size={14}/> Send request</button><motion.p key={request}>{result}</motion.p></div>
    <LessonCoach task="Change a Pod's readiness or app label, then send a request to see how endpoint eligibility changes." hint="A Service selector must match the Pod labels, and the Pod must be Ready. Either condition can remove a Pod from the usable endpoint set." complete={verifiedChangedState} success="You changed Pod state and tested the Service again. Only matching, Ready Pods can receive the request."/>
  </div>
}
