import { useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Boxes, Database, FileCode2, Globe, Network, Pause, Play, RotateCcw, Server } from 'lucide-react'
import LessonCoach from './LessonCoach'
import './ConceptLabs.css'

type DnsSettings = { namespace: 'shop' | 'tools'; query: 'short' | 'qualified'; ready: boolean }
export function resolveExample(settings: DnsSettings): 'not-found' | 'no-endpoints' | 'reachable' {
  if (settings.namespace !== 'shop' && settings.query === 'short') return 'not-found'
  return settings.ready ? 'reachable' : 'no-endpoints'
}

type Volume = 'emptyDir' | 'pvc'
type StorageState = { pod: number; restarts: number; data: Record<Volume, number> }
type StorageAction = { type: 'write'; volume: Volume } | { type: 'restart' } | { type: 'replace' }
export function updateStorage(state: StorageState, action: StorageAction): StorageState {
  if (action.type === 'write') return { ...state, data: { ...state.data, [action.volume]: state.data[action.volume] + 1 } }
  if (action.type === 'restart') return { ...state, restarts: state.restarts + 1 }
  return { pod: state.pod + 1, restarts: 0, data: { ...state.data, emptyDir: 0 } }
}
const initialStorage: StorageState = { pod: 1, restarts: 0, data: { emptyDir: 0, pvc: 0 } }

export function accessExample(binding: boolean, namespace: 'shop' | 'tools', action: 'get' | 'delete') {
  return binding && namespace === 'shop' && action === 'get'
}

export function schedulingExample(request: number, selector: 'any' | 'east' | 'west') {
  return [
    { name: 'node-east', zone: 'east', free: 2 },
    { name: 'node-west', zone: 'west', free: 1 },
  ].filter(node => (selector === 'any' || node.zone === selector) && node.free >= request)
}

type ConfigState = { source: number; environment: number; volume: number }
export function updateConfigExample(state: ConfigState, action: 'edit' | 'sync' | 'restart'): ConfigState {
  if (action === 'edit') return { ...state, source: state.source + 1 }
  if (action === 'sync') return { ...state, volume: state.source }
  return { ...state, environment: state.source, volume: state.source }
}

type RolloutState = { ready: number; pending: boolean; failed: boolean }
export function updateRolloutExample(state: RolloutState, action: 'start' | 'ready' | 'fail' | 'rollback'): RolloutState {
  if (action === 'rollback') return { ready: 0, pending: false, failed: false }
  if (action === 'start' && !state.pending && state.ready < 3) return { ...state, pending: true }
  if (action === 'fail' && state.pending) return { ...state, failed: true }
  if (action === 'ready' && state.pending) return { ready: state.ready + 1, pending: false, failed: false }
  return state
}

