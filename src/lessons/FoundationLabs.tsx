import { useState } from 'react'
import { Boxes, Database, FileCode2, Search, Server, ShieldCheck } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import './ConceptLabs.css'

function Lab({ title, name, children }: { title: string; name: string; children: ReactNode }) {
  return <div className="concept-lab"><div className="lab-heading"><div><small>INTERACTIVE EXAMPLE · {name}</small><h2>{title}</h2></div><Boxes size={23}/></div>{children}</div>
}

function StartLab() {
  const [context, setContext] = useState<'practice' | 'production'>('practice')
  const [namespace, setNamespace] = useState<'shop' | 'default'>('default')
  return <Lab name="KUBECONFIG" title="Which cluster will receive your command?">
    <p className="lab-intro">A context selects a cluster, a user, and optionally a default namespace. Change the context before you inspect the example command.</p>
    <div className="lab-controls"><fieldset><legend>CURRENT CONTEXT</legend><div>{(['practice', 'production'] as const).map(value => <button key={value} aria-pressed={context === value} onClick={() => setContext(value)}>{value}</button>)}</div></fieldset><fieldset><legend>DEFAULT NAMESPACE</legend><div>{(['default', 'shop'] as const).map(value => <button key={value} aria-pressed={namespace === value} onClick={() => setNamespace(value)}>{value}</button>)}</div></fieldset></div>
    <div className="lab-flow"><div className="lab-node"><FileCode2/><b>kubectl get pods</b><small>No namespace flag</small></div><div className={`lab-node ${context === 'production' ? 'lab-node-warning' : 'lab-node-good'}`}><Server/><b>{context} cluster</b><small>User: {context}-user</small><code>namespace: {namespace}</code></div></div>
    <div className="lab-result" role="status"><b>The command targets {context} / {namespace}</b><p>Check <code>kubectl config current-context</code> before making changes. An explicit namespace flag overrides the context’s default namespace.</p></div>
    <p className="lab-source">This is an example, not your actual kubeconfig. It does not connect to a cluster.</p>
  </Lab>
}

type StatefulState = { generation: number; records: number }
export function updateStatefulExample(state: StatefulState, action: 'write' | 'replace'): StatefulState {
  return action === 'write' ? { ...state, records: state.records + 1 } : { ...state, generation: state.generation + 1 }
}
function StatefulLab() {
  const [state, setState] = useState<StatefulState>({ generation: 1, records: 0 })
  return <Lab name="STATEFULSET" title="Replace a Pod without changing its identity">
    <p className="lab-intro">Write a record, then replace database-0. In this example its replacement can mount the same available claim.</p>
    <div className="lab-flow"><div className="lab-node lab-node-good"><Server/><b>database-0</b><small>Pod instance {state.generation}</small><code>stable numbered name</code></div><div className="lab-node"><Database/><b>data-database-0</b><small>Persistent claim</small><code>{state.records} record{state.records === 1 ? '' : 's'}</code></div></div>
    <div className="lab-actions"><button onClick={() => setState(current => updateStatefulExample(current, 'write'))}>Write a record</button><button onClick={() => setState(current => updateStatefulExample(current, 'replace'))}>Replace Pod</button><button onClick={() => setState({ generation: 1, records: 0 })}>Reset</button></div>
    <div className="lab-result" role="status"><b>{state.generation > 1 ? 'A new Pod has the same numbered name' : 'The Pod has a named claim'}</b><p>The Pod instance changes, but the StatefulSet can reuse its ordinal name and claim. A governing headless Service can provide stable DNS names.</p></div>
    <p className="lab-source">Simplified example: the claim remains and can be mounted. Retention and reclaim policies, storage availability, and separate backups still matter.</p>
  </Lab>
}

