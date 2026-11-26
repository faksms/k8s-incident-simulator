import { useState } from 'react'
import { Boxes, Database, FileCode2, Network, Search, Server, ShieldCheck } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import LessonCoach from './LessonCoach'
import LabValue from './LabValue'
import './ConceptLabs.css'

function Lab({ title, name, children }: { title: string; name: string; children: ReactNode }) {
  return <div className="concept-lab"><div className="lab-heading"><div><small>INTERACTIVE EXAMPLE · {name}</small><h2>{title}</h2></div><Boxes size={23}/></div>{children}</div>
}

function StartLab() {
  const [context, setContext] = useState<'practice' | 'production'>('practice')
  const [namespace, setNamespace] = useState<'shop' | 'default'>('default')
  const [override, setOverride] = useState<'none' | 'tools'>('none')
  const targetNamespace = override === 'none' ? namespace : override
  return <Lab name="KUBECONFIG" title="Which cluster will receive your command?">
    <p className="lab-intro">A context selects a cluster, a user, and optionally a default namespace. Change the context before you inspect the example command.</p>
    <div className="lab-controls"><fieldset><legend>CURRENT CONTEXT</legend><div>{(['practice', 'production'] as const).map(value => <button key={value} aria-pressed={context === value} onClick={() => setContext(value)}>{value}</button>)}</div></fieldset><fieldset><legend>DEFAULT NAMESPACE</legend><div>{(['default', 'shop'] as const).map(value => <button key={value} aria-pressed={namespace === value} onClick={() => setNamespace(value)}>{value}</button>)}</div></fieldset><fieldset><legend>COMMAND NAMESPACE FLAG</legend><div><button aria-pressed={override === 'none'} onClick={() => setOverride('none')}>No flag</button><button aria-pressed={override === 'tools'} onClick={() => setOverride('tools')}>-n tools</button></div></fieldset></div>
    <div className="lab-flow"><div className="lab-node"><FileCode2/><b>kubectl get pods</b><small>{override === 'none' ? 'No namespace flag' : '-n tools'}</small></div><div className="lab-link path-ready"><span>TARGET</span></div><div className={`lab-node ${context === 'production' ? 'lab-node-warning' : 'lab-node-good'}`}><Server/><b>{context} cluster</b><small>User: {context}-user</small><LabValue value={`namespace: ${targetNamespace}`}/></div></div>
    <div className="lab-result" role="status"><b>The command targets {context} / {targetNamespace}</b><p>Check <code>kubectl config current-context</code> before making changes. {override === 'none' ? 'This command uses the selected default namespace.' : 'The -n flag overrides the default namespace for this command.'}</p></div>
    <LessonCoach task="Change the context to production and the namespace to shop. Check where the command would go." hint="The context and its default namespace are separate choices in this example. Choose No flag to use the default." complete={context === 'production' && namespace === 'shop' && override === 'none'} success="This example command would target the production cluster and shop namespace."/>
    <p className="lab-source">This is an example, not your actual kubeconfig. It does not connect to a cluster.</p>
  </Lab>
}

