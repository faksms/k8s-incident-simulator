import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import LessonCoach from './lessons/LessonCoach'
import './ArchitectureExperiment.css'

type ComponentId = 'client' | 'service' | 'pods' | 'kubectl' | 'api' | 'etcd' | 'controller' | 'scheduler'
type Component = { id: ComponentId; label: string; x: number; y: number; color: string; detail: string }

const components: Component[] = [
  { id: 'kubectl', label: 'kubectl', x: -3, y: -2, color: '#80c6f0', detail: 'The command-line tool sends management requests to the API server.' },
  { id: 'api', label: 'API server', x: -1, y: -2, color: '#59b8ec', detail: 'The API server receives management requests and checks them before accepting changes.' },
  { id: 'etcd', label: 'etcd', x: 1, y: -3, color: '#a995ed', detail: 'etcd stores cluster configuration and state. The API server accesses it.' },
  { id: 'controller', label: 'Controller', x: 1, y: -1, color: '#a995ed', detail: 'Controllers watch objects and work toward the desired state through the API.' },
  { id: 'scheduler', label: 'Scheduler', x: -1, y: 0, color: '#a995ed', detail: 'The scheduler chooses a suitable node for a Pod that needs one.' },
  { id: 'client', label: 'Client', x: -3, y: 2, color: '#f0b770', detail: 'A client sends application traffic to a Service.' },
  { id: 'service', label: 'Service', x: -1, y: 2, color: '#65dab1', detail: 'A Service provides a stable way to reach suitable endpoints. The data plane forwards the traffic.' },
  { id: 'pods', label: 'App Pods', x: 1, y: 2, color: '#65dab1', detail: 'Ready Pods can receive normal Service traffic. They run application containers on worker nodes.' },
]
function componentById(id: ComponentId): Component {
  const component = components.find(item => item.id === id)
  if (!component) throw new Error(`Unknown architecture component: ${id}`)
  return component
}
const links: { from: ComponentId; to: ComponentId; kind: 'control' | 'traffic' }[] = [
  { from: 'kubectl', to: 'api', kind: 'control' },
  { from: 'api', to: 'etcd', kind: 'control' },
  { from: 'controller', to: 'api', kind: 'control' },
  { from: 'scheduler', to: 'api', kind: 'control' },
  { from: 'client', to: 'service', kind: 'traffic' },
  { from: 'service', to: 'pods', kind: 'traffic' },
]

export function architectureOutcome(apiReachable: boolean, podsReady: boolean) {
  return { changesPossible: apiReachable, trafficPossible: podsReady }
}

function project(x: number, y: number, z: number, angle: number) {
  const radians = angle * Math.PI / 180
  const horizontal = x * Math.cos(radians) - y * Math.sin(radians)
  const depth = x * Math.sin(radians) + y * Math.cos(radians)
  return { x: 360 + horizontal * 63, y: 200 + depth * 25 - z * 48, depth }
}

function boxPoints(component: Component, angle: number) {
  const x = component.x, y = component.y
  const corners = [
    project(x - .55, y - .55, 0, angle), project(x + .55, y - .55, 0, angle),
    project(x + .55, y + .55, 0, angle), project(x - .55, y + .55, 0, angle),
    project(x - .55, y - .55, .8, angle), project(x + .55, y - .55, .8, angle),
    project(x + .55, y + .55, .8, angle), project(x - .55, y + .55, .8, angle),
  ]
  const points = (indices: number[]) => indices.map(index => `${corners[index].x},${corners[index].y}`).join(' ')
  return { top: points([4, 5, 6, 7]), sides: [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]].map(points), label: project(x, y, 1.05, angle) }
}