export function RolloutLab() {
  const [state, setState] = useState<RolloutState>({ ready: 0, pending: false, failed: false })
  const act = (action: 'start' | 'ready' | 'fail' | 'rollback') => setState(current => updateRolloutExample(current, action))
  return <div className="concept-lab">
    <div className="lab-heading"><div><small>INTERACTIVE LAB · ROLLOUTS</small><h2>Update without losing ready copies</h2></div><Boxes size={23}/></div>
    <p className="lab-intro">This example has three app copies. Start a new Pod, choose whether it becomes Ready, and see when an old Pod can be removed.</p>
    <div className="lab-flow" aria-label="Rolling update example">
      <div className="lab-node"><b>Old version</b><small>Ready Pods</small><code>{3 - state.ready}</code></div>
      <div className={`lab-node ${state.failed ? 'lab-node-warning' : 'lab-node-good'}`}><b>New version</b><small>{state.pending ? state.failed ? 'One Pod is not Ready' : 'One Pod is starting' : 'No Pod starting'}</small><code>{state.ready} Ready</code></div>
    </div>
    <div className="lab-actions"><button disabled={state.pending || state.ready === 3} onClick={() => act('start')}>Start new Pod</button><button disabled={!state.pending} onClick={() => act('ready')}>Pod becomes Ready</button><button disabled={!state.pending || state.failed} onClick={() => act('fail')}>Pod fails readiness</button><button onClick={() => act('rollback')}>Roll back</button></div>
    <div className={`lab-result ${state.failed ? 'lab-result-warning' : 'lab-result-good'}`} role="status"><b>{state.failed ? 'Update is waiting for a Ready Pod' : state.ready === 3 ? 'All three copies use the new version' : state.pending ? 'The old Pod stays until the new Pod is Ready' : 'Ready to start the next copy'}</b><p>{state.failed ? 'A failed readiness check keeps this new Pod out of normal traffic. Investigate or roll back before continuing.' : 'Once the new Pod is Ready, this example removes one old Pod. Rollback returns the example to the old version.'}</p></div>
    <p className="lab-source">Simplified example: three replicas, maxSurge 1, maxUnavailable 0, and a working controller. Real rollout timing, readiness, and capacity affect the result. A rollback does not undo external data changes. <a href="https://kubernetes.io/docs/concepts/workloads/controllers/deployment/" target="_blank" rel="noreferrer">Read about Deployments</a>.</p>
  </div>
}

export function NamespaceLab() {
  const [scope, setScope] = useState<'shop' | 'tools' | 'all'>('shop')
  const namespaces = scope === 'all' ? ['shop', 'tools'] : [scope]
  return <div className="concept-lab">
    <div className="lab-heading"><div><small>INTERACTIVE LAB · NAMESPACES</small><h2>Which Pod do you see?</h2></div><Boxes size={23}/></div>
    <p className="lab-intro">Both teams have a Pod named api. Pick a namespace to see how the same name can exist in two places.</p>
    <div className="lab-controls"><fieldset><legend>SHOW PODS IN</legend><div>{(['shop', 'tools', 'all'] as const).map(value => <button key={value} aria-pressed={scope === value} onClick={() => setScope(value)}>{value === 'all' ? 'All namespaces' : value}</button>)}</div></fieldset></div>
    <div className="lab-flow" aria-label="Pods by namespace">{namespaces.map(namespace => <div key={namespace} className="lab-node lab-node-good"><Boxes size={22}/><b>api</b><small>Namespace: {namespace}</small><code>Pod: {namespace}/api</code></div>)}</div>
    <div className="lab-result" role="status"><b>{scope === 'all' ? 'Two Pods, same name, different namespaces' : `Showing the api Pod in ${scope}`}</b><p>{scope === 'all' ? 'The namespace and name together identify each Pod. A command scoped to one namespace will not show the other Pod.' : `A request for api in ${scope} refers to that namespace’s Pod, not the one in the other namespace.`}</p></div>
    <p className="lab-source">Namespaces organize namespaced resources. They do not automatically block network traffic or grant access; use appropriate network policies and access controls. <a href="https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/" target="_blank" rel="noreferrer">Read about namespaces</a>.</p>
  </div>
}