type StatefulState = { generation: number; records: number }
export function updateStatefulExample(state: StatefulState, action: 'write' | 'replace'): StatefulState {
  return action === 'write' ? { ...state, records: state.records + 1 } : { ...state, generation: state.generation + 1 }
}
function StatefulLab() {
  const [state, setState] = useState<StatefulState>({ generation: 1, records: 0 })
  const [compared, setCompared] = useState(false)
  return <Lab name="STATEFULSET" title="Replace a Pod without changing its identity">
    <p className="lab-intro">Write a record, then replace database-0. In this example its replacement can mount the same available claim.</p>
    <div className="lab-flow"><div className="lab-node lab-node-good"><Server/><b>database-0</b><small>Stable numbered name</small><LabValue value={`Pod instance ${state.generation}`}/></div><div className="lab-link active"><span>MOUNTS</span></div><div className="lab-node"><Database/><b>data-database-0</b><small>Persistent claim</small><LabValue value={`${state.records} record${state.records === 1 ? '' : 's'}`}/></div></div>
    <div className="stateful-records" role="img" aria-label={`${state.records} records on the persistent claim`}><span>RECORDS ON THE CLAIM</span><div aria-hidden="true">{Array.from({ length: Math.min(state.records, 12) }, (_, index) => <i key={index}/>)}{state.records === 0 && <small>No records yet</small>}{state.records > 12 && <small>+{state.records - 12} more</small>}</div></div>
    <div className="lab-actions"><button onClick={() => setState(current => updateStatefulExample(current, 'write'))}>Write a record</button><button onClick={() => { if (state.records > 0) setCompared(true); setState(current => updateStatefulExample(current, 'replace')) }}>Replace Pod</button><button onClick={() => { setState({ generation: 1, records: 0 }); setCompared(false) }}>Reset</button></div>
    <div className="lab-result" role="status"><b>{state.generation > 1 ? 'A new Pod has the same numbered name' : 'The Pod has a named claim'}</b><p>The Pod instance changes, but the StatefulSet can reuse its ordinal name and claim. A governing headless Service can provide stable DNS names.</p></div>
    <LessonCoach task="Write a record, then replace the Pod. Check its name and stored records." hint="The replacement can mount the same available claim in this example." complete={compared} success="A new Pod instance uses the same numbered name and the record remains on the claim."/>
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
    <div className="lab-flow"><div className="lab-node"><FileCode2/><b>Request</b><small>3 app copies</small></div><div className={`lab-node ${state.accepted ? 'lab-node-good' : 'lab-node-warning'}`}><Server/><b>API server</b><small>{state.accepted ? 'Change accepted' : 'No accepted change'}</small></div><div className="lab-node"><Boxes/><b>Controller</b><LabValue value={`${state.ready} / ${state.accepted ? state.desired : 0} ready`}/></div></div>
    <div className="api-pod-preview" role="img" aria-label={state.accepted ? `${state.ready} of ${state.desired} example Pods Ready` : 'No change accepted; no example Pods requested'}>
      <span>{state.accepted ? 'EXAMPLE POD READINESS' : 'SEND AN ALLOWED REQUEST TO START'}</span><div aria-hidden="true">{Array.from({ length: 3 }, (_, index) => <i key={index} className={state.accepted && index < state.ready ? 'api-pod-ready' : ''}>{state.accepted && index < state.ready ? 'READY' : '—'}</i>)}</div>
    </div>
    <div className="lab-actions"><button onClick={() => { if (allowed) { setState(current => updateApiExample(current, 'apply')); setMessage('The API accepted the request. The app copies still need to become Ready.') } else setMessage('The API denied this request. No new change was accepted.') }}>Send request</button><button disabled={!state.accepted || state.ready === state.desired} onClick={() => { setState(current => updateApiExample(current, 'reconcile')); setMessage('One more app copy is Ready in this example.') }}>Make one Pod Ready</button><button onClick={() => { setAllowed(false); setState({ desired: 3, ready: 0, accepted: false }); setMessage('Example reset. Send a request to begin.') }}>Reset</button></div>
    <div className="lab-result" role="status"><b>{message}</b><p>The API checks identity, access, and admission. After it accepts a change, controllers work toward it over time; readiness is a separate result.</p></div>
    <LessonCoach task="Allow the request, send it, then make one Pod Ready. Compare acceptance with readiness." hint="Choose Allowed, then Send request. The controller still needs time to make Pods Ready." complete={state.accepted && state.ready > 0} success="The request was accepted before all three Pods were Ready."/>
    <p className="lab-source">Simplified example: identity and admission succeed, and nodes have room. No real API request is sent.</p>
  </Lab>
}