export default function ArchitectureExperiment() {
  const [api, setApi] = useState(true)
  const [ready, setReady] = useState(true)
  const [angle, setAngle] = useState(20)
  const [selected, setSelected] = useState<ComponentId>('api')
  const [sawApiUnavailable, setSawApiUnavailable] = useState(false)
  const outcome = architectureOutcome(api, ready)
  const ordered = [...components].sort((a, b) => project(a.x, a.y, 0, angle).depth - project(b.x, b.y, 0, angle).depth)
  function reset() { setApi(true); setReady(true); setAngle(20); setSelected('api'); setSawApiUnavailable(false) }
  return <section className="architecture-experiment" aria-labelledby="architecture-experiment-title">
    <header><div><span>INTERACTIVE CLUSTER EXPERIMENT</span><h2 id="architecture-experiment-title">What happens when the API is unreachable?</h2><p>Rotate the model, select a component, and change the example conditions. Compare cluster management with app traffic.</p></div><button type="button" onClick={reset}><RotateCcw size={15}/> Reset</button></header>
    <div className="architecture-experiment-layout">
      <div>
        <p className="architecture-scroll-hint">Scroll sideways to see the full model.</p>
        <div className="architecture-iso-scroll" role="region" aria-label="Scrollable architecture model" tabIndex={0}><svg className="architecture-iso" viewBox="0 0 720 380" role="img" aria-label="Rotatable isometric model of Kubernetes management and application traffic">
          <defs><pattern id="architecture-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#264458" strokeWidth="1"/></pattern></defs>
          <rect width="720" height="380" fill="url(#architecture-grid)"/>
          {links.map(link => {
            const from = componentById(link.from), to = componentById(link.to)
            const start = project(from.x, from.y, .35, angle), end = project(to.x, to.y, .35, angle)
            const active = link.kind === 'control' ? api : link.from === 'client' || ready
            return <line key={`${link.from}-${link.to}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} className={`architecture-iso-link ${link.kind} ${active ? 'active' : ''}`}/>
          })}
          {ordered.map(item => {
            const box = boxPoints(item, angle)
            const unavailable = item.id === 'api' && !api || item.id === 'pods' && !ready
            return <g key={item.id} className={`architecture-iso-box ${unavailable ? 'unavailable' : ''} ${selected === item.id ? 'selected' : ''}`} onClick={() => setSelected(item.id)} aria-hidden="true">
              {box.sides.map((points, index) => <polygon key={index} points={points} fill={item.color} className="architecture-iso-side"/>)}
              <polygon points={box.top} fill={item.color} className="architecture-iso-top"/>
              <text x={box.label.x} y={box.label.y} textAnchor="middle">{item.label}</text>
            </g>
          })}
        </svg></div>
        <div className="architecture-experiment-legend"><span><i className="control"/> Management</span><span><i className="traffic"/> App traffic</span><span><i className="unavailable"/> Example unavailable</span></div>
        <div className="architecture-experiment-metrics"><div><b>{outcome.changesPossible ? 'Reachable' : 'Unreachable'}</b><span>API for management</span></div><div><b>{ready ? '2 / 2' : '0 / 2'}</b><span>Example Ready Pods</span></div><div><b>{outcome.trafficPossible ? 'May continue' : 'No Ready backend'}</b><span>Service traffic</span></div></div>
        <div className="architecture-experiment-result" role="status"><b>{componentById(selected).label}</b><p>{componentById(selected).detail}</p><p>{api ? 'In this example the API is reachable.' : 'The API is unreachable. New management changes cannot be sent through it. Existing app traffic may continue if the data plane still has usable configuration.'} {ready ? 'The example Pods are Ready.' : 'The example Pods are not Ready, so normal Service traffic has no Ready backend.'}</p></div>
      </div>
      <div className="architecture-experiment-controls">
        <label>View angle <b>{angle}°</b><input type="range" min="-45" max="45" step="5" value={angle} onChange={event => setAngle(Number(event.target.value))}/></label>
        <fieldset><legend>Example conditions</legend><button type="button" aria-pressed={api} onClick={() => { if (api) setSawApiUnavailable(true); setApi(value => !value) }}>API: {api ? 'reachable' : 'unreachable'}</button><button type="button" aria-pressed={ready} onClick={() => setReady(value => !value)}>Pods: {ready ? 'Ready' : 'Not Ready'}</button></fieldset>
        <fieldset><legend>Inspect a component</legend><div className="architecture-component-picker">{components.map(item => <button key={item.id} type="button" aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>{item.label}</button>)}</div></fieldset>
      </div>
    </div>
    <LessonCoach task="Make the API unreachable while leaving the Pods Ready. Compare management with Service traffic." hint="Turn off the API condition but keep the Pods Ready. Existing data-plane forwarding may still work." complete={sawApiUnavailable && !api && ready} success="The example separates unavailable management requests from existing application traffic."/>
    <p className="architecture-experiment-note">Illustration only: a reachable API can still reject requests. This example assumes the Service data plane retains working configuration and both endpoints have the selected readiness. Real failures, connections, propagation, and recovery can differ. The diagram does not connect to a cluster.</p>
  </section>
}