export function ConfigurationLab() {
  const [state, setState] = useState<ConfigState>({ source: 1, environment: 1, volume: 1 })
  return <div className="concept-lab">
    <div className="lab-heading"><div><small>INTERACTIVE LAB · CONFIGURATION</small><h2>When does the app see a change?</h2></div><FileCode2 size={23}/></div>
    <p className="lab-intro">This example uses one ConfigMap in two ways. Change its value, then see when the running app gets the update.</p>
    <div className="lab-flow" aria-label="ConfigMap delivery example">
      <div className="lab-node"><b>ConfigMap</b><small>Current setting</small><code>version {state.source}</code></div>
      <div className="lab-node"><b>Environment variable</b><small>Read when container starts</small><code>version {state.environment}</code></div>
      <div className="lab-node"><b>Mounted file</b><small>Updates after sync</small><code>version {state.volume}</code></div>
    </div>
    <div className="lab-actions"><button onClick={() => setState(current => updateConfigExample(current, 'edit'))}>Change ConfigMap</button><button onClick={() => setState(current => updateConfigExample(current, 'sync'))}>Simulate volume sync</button><button onClick={() => setState(current => updateConfigExample(current, 'restart'))}>Restart container</button><button onClick={() => setState({ source: 1, environment: 1, volume: 1 })}>Reset</button></div>
    <div className="lab-result" role="status"><b>{state.environment === state.source && state.volume === state.source ? 'Both show the current value' : 'The app can still see an older value'}</b><p>Environment variables do not change in a running container. A normal ConfigMap volume can update later; an app may need to reload the file. A subPath mount does not receive these updates.</p></div>
    <p className="lab-source">This is a simplified example, not a live cluster. Sync timing varies; Secrets need access controls and encryption at rest. <a href="https://kubernetes.io/docs/concepts/configuration/configmap/" target="_blank" rel="noreferrer">Read about ConfigMaps</a>.</p>
  </div>
}

export function AccessLab() {
  const [binding, setBinding] = useState(false)
  const [namespace, setNamespace] = useState<'shop' | 'tools'>('shop')
  const [action, setAction] = useState<'get' | 'delete'>('get')
  const allowed = accessExample(binding, namespace, action)
  return <div className="concept-lab">
    <div className="lab-heading"><div><small>INTERACTIVE LAB · RBAC</small><h2>Who can read Pods?</h2></div><Network size={23}/></div>
    <p className="lab-intro">This example has one Role that allows reading Pods in shop. Add a RoleBinding, then change the request to see what the Role actually allows.</p>
    <div className="lab-controls">
      <fieldset><legend>ROLEBINDING FOR THE USER</legend><div><button aria-pressed={binding} onClick={() => setBinding(true)}>Added</button><button aria-pressed={!binding} onClick={() => setBinding(false)}>Not added</button></div></fieldset>
      <fieldset><legend>REQUESTED NAMESPACE</legend><div>{(['shop', 'tools'] as const).map(value => <button key={value} aria-pressed={namespace === value} onClick={() => setNamespace(value)}>{value}</button>)}</div></fieldset>
      <fieldset><legend>REQUESTED ACTION</legend><div><button aria-pressed={action === 'get'} onClick={() => setAction('get')}>Read Pod</button><button aria-pressed={action === 'delete'} onClick={() => setAction('delete')}>Delete Pod</button></div></fieldset>
    </div>
    <div className="lab-flow" aria-label="RBAC example"><div className="lab-node"><b>User</b><small>Requests {action} pods in {namespace}</small></div><div className="lab-link active"><span>REQUEST</span></div><div className="lab-node"><b>RoleBinding</b><small>{binding ? 'Links user to Role in shop' : 'Not present'}</small></div><div className="lab-link active"><span>CHECK</span></div><div className={`lab-node ${allowed ? 'lab-node-good' : 'lab-node-warning'}`}><b>Role in shop</b><small>Allows get pods only</small><code>{allowed ? 'ALLOWED' : 'NOT GRANTED'}</code></div></div>
    <div className={`lab-result ${allowed ? 'lab-result-good' : 'lab-result-warning'}`} role="status"><b>{allowed ? 'This Role grants the request' : 'This Role does not grant the request'}</b><p>{!binding ? 'A Role lists permissions, but a RoleBinding is needed to give them to this user.' : namespace !== 'shop' ? 'This RoleBinding grants access in shop, not tools.' : action !== 'get' ? 'The Role allows reading Pods, not deleting them.' : 'The binding, namespace, and requested action all match.'}</p></div>
    <p className="lab-source">Simplified example: the user is authenticated and has no other grants. Other authorization rules may also affect a real request. <a href="https://kubernetes.io/docs/reference/access-authn-authz/rbac/" target="_blank" rel="noreferrer">Read about RBAC</a>.</p>
  </div>
}