function SecurityLab() {
  const [access, setAccess] = useState(false)
  const [network, setNetwork] = useState(false)
  const [workload, setWorkload] = useState(false)
  const [risk, setRisk] = useState<'api' | 'network' | 'container'>('api')
  const riskCovered = risk === 'api' ? access : risk === 'network' ? network : workload
  return <Lab name="SECURITY" title="Build layers around an app">
    <p className="lab-intro">Select a risk and safeguards to see which layer can help. No single switch makes a workload completely safe.</p>
    <div className="lab-controls"><fieldset><legend>EXAMPLE RISK</legend><div><button aria-pressed={risk === 'api'} onClick={() => setRisk('api')}>Unwanted API action</button><button aria-pressed={risk === 'network'} onClick={() => setRisk('network')}>Unwanted network connection</button><button aria-pressed={risk === 'container'} onClick={() => setRisk('container')}>Excess container privileges</button></div></fieldset></div>
    <div className="lab-controls"><fieldset><legend>EXAMPLE SAFEGUARDS</legend><div><button aria-pressed={access} onClick={() => setAccess(value => !value)}>Limit API access</button><button aria-pressed={network} onClick={() => setNetwork(value => !value)}>Restrict network traffic</button><button aria-pressed={workload} onClick={() => setWorkload(value => !value)}>Harden the container</button></div></fieldset></div>
    <div className="lab-flow">{[{ title: 'Identity', active: access, text: 'RBAC limits API actions' }, { title: 'Network', active: network, text: 'Policy limits selected traffic' }, { title: 'Workload', active: workload, text: 'Non-root and fewer privileges' }].map(item => <div key={item.title} className={`lab-node ${item.active ? 'lab-node-good' : 'lab-node-warning'}`}><ShieldCheck/><b>{item.title}</b><small>{item.text}</small><LabValue value={item.active ? 'SELECTED' : 'NOT SELECTED'}/></div>)}</div>
    <div className="lab-result" role="status"><b>{riskCovered ? 'A relevant safeguard is selected' : 'No relevant safeguard selected yet'}</b><p>{risk === 'api' ? 'RBAC can limit which API actions an identity may perform.' : risk === 'network' ? 'An enforced NetworkPolicy can limit selected connections.' : 'A restricted security context can reduce container privileges.'} Correct configuration and other safeguards still matter. {([access, network, workload].filter(Boolean).length)} of 3 example layers selected.</p></div>
    <LessonCoach task="Select all three example safeguards and see what each protects." hint="API access, network traffic, and container privileges address different risks." complete={access && network && workload} success="You added three different layers. More safeguards and ongoing checks are still needed."/>
    <p className="lab-source">This is a threat-model example, not a security scan or a guarantee of protection.</p>
  </Lab>
}

const terms = {
  Pod: 'A Pod groups one or more containers and runs on a node.',
  Deployment: 'A Deployment manages ReplicaSets to handle app copies and updates.',
  ReplicaSet: 'A ReplicaSet creates or removes Pods to reach its requested number of copies.',
  Service: 'A Service gives clients a stable way to reach selected endpoints.',
  PVC: 'A PersistentVolumeClaim (PVC) asks for storage a Pod can use.',
  Controller: 'A controller watches the cluster and works toward the requested state.',
}
function TermsLab() {
  const [term, setTerm] = useState<keyof typeof terms>('Pod')
  return <Lab name="VOCABULARY" title="Explore the Kubernetes building blocks">
    <p className="lab-intro">Choose a term to see what it does. These pieces work together; they are not different names for the same thing.</p>
    <div className="terms-diagram" aria-label="Select a Kubernetes building block">
      <div className="terms-chain">{(['Deployment', 'ReplicaSet', 'Pod'] as const).map((value, index) => <div className="terms-chain-part" key={value}><button type="button" aria-pressed={term === value} onClick={() => setTerm(value)}><Boxes size={18}/><b>{value}</b></button>{index < 2 && <span>manages →</span>}</div>)}</div>
      <div className="terms-related"><button type="button" aria-pressed={term === 'Service'} onClick={() => setTerm('Service')}><Network size={18}/><b>Service</b><small>selects Pods</small></button><button type="button" aria-pressed={term === 'PVC'} onClick={() => setTerm('PVC')}><Database size={18}/><b>PVC</b><small>can provide Pod storage</small></button><button type="button" aria-pressed={term === 'Controller'} onClick={() => setTerm('Controller')}><Server size={18}/><b>Controller</b><small>works toward the requested state</small></button></div>
    </div>
    <div className="lab-result" role="status"><b>{term}</b><p>{terms[term]}</p></div>
    <LessonCoach task="Select ReplicaSet to see how it relates to Pods." hint="A Deployment manages ReplicaSets, which work toward a requested Pod count." complete={term === 'ReplicaSet'} success="The ReplicaSet creates or removes Pods to reach its requested count."/>
  </Lab>
}

