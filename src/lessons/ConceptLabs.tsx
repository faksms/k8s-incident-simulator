import { useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Boxes, Database, Globe, Network, Pause, Play, RotateCcw, Server } from 'lucide-react'
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