export function SchedulingLab() {
  const [request, setRequest] = useState(1)
  const [selector, setSelector] = useState<'any' | 'east' | 'west'>('any')
  const candidates = schedulingExample(request, selector)
  return <div className="concept-lab">
    <div className="lab-heading"><div><small>INTERACTIVE LAB · SCHEDULING</small><h2>Where can the Pod run?</h2></div><Server size={23}/></div>
    <p className="lab-intro">Change the Pod’s CPU request and zone. The example checks each node before the scheduler chooses where to place the Pod.</p>
    <div className="lab-controls">
      <fieldset><legend>POD CPU REQUEST</legend><div>{[1, 2, 3].map(value => <button key={value} aria-pressed={request === value} onClick={() => setRequest(value)}>{value} CPU</button>)}</div></fieldset>
      <fieldset><legend>REQUIRED ZONE</legend><div>{(['any', 'east', 'west'] as const).map(value => <button key={value} aria-pressed={selector === value} onClick={() => setSelector(value)}>{value}</button>)}</div></fieldset>
    </div>
    <div className="lab-flow" aria-label="Scheduling example">{(['east', 'west'] as const).map(zone => {
      const eligible = candidates.some(node => node.zone === zone)
      return <div key={zone} className={`lab-node ${eligible ? 'lab-node-good' : 'lab-node-warning'}`}><Server size={22}/><b>node-{zone}</b><small>Zone: {zone} · {zone === 'east' ? 2 : 1} CPU available for requests</small><code>{eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}</code></div>
    })}</div>
    <div className={`lab-result ${candidates.length ? 'lab-result-good' : 'lab-result-warning'}`} role="status"><b>{candidates.length ? `${candidates.length} node${candidates.length === 1 ? '' : 's'} can fit this example` : 'No node fits: the Pod stays Pending'}</b><p>{candidates.length ? 'The scheduler filters out nodes that do not meet the requirements, then scores eligible nodes to choose one.' : 'Lower the CPU request or change the required zone to find a suitable node.'}</p></div>
    <p className="lab-source">Simplified example: CPU available means allocatable CPU minus existing requests, not current usage. Real scheduling also checks other resources and rules. <a href="https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/" target="_blank" rel="noreferrer">Read about the scheduler</a>.</p>
  </div>
}

function MotionControl({ playing, onToggle, reducedMotion }: { playing: boolean; onToggle: () => void; reducedMotion: boolean | null }) {
  return <div className="lab-motion"><span><i/> {playing && !reducedMotion ? 'SIMULATION ANIMATED' : 'ANIMATION PAUSED'}</span><button type="button" onClick={onToggle} disabled={Boolean(reducedMotion)}>{playing && !reducedMotion ? <Pause size={14}/> : <Play size={14}/>} {reducedMotion ? 'Reduced motion enabled' : playing ? 'Pause animation' : 'Play animation'}</button></div>
}