type ApiState = { desired: number; ready: number; accepted: boolean }
export function updateApiExample(state: ApiState, action: 'apply' | 'reconcile'): ApiState {
  if (action === 'apply') return { ...state, accepted: true }
  return state.accepted ? { ...state, ready: Math.min(state.desired, state.ready + 1) } : state
}
function ApiLab() {
  const [allowed, setAllowed] = useState(false)
  const [state, setState] = useState<ApiState>({ desired: 3, ready: 0, accepted: false })
  const [message, setMessage] = useState('Choose whether this identity has permission, then send the request.')
  return <Lab name="API SERVER" title="Accepted does not mean Ready">
    <p className="lab-intro">Try a Deployment request with and without permission. Then let the example controller add ready copies one at a time.</p>
    <div className="lab-controls"><fieldset><legend>PERMISSION TO CHANGE DEPLOYMENT</legend><div><button aria-pressed={allowed} onClick={() => setAllowed(true)}>Allowed</button><button aria-pressed={!allowed} onClick={() => setAllowed(false)}>Denied</button></div></fieldset></div>
    <div className="lab-flow"><div className="lab-node"><FileCode2/><b>Request</b><small>3 app copies</small></div><div className={`lab-node ${state.accepted ? 'lab-node-good' : 'lab-node-warning'}`}><Server/><b>API server</b><small>{state.accepted ? 'Change accepted' : 'No accepted change'}</small></div><div className="lab-node"><Boxes/><b>Controller</b><small>{state.ready} / {state.accepted ? state.desired : 0} ready</small></div></div>
    <div className="lab-actions"><button onClick={() => { if (allowed) { setState(current => updateApiExample(current, 'apply')); setMessage('The API accepted the request. The app copies still need to become Ready.') } else setMessage('The API denied this request. No new change was accepted.') }}>Send request</button><button disabled={!state.accepted || state.ready === state.desired} onClick={() => { setState(current => updateApiExample(current, 'reconcile')); setMessage('One more app copy is Ready in this example.') }}>Make one Pod Ready</button><button onClick={() => { setState({ desired: 3, ready: 0, accepted: false }); setMessage('Example reset. Send a request to begin.') }}>Reset</button></div>
    <div className="lab-result" role="status"><b>{message}</b><p>The API checks identity, access, and admission. After it accepts a change, controllers work toward it over time; readiness is a separate result.</p></div>
    <p className="lab-source">Simplified example: identity and admission succeed, and nodes have room. No real API request is sent.</p>
  </Lab>
}

function SecurityLab() {
  const [access, setAccess] = useState(false)
  const [network, setNetwork] = useState(false)
  const [workload, setWorkload] = useState(false)
  return <Lab name="SECURITY" title="Build layers around an app">
    <p className="lab-intro">Select safeguards to see which risk each one reduces. No single switch makes a workload completely safe.</p>
    <div className="lab-controls"><fieldset><legend>EXAMPLE SAFEGUARDS</legend><div><button aria-pressed={access} onClick={() => setAccess(value => !value)}>Limit API access</button><button aria-pressed={network} onClick={() => setNetwork(value => !value)}>Restrict network traffic</button><button aria-pressed={workload} onClick={() => setWorkload(value => !value)}>Harden the container</button></div></fieldset></div>
    <div className="lab-flow">{[{ title: 'Identity', active: access, text: 'RBAC limits API actions' }, { title: 'Network', active: network, text: 'Policy limits selected traffic' }, { title: 'Workload', active: workload, text: 'Non-root and fewer privileges' }].map(item => <div key={item.title} className={`lab-node ${item.active ? 'lab-node-good' : 'lab-node-warning'}`}><ShieldCheck/><b>{item.title}</b><small>{item.text}</small><code>{item.active ? 'SELECTED' : 'NOT SELECTED'}</code></div>)}</div>
    <div className="lab-result" role="status"><b>{[access, network, workload].filter(Boolean).length} of 3 example layers selected</b><p>Also protect secrets, update images, monitor activity, and test recovery. NetworkPolicy needs a network plugin that enforces it.</p></div>
    <p className="lab-source">This is a threat-model example, not a security scan or a guarantee of protection.</p>
  </Lab>
}

const terms = {
  Pod: 'A Pod groups one or more containers and runs on a node.',
  Deployment: 'A Deployment manages app copies and updates through ReplicaSets.',
  Service: 'A Service gives clients a stable way to reach selected endpoints.',
  PVC: 'A PersistentVolumeClaim (PVC) asks for storage a Pod can use.',
  Controller: 'A controller watches the cluster and works toward the requested state.',
}
function TermsLab() {
  const [term, setTerm] = useState<keyof typeof terms>('Pod')
  return <Lab name="VOCABULARY" title="Explore the Kubernetes building blocks">
    <p className="lab-intro">Choose a term to see what it does. These pieces work together; they are not different names for the same thing.</p>
    <div className="lab-controls"><fieldset><legend>CHOOSE A TERM</legend><div>{(Object.keys(terms) as (keyof typeof terms)[]).map(value => <button key={value} aria-pressed={term === value} onClick={() => setTerm(value)}>{value}</button>)}</div></fieldset></div>
    <div className="lab-flow"><div className="lab-node lab-node-good"><Boxes/><b>{term}</b><small>{terms[term]}</small></div></div>
    <div className="lab-result" role="status"><b>{term}</b><p>{terms[term]}</p></div>
  </Lab>
}

