import { useState } from 'react'
import { Activity, Cuboid, Network, Play, RotateCcw } from 'lucide-react'
import LessonCoach from './LessonCoach'
import { estimateServiceTraffic } from './serviceExperiment'
import type { ServicePod } from './serviceExperiment'
import './ServiceLesson.css'
import './ServiceExperiment.css'
import './ModuleDiagramPolish.css'

const initialPods: ServicePod[] = [
  { name: 'api-01', ready: true, labels: true },
  { name: 'api-02', ready: true, labels: true },
  { name: 'api-03', ready: false, labels: true },
]
const format = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1)

export default function ServiceLesson({ onSelect }: { onSelect: (name: string) => void }) {
  const [pods, setPods] = useState(initialPods)
  const [incoming, setIncoming] = useState(300)
  const [capacity, setCapacity] = useState(200)
  const [result, setResult] = useState('Change a Pod, then send a request to test the selector and readiness.')
  const [request, setRequest] = useState(0)
  const [target, setTarget] = useState<string | null>(null)
  const [changedPodState, setChangedPodState] = useState(false)
  const [verifiedChangedState, setVerifiedChangedState] = useState(false)
  const estimate = estimateServiceTraffic(pods, incoming, capacity)
  const candidates = pods.filter(pod => pod.ready && pod.labels)

  function update(index: number, key: 'ready' | 'labels') {
    setPods(current => current.map((pod, i) => i === index ? { ...pod, [key]: !pod[key] } : pod))
    setTarget(null)
    setResult('Pod status changed. Send another request to see the result.')
    setChangedPodState(true)
    setVerifiedChangedState(false)
  }

  function send() {
    const destination = candidates.length ? candidates[request % candidates.length].name : null
    setRequest(current => current + 1)
    setTarget(destination)
    setResult(destination ? `This example selects ${destination}. ${candidates.length} matching Pod${candidates.length === 1 ? ' is' : 's are'} Ready; selection does not guarantee a response.` : 'No matching Pod is Ready. This request has nowhere to go in this example.')
    if (changedPodState) setVerifiedChangedState(true)
  }

  function reset() {
    setPods(initialPods)
    setIncoming(300)
    setCapacity(200)
    setResult('Change a Pod, then send a request to test the selector and readiness.')
    setRequest(0)
    setTarget(null)
    setChangedPodState(false)
    setVerifiedChangedState(false)
  }

  return <div className="service-scene service-experiment">
    <div className="service-experiment-heading"><div><span>INTERACTIVE SERVICE EXPERIMENT</span><h2>Can your Pods handle the traffic?</h2><p>Change traffic and Pod readiness. See how the example Service and its backends respond together.</p></div><button type="button" onClick={reset}><RotateCcw size={15}/> Reset</button></div>
    <div className="service-experiment-layout">
      <div className="service-experiment-main">
        <div className="service-flow-row" aria-label="Client, Service, and Pod endpoints">
          <div className="service-client"><Network/><b>CLIENT</b><small>{incoming} requests/s</small></div>
          <span className="service-line">{target && <i key={`client-${request}`}/>}</span>
          <button type="button" className="service-hub-card" onClick={() => onSelect('Service')}><Activity/><b>Service · api</b><small>selector: app=api</small><code>10.96.14.20</code></button>
          <span className="service-line">{target && <i key={`backend-${request}`}/>}</span>
          <div className="endpoint-list">{pods.map(pod => {
            const eligible = pod.ready && pod.labels
            const load = eligible ? estimate.offeredPerPod : 0
            return <button type="button" key={pod.name} className={`endpoint-pod ${eligible ? 'endpoint-ready' : ''} ${target === pod.name ? 'service-target' : ''}`} onClick={() => onSelect(pod.name)}>
              <Cuboid size={16}/><b>{pod.name}</b><small>{!pod.labels ? 'LABEL MISMATCH' : pod.ready ? 'READY ENDPOINT' : 'NOT READY'}</small>
              <span className="endpoint-load"><span>{eligible ? `${format(load)} offered / ${capacity} capacity` : 'Not receiving normal Service traffic'}</span><span className="endpoint-meter"><i className={eligible && load > capacity ? 'endpoint-overload' : ''} style={{ width: `${Math.min(100, load / capacity * 100)}%` }}/></span></span>
            </button>
          })}</div>
        </div>
        <div className="service-metrics" aria-label="Estimated traffic per second">
          <div><b>{incoming}</b><span>Incoming / s</span></div>
          <div><b>{estimate.readyEndpoints}</b><span>Ready endpoints</span></div>
          <div><b>{estimate.capacity}</b><span>Capacity / s</span></div>
          <div><b>{estimate.served}</b><span>Served / s</span></div>
          <div className={estimate.unserved > 0 ? 'metric-warning' : ''}><b>{estimate.unserved}</b><span>Unserved / s</span></div>
        </div>
        <div className={`service-explanation ${estimate.unserved > 0 ? 'service-explanation-warning' : ''}`} aria-live="polite">
          <b>{estimate.readyEndpoints === 0 ? 'No ready endpoints' : estimate.unserved > 0 ? 'Traffic exceeds this example capacity' : 'Traffic fits this example capacity'}</b>
          <p>{estimate.readyEndpoints === 0 ? 'The Service has no matching Ready Pod in this example.' : `${estimate.readyEndpoints} Ready endpoint${estimate.readyEndpoints === 1 ? '' : 's'} × ${capacity} requests/s = ${estimate.capacity} requests/s of total capacity. ${incoming} incoming − ${estimate.served} served = ${estimate.unserved} unserved per second.`}</p>
        </div>
      </div>
      <div className="service-experiment-controls">
        <label><span>Incoming traffic <b>{incoming} requests/s</b></span><input type="range" min="0" max="1200" step="50" value={incoming} onChange={event => setIncoming(Number(event.target.value))}/></label>
        <label><span>Capacity per Pod <b>{capacity} requests/s</b></span><input type="range" min="50" max="400" step="50" value={capacity} onChange={event => setCapacity(Number(event.target.value))}/></label>
        <button type="button" className="service-spike" onClick={() => setIncoming(900)}>Try a traffic spike</button>
        <div className="pod-toggles"><b>CHANGE EACH POD</b>{pods.map((pod, index) => <div key={pod.name}><span>{pod.name}</span><button type="button" className={pod.ready ? 'toggle-on' : 'toggle-off'} aria-pressed={pod.ready} aria-label={`${pod.name} Ready: ${pod.ready ? 'yes' : 'no'}`} onClick={() => update(index, 'ready')}>Ready: {pod.ready ? 'yes' : 'no'}</button><button type="button" className={pod.labels ? 'toggle-on' : 'toggle-off'} aria-pressed={pod.labels} aria-label={`${pod.name} label match: ${pod.labels ? 'yes' : 'no'}`} onClick={() => update(index, 'labels')}>Label: {pod.labels ? 'match' : 'different'}</button></div>)}</div>
      </div>
    </div>
    <div className="service-result-row"><button type="button" className="send-request" onClick={send}><Play size={14}/> Send one request</button><p role="status">{result}</p></div>
    <LessonCoach task="Try a traffic spike. Make api-03 Ready, compare unserved traffic, then send one request." hint="At the initial capacity, two Ready Pods can serve 400 requests/s in this example. Adding a third increases the example capacity to 600." complete={incoming === 900 && pods[2].ready && pods[2].labels && estimate.readyEndpoints === 3 && verifiedChangedState} success={`The third Ready Pod raises example capacity to ${estimate.capacity} requests/s. Check whether traffic still exceeds it.`}/>
    <p className="service-endpoint-note">This is a steady-state teaching estimate, not a real cluster or benchmark. It assumes equal traffic, identical fixed Pod capacity, and no queues or other bottlenecks. Unserved traffic may be queued, rejected, or time out in a real system. The single-request button only illustrates endpoint selection; it does not change the estimate. Kubernetes Service forwarding varies by implementation and connections are not guaranteed to be evenly distributed. EndpointSlices describe endpoints; requests do not pass through them. Readiness is controlled here by you, not an automatic health-check simulation.</p>
  </div>
}