export function DiscoveryLab() {
  const reducedMotion = useReducedMotion()
  const [playing, setPlaying] = useState(() => !reducedMotion)
  const [settings, setSettings] = useState<DnsSettings>({ namespace: 'shop', query: 'short', ready: true })
  const [sawMissing, setSawMissing] = useState(false)
  const result = resolveExample(settings)
  const query = settings.query === 'short' ? 'api' : 'api.shop'
  function change(next: DnsSettings) {
    setSettings(next)
    if (resolveExample(next) === 'not-found') setSawMissing(true)
  }
  return <div className={`concept-lab ${playing && !reducedMotion ? 'lab-playing' : ''}`}>
    <div className="lab-heading"><div><small>INTERACTIVE LAB · DNS</small><h2>Will the name resolve?</h2></div><Globe size={23}/></div>
    <p className="lab-intro">Change the client namespace, lookup name, and endpoint health. Follow the result through the diagram.</p>
    <div className="lab-controls">
      <fieldset><legend>CLIENT POD NAMESPACE</legend><div>{(['shop', 'tools'] as const).map(value => <button key={value} type="button" aria-pressed={settings.namespace === value} onClick={() => change({ ...settings, namespace: value })}>{value}</button>)}</div></fieldset>
      <fieldset><legend>DNS NAME</legend><div><button type="button" aria-pressed={settings.query === 'short'} onClick={() => change({ ...settings, query: 'short' })}>api</button><button type="button" aria-pressed={settings.query === 'qualified'} onClick={() => change({ ...settings, query: 'qualified' })}>api.shop</button></div></fieldset>
      <fieldset><legend>BACKEND POD</legend><div><button type="button" aria-pressed={settings.ready} onClick={() => change({ ...settings, ready: true })}>Ready</button><button type="button" aria-pressed={!settings.ready} onClick={() => change({ ...settings, ready: false })}>Not Ready</button></div></fieldset>
    </div>
    <div className="lab-flow" aria-label="DNS and Service routing example">
      <div className="lab-node"><Boxes size={22}/><b>Client Pod</b><small>{settings.namespace} namespace</small><code>{query}</code></div>
      <div className="lab-link active"><i/><span>LOOKUP</span></div>
      <div className={`lab-node ${result === 'not-found' ? 'lab-node-warning' : ''}`}><Globe size={22}/><b>Cluster DNS</b><small>{result === 'not-found' ? 'No matching Service' : 'Returns Service IP'}</small><code>{result === 'not-found' ? 'NOT FOUND' : '10.96.0.10'}</code></div>
      <div className={`lab-link ${result !== 'not-found' ? 'active' : ''}`}><i/><span>RESOLVE</span></div>
      <div className={`lab-node ${result === 'reachable' ? 'lab-node-good' : 'lab-node-warning'}`}><Network size={22}/><b>api.shop</b><small>{settings.ready ? '1 Ready backend' : '0 Ready backends'}</small><code>{result === 'reachable' ? 'REACHABLE' : 'NO TRAFFIC'}</code></div>
    </div>
    <MotionControl playing={playing} onToggle={() => setPlaying(value => !value)} reducedMotion={reducedMotion}/>
    <div className={`lab-result ${result === 'reachable' ? 'lab-result-good' : 'lab-result-warning'}`} role="status"><b>{result === 'not-found' ? 'Name not found' : result === 'no-endpoints' ? 'DNS works; traffic has no Ready backend' : 'Name resolves and the example backend is Ready'}</b><p>{result === 'not-found' ? 'In this example, the short name searches the client namespace. There is no api Service in tools; use api.shop to target the Service in shop.' : result === 'no-endpoints' ? 'A normal ClusterIP Service still has a DNS record when no selected Pods are Ready. Resolution alone does not prove that requests will succeed.' : 'The name identifies the Service in shop. With a matching Ready backend, this simplified example can forward requests.'}</p></div>
    <LessonCoach task="Move the client to tools, then fix its lookup without moving the Service." hint="A short name searches the client Pod’s namespace. Include the Service namespace to look across namespaces." complete={sawMissing && settings.namespace === 'tools' && settings.query === 'qualified' && settings.ready} success="The namespace-qualified name resolves the Service in shop from the tools namespace."/>
    <p className="lab-source">Simplified example: one ClusterIP Service, normal DNS search settings, and no other api Service. <a href="https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/" target="_blank" rel="noreferrer">Read the Kubernetes DNS documentation</a>.</p>
  </div>
}