function ClusterDiagnosisLab() {
  const [api, setApi] = useState(true)
  const [node, setNode] = useState<'ready' | 'not-ready'>('not-ready')
  return <Lab name="CLUSTER TROUBLESHOOTING" title="Where should you look first?">
    <p className="lab-intro">Choose the API and node signals. The next useful check depends on which part is reachable.</p>
    <div className="lab-controls"><fieldset><legend>API SERVER</legend><div><button aria-pressed={api} onClick={() => setApi(true)}>Reachable</button><button aria-pressed={!api} onClick={() => setApi(false)}>Unreachable</button></div></fieldset><fieldset><legend>NODE STATUS</legend><div><button aria-pressed={node === 'ready'} onClick={() => setNode('ready')}>Ready</button><button aria-pressed={node === 'not-ready'} onClick={() => setNode('not-ready')}>NotReady</button></div></fieldset></div>
    <div className="lab-flow"><div className={`lab-node ${api ? 'lab-node-good' : 'lab-node-warning'}`}><Server/><b>API server</b><code>{api ? 'REACHABLE' : 'UNREACHABLE'}</code></div><div className={`lab-node ${node === 'ready' ? 'lab-node-good' : 'lab-node-warning'}`}><Boxes/><b>Node</b><code>{node === 'ready' ? 'READY' : 'NOTREADY'}</code></div></div>
    <div className="lab-result" role="status"><b>{!api ? 'Use approved host-level checks' : node === 'not-ready' ? 'Inspect the node and its events' : 'Narrow the affected workload'}</b><p>{!api ? 'kubectl depends on the API. Check access and control-plane components using approved host procedures; protect etcd quorum.' : node === 'not-ready' ? 'Use node conditions and events, then investigate kubelet, the runtime, networking, and resources.' : 'The API and this node are reachable. Check affected Pods, events, and other nodes before choosing a cause.'}</p></div>
    <p className="lab-source">Example signals do not prove a root cause. Keep evidence and follow your recovery runbook.</p>
  </Lab>
}

function WorkloadDiagnosisLab() {
  const [signal, setSignal] = useState<'events' | 'logs' | 'metrics'>('events')
  const notes = { events: 'Events can show scheduling, image pull, or probe problems.', logs: 'Logs show what a container wrote. After a restart, --previous can request earlier logs if available.', metrics: 'Metrics show resource usage if the metrics API is available. Missing metrics do not mean zero usage.' }
  return <Lab name="WORKLOAD TROUBLESHOOTING" title="Gather different kinds of clues">
    <p className="lab-intro">A restarting app needs more than one clue. Select a source and see what it can tell you.</p>
    <div className="lab-controls"><fieldset><legend>EVIDENCE SOURCE</legend><div>{(['events', 'logs', 'metrics'] as const).map(value => <button key={value} aria-pressed={signal === value} onClick={() => setSignal(value)}>{value}</button>)}</div></fieldset></div>
    <div className="lab-flow"><div className="lab-node lab-node-warning"><Boxes/><b>App Pod</b><small>Restarting</small><code>CrashLoopBackOff</code></div><div className="lab-node lab-node-good"><Search/><b>{signal}</b><small>{notes[signal]}</small></div></div>
    <div className="lab-result" role="status"><b>What {signal} can tell you</b><p>{notes[signal]} Compare the evidence and its timing before deciding on a fix.</p></div>
    <p className="lab-source">Illustrative evidence only; this does not run commands or read a real cluster.</p>
  </Lab>
}

export const foundationLabs: Record<string, ComponentType> = {
  'getting-started': StartLab,
  statefulsets: StatefulLab,
  api: ApiLab,
  security: SecurityLab,
  terminology: TermsLab,
  'cluster-troubleshooting': ClusterDiagnosisLab,
  'workload-troubleshooting': WorkloadDiagnosisLab,
}
