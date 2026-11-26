import { useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Cuboid, Network, Play } from 'lucide-react'
import LessonCoach from './LessonCoach'
import './ServiceLesson.css'
import './ModuleDiagramPolish.css'
type Pod={name:string;ready:boolean;labels:boolean}
export default function ServiceLesson({onSelect}:{onSelect:(name:string)=>void}) {
  const [pods,setPods]=useState<Pod[]>([{name:'api-01',ready:true,labels:true},{name:'api-02',ready:true,labels:true},{name:'api-03',ready:false,labels:true}])
  const [result,setResult]=useState('Toggle readiness or labels, then send a request.')
  const [request,setRequest]=useState(0)
  const [target,setTarget]=useState<string|null>(null)
  const [changedPodState,setChangedPodState]=useState(false)
  const [verifiedChangedState,setVerifiedChangedState]=useState(false)
  const candidates=pods.filter(p=>p.ready&&p.labels)
  function update(i:number,key:'ready'|'labels'){setPods(v=>v.map((p,n)=>n===i?{...p,[key]:!p[key]}:p));setTarget(null);setResult('Pod status changed. Send another request to see the result.');setChangedPodState(true)}
  function send(){const destination=candidates.length?candidates[request%candidates.length].name:null;setRequest(v=>v+1);setTarget(destination);setResult(destination?`The Service sends this request to ${destination}. ${candidates.length} matching Pod${candidates.length===1?' is':'s are'} Ready.`:'No matching Pod is Ready. This request has nowhere to go in this example.');if(changedPodState)setVerifiedChangedState(true)}
  return <div className="service-scene">
    <div className="service-flow-row"><div className="service-client"><Network/><b>CLIENT</b><small>stable DNS name</small></div><span className="service-line">{target&&<i key={`client-${request}`}/>}</span><button className="service-hub-card" onClick={()=>onSelect('Service')}><Activity/><b>Service · api</b><small>selector: app=api</small><code>10.96.14.20</code></button><span className="service-line">{target&&<i key={`backend-${request}`}/>}</span><div className="endpoint-list">{pods.map(p=><motion.button layout key={p.name} className={`endpoint-pod ${p.ready&&p.labels?'endpoint-ready':''} ${target===p.name?'service-target':''}`} onClick={()=>onSelect(p.name)}><Cuboid size={16}/><b>{p.name}</b><small>{!p.labels?'LABEL MISMATCH':p.ready?'READY ENDPOINT':'NOT READY'}</small></motion.button>)}</div></div>
    <div className="pod-toggles"><b>SIMULATE POD STATE</b>{pods.map((p,i)=><div key={p.name}><span>{p.name}</span><button className={p.ready?'toggle-on':'toggle-off'} onClick={()=>update(i,'ready')}>Ready: {p.ready?'yes':'no'}</button><button className={p.labels?'toggle-on':'toggle-off'} onClick={()=>update(i,'labels')}>Label match: {p.labels?'yes':'no'}</button></div>)}</div>
    <p className="service-endpoint-note">EndpointSlices list information about available endpoints; requests do not travel through them. A matching Pod that is not Ready may still appear with ready=false. Special settings and terminating endpoints can change routing.</p>
    <div className="service-result-row"><button className="send-request" onClick={send}><Play size={14}/> Send request</button><motion.p key={request}>{result}</motion.p></div>
    <LessonCoach task="Change a Pod's readiness or app label, then send a request." hint="In this example, a Pod needs a matching label and must be Ready to receive traffic." complete={verifiedChangedState} success="You changed a Pod and tested the Service again. In this example, only matching, Ready Pods receive requests."/>
  </div>
}