export function StorageLab() {
  const reducedMotion = useReducedMotion()
  const [playing, setPlaying] = useState(() => !reducedMotion)
  const [volume, setVolume] = useState<Volume>('emptyDir')
  const [state, setState] = useState(initialStorage)
  const [lostScratch, setLostScratch] = useState(false)
  const [retainedClaim, setRetainedClaim] = useState(false)
  const [message, setMessage] = useState('Write a record, then restart the container or replace the Pod.')
  function write() {
    setState(current => updateStorage(current, { type: 'write', volume }))
    setMessage(`A record was written to ${volume === 'pvc' ? 'the mounted claim' : 'the Pod’s emptyDir volume'}.`)
  }
  function restart() {
    setState(current => updateStorage(current, { type: 'restart' }))
    setMessage('The container restarted inside the same Pod. Its mounted volume retains the data.')
  }
  function replace() {
    if (volume === 'emptyDir' && state.data.emptyDir > 0) setLostScratch(true)
    if (volume === 'pvc' && state.data.pvc > 0) setRetainedClaim(true)
    setState(current => updateStorage(current, { type: 'replace' }))
    setMessage(volume === 'emptyDir' ? 'The replacement Pod has a new emptyDir. The old Pod’s scratch data is gone.' : 'The replacement Pod mounts the same available claim; the claim’s records remain.')
  }
  function reset() { setState(initialStorage); setVolume('emptyDir'); setLostScratch(false); setRetainedClaim(false); setMessage('Write a record, then restart the container or replace the Pod.') }
  return <div className={`concept-lab ${playing && !reducedMotion ? 'lab-playing' : ''}`}>
    <div className="lab-heading"><div><small>INTERACTIVE LAB · STORAGE</small><h2>What survives replacement?</h2></div><Database size={23}/></div>
    <p className="lab-intro">Compare a Pod-scoped emptyDir with a persistent claim by writing data and changing the workload.</p>
    <div className="lab-controls"><fieldset><legend>VOLUME MOUNTED BY THE APP</legend><div><button type="button" aria-pressed={volume === 'emptyDir'} onClick={() => { setVolume('emptyDir'); setMessage('The app now uses the current Pod’s emptyDir volume.') }}>emptyDir · scratch</button><button type="button" aria-pressed={volume === 'pvc'} onClick={() => { setVolume('pvc'); setMessage('The app now uses the persistent claim.') }}>PVC · persistent</button></div></fieldset></div>
    <div className="lab-flow storage-flow" aria-label="Pod and mounted storage">
      <div className="lab-node lab-node-good"><Server size={22}/><b>app-{state.pod}</b><small>Pod identity</small><code>{state.restarts} container restart{state.restarts === 1 ? '' : 's'}</code></div>
      <div className="lab-link active"><i/><span>MOUNT</span></div>
      <div className="lab-node"><Database size={22}/><b>{volume === 'emptyDir' ? 'emptyDir' : 'Persistent claim'}</b><small>{volume === 'emptyDir' ? 'Lifetime of this Pod' : 'Independent of Pod'}</small><code>{state.data[volume]} record{state.data[volume] === 1 ? '' : 's'}</code></div>
    </div>
    <MotionControl playing={playing} onToggle={() => setPlaying(value => !value)} reducedMotion={reducedMotion}/>
    <div className="lab-actions"><button onClick={write}>Write a record</button><button onClick={restart}>Restart container</button><button onClick={replace}>Replace Pod</button><button onClick={reset}><RotateCcw size={14}/> Reset</button></div>
    <div className="lab-result" role="status"><b>WHAT HAPPENED</b><p>{message}</p></div>
    <LessonCoach task="Write to emptyDir and replace the Pod. Then repeat with a persistent claim." hint="A container restart keeps the Pod’s volume; replacing the Pod removes its emptyDir. In this example the replacement can mount the same claim." complete={lostScratch && retainedClaim} success="You compared scratch data loss with data retained by the mounted claim."/>
    <p className="lab-source">Simplified example: the replacement mounts the same available claim. Claim retention, access modes, storage failures, and backups still matter. <a href="https://kubernetes.io/docs/concepts/storage/volumes/" target="_blank" rel="noreferrer">Read the Kubernetes volume documentation</a>.</p>
  </div>
}