function ClusterDiagnosisLab() {
  const [api, setApi] = useState(true)
  const [node, setNode] = useState<'ready' | 'not-ready'>('not-ready')
  return <Lab name="CLUSTER TROUBLESHOOTING" title="Where should you look first?">
    <p className="lab-intro">Choose the API and node signals. The next useful check depends on which part is reachable.</p>
    <div className="lab-controls"><fieldset><legend>API SERVER</legend><div><button aria-pressed={api} onClick={() => setApi(true)}>Reachable</button><button aria-pressed={!api} onClick={() => setApi(false)}>Unreachable</button></div></fieldset><fieldset><legend>NODE STATUS</legend><div><button aria-pressed={node === 'ready'} onClick={() => setNode('ready')}>Ready</button><button aria-pressed={node === 'not-ready'} onClick={() => setNode('not-ready')}>NotReady</button></div></fieldset></div>
    <div className="lab-flow"><div className={`lab-node ${api ? 'lab-node-good' : 'lab-node-warning'}`}><Server/><b>API server</b><LabValue value={api ? 'REACHABLE' : 'UNREACHABLE'}/></div><div className={`lab-node ${node === 'ready' ? 'lab-node-good' : 'lab-node-warning'}`}><Boxes/><b>Node</b><small>{api ? 'Example reported condition' : 'Last known condition; may be stale'}</small><LabValue value={node === 'ready' ? 'READY' : 'NOTREADY'}/></div></div>
    <div className="lab-result" role="status"><b>{!api ? 'Use approved host-level checks' : node === 'not-ready' ? 'Inspect the node and its events' : 'Narrow the affected workload'}</b><p>{!api ? 'kubectl depends on the API. Check access and control-plane components using approved host procedures; protect etcd quorum.' : node === 'not-ready' ? 'Use node conditions and events, then investigate kubelet, the runtime, networking, and resources.' : 'The API and this node are reachable. Check affected Pods, events, and other nodes before choosing a cause.'}</p>{api && <p><code>{node === 'not-ready' ? 'kubectl describe node <node-name>' : 'kubectl get pods -A -o wide'}</code></p>}</div>
    <LessonCoach task="Make the API unreachable and check which investigation path the example suggests." hint="kubectl needs the API, so investigate access and control-plane health using approved procedures." complete={!api} success="When the API is unreachable, use approved checks outside the Kubernetes API."/>
    <p className="lab-source">Example signals do not prove a root cause. Keep evidence and follow your recovery runbook.</p>
  </Lab>
}

function WorkloadDiagnosisLab() {
  const [signal, setSignal] = useState<'events' | 'logs' | 'metrics'>('events')
  const notes = { events: 'Events can show scheduling, image pull, or probe problems.', logs: 'Logs show what a container wrote. After a restart, --previous can request earlier logs if available.', metrics: 'Metrics show resource usage if the metrics API is available. Missing metrics do not mean zero usage.' }
  const commands = { events: 'kubectl describe pod api -n shop', logs: 'kubectl logs api -n shop --previous', metrics: 'kubectl top pod api -n shop' }
  return <Lab name="WORKLOAD TROUBLESHOOTING" title="Gather different kinds of clues">
    <p className="lab-intro">A restarting app needs more than one clue. Select a source and see what it can tell you.</p>
    <div className="lab-controls"><fieldset><legend>EVIDENCE SOURCE</legend><div>{(['events', 'logs', 'metrics'] as const).map(value => <button key={value} aria-pressed={signal === value} onClick={() => setSignal(value)}>{value}</button>)}</div></fieldset></div>
    <div className="lab-flow"><div className="lab-node lab-node-warning"><Boxes/><b>App Pod</b><small>Restarting</small><code>CrashLoopBackOff</code></div><div className="lab-node lab-node-good"><Search/><LabValue value={signal}/><small>{notes[signal]}</small></div></div>
    <div className="lab-result" role="status"><b>What {signal} can tell you</b><p>{notes[signal]} Compare the evidence and its timing before deciding on a fix.</p><p><code>{commands[signal]}</code></p></div>
    <LessonCoach task="Select logs and find out what they can show after a container restart." hint="Look for the --previous option in the explanation." complete={signal === 'logs'} success="Previous container logs can provide clues after a restart, when they are available."/>
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
