import { useState, type ComponentType } from 'react'
import { Database, Globe, Network, Server, Shield, Waypoints } from 'lucide-react'
import './ConceptLabs.css'

export type NetworkStorageLessonId = 'service-types' | 'network-policy' | 'gateway' | 'provisioning'

type ServiceExample = {
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer'
  client: 'inside' | 'outside'
  selectorMatches: boolean
  endpointReady: boolean
  externalPathReady: boolean
}

export type ServiceDecision = { status: 'reachable' | 'blocked'; reason: 'ready' | 'selector' | 'endpoints' | 'cluster-ip' | 'external-path' }

export function resolveServiceExample(example: ServiceExample): ServiceDecision {
  if (!example.selectorMatches) return { status: 'blocked', reason: 'selector' }
  if (!example.endpointReady) return { status: 'blocked', reason: 'endpoints' }
  if (example.client === 'inside') return { status: 'reachable', reason: 'ready' }
  if (example.type === 'ClusterIP') return { status: 'blocked', reason: 'cluster-ip' }
  if (!example.externalPathReady) return { status: 'blocked', reason: 'external-path' }
  return { status: 'reachable', reason: 'ready' }
}

type PolicyExample = {
  ingressIsolated: boolean
  ingressAllows: boolean
  egressIsolated: boolean
  egressAllows: boolean
  pluginEnforces: boolean
}

export type PolicyDecision = { status: 'allowed' | 'blocked' | 'not-enforced'; reason: 'allowed' | 'ingress' | 'egress' | 'both' | 'plugin' }

export function resolvePolicyExample(example: PolicyExample): PolicyDecision {
  if (!example.pluginEnforces) return { status: 'not-enforced', reason: 'plugin' }
  const ingressBlocked = example.ingressIsolated && !example.ingressAllows
  const egressBlocked = example.egressIsolated && !example.egressAllows
  if (ingressBlocked && egressBlocked) return { status: 'blocked', reason: 'both' }
  if (ingressBlocked) return { status: 'blocked', reason: 'ingress' }
  if (egressBlocked) return { status: 'blocked', reason: 'egress' }
  return { status: 'allowed', reason: 'allowed' }
}

type GatewayExample = {
  controllerReady: boolean
  routeAttached: boolean
  listenerMatches: boolean
  backendConfigured: boolean
  endpointsReady: boolean
}

export type GatewayDecision = {
  status: 'routed' | 'waiting'
  reason: 'ready' | 'controller' | 'parent' | 'listener' | 'backend' | 'endpoints'
}

export function resolveGatewayExample(example: GatewayExample): GatewayDecision {
  if (!example.controllerReady) return { status: 'waiting', reason: 'controller' }
  if (!example.routeAttached) return { status: 'waiting', reason: 'parent' }
  if (!example.listenerMatches) return { status: 'waiting', reason: 'listener' }
  if (!example.backendConfigured) return { status: 'waiting', reason: 'backend' }
  if (!example.endpointsReady) return { status: 'waiting', reason: 'endpoints' }
  return { status: 'routed', reason: 'ready' }
}

type ProvisioningExample = {
  classMatches: boolean
  provisionerReady: boolean
  accessMatches: boolean
  waitForConsumer: boolean
  consumerScheduled: boolean
  reclaimPolicy: 'Delete' | 'Retain'
  backupExists: boolean
}

export type ProvisioningDecision = {
  status: 'bound' | 'pending'
  reason: 'ready' | 'class' | 'provisioner' | 'access' | 'consumer'
  deletion: 'backing-storage-may-be-removed' | 'kept-for-manual-handling'
  backup: 'separate-backup-exists' | 'no-backup'
}

export function resolveProvisioningExample(example: ProvisioningExample): ProvisioningDecision {
  let reason: ProvisioningDecision['reason'] = 'ready'
  if (!example.classMatches) reason = 'class'
  else if (!example.provisionerReady) reason = 'provisioner'
  else if (!example.accessMatches) reason = 'access'
  else if (example.waitForConsumer && !example.consumerScheduled) reason = 'consumer'
  return {
    status: reason === 'ready' ? 'bound' : 'pending',
    reason,
    deletion: example.reclaimPolicy === 'Delete' ? 'backing-storage-may-be-removed' : 'kept-for-manual-handling',
    backup: example.backupExists ? 'separate-backup-exists' : 'no-backup',
  }
}

const serviceReason: Record<ServiceDecision['reason'], string> = {
  ready: 'The selected Ready Pod has a usable endpoint and this client can reach the Service entry.',
  selector: 'No Pod labels match this Service selector, so it has no matching backend.',
  endpoints: 'The selected Pod is not Ready, so it is not a usable Service endpoint.',
  'cluster-ip': 'ClusterIP is for in-cluster access; an outside client needs another entry point.',
  'external-path': 'The Service requests exposure, but the needed node network or load-balancer infrastructure is not ready.',
}

const policyReason: Record<PolicyDecision['reason'], string> = {
  allowed: 'Both traffic directions allow this connection.',
  ingress: 'The destination is ingress-isolated and has no rule allowing this source.',
  egress: 'The source is egress-isolated and has no rule allowing this destination.',
  both: 'The source egress rule and destination ingress rule both block this connection.',
  plugin: 'The policy object is present, but this cluster example has no enforcing network plugin.',
}

const gatewayReason: Record<GatewayDecision['reason'], string> = {
  ready: 'The programmed Gateway accepts this route and sends it to a Ready backend.',
  controller: 'No compatible Gateway controller is ready to program the Gateway.',
  parent: 'The HTTPRoute is not attached to its Gateway parent.',
  listener: 'The route host does not match the Gateway listener.',
  backend: 'The route does not name a usable Service and port.',
  endpoints: 'The Service has no Ready endpoint to receive the routed request.',
}

const provisioningReason: Record<ProvisioningDecision['reason'], string> = {
  ready: 'The class, provisioner, access mode, and binding conditions match.',
  class: 'The claim and StorageClass do not match the example request.',
  provisioner: 'The StorageClass provisioner or storage driver is not available.',
  access: 'The available volume cannot satisfy the claim access mode.',
  consumer: 'WaitForFirstConsumer is waiting for a Pod and its scheduling location.',
}

export function ServiceTypesLab() {
  const [example, setExample] = useState<ServiceExample>({
    type: 'LoadBalancer', client: 'outside', selectorMatches: true, endpointReady: true, externalPathReady: false,
  })
  const decision = resolveServiceExample(example)
  const update = (patch: Partial<ServiceExample>) => setExample(current => ({ ...current, ...patch }))
  return <div className="concept-lab">
    <div className="lab-heading"><div><small>INTERACTIVE LAB · SERVICE TYPES</small><h2>Choose where traffic enters</h2></div><Globe size={23}/></div>
    <p className="lab-intro">Select a Service type, client location, and backend health. Follow the selected request to its Pod.</p>
    <div className="lab-controls">
      <fieldset><legend>SERVICE TYPE</legend><div>{(['ClusterIP', 'NodePort', 'LoadBalancer'] as const).map(type => <button key={type} type="button" aria-pressed={example.type === type} onClick={() => update({ type })}>{type}</button>)}</div></fieldset>
      <fieldset><legend>CLIENT LOCATION</legend><div>{(['inside', 'outside'] as const).map(client => <button key={client} type="button" aria-pressed={example.client === client} onClick={() => update({ client })}>{client === 'inside' ? 'Inside cluster' : 'Outside cluster'}</button>)}</div></fieldset>
      <fieldset><legend>BACKEND CHECKS</legend><div>
        <button type="button" aria-pressed={example.selectorMatches} onClick={() => update({ selectorMatches: !example.selectorMatches })}>Selector matches</button>
        <button type="button" aria-pressed={example.endpointReady} onClick={() => update({ endpointReady: !example.endpointReady })}>Pod Ready</button>
      </div></fieldset>
      {example.type !== 'ClusterIP' && <fieldset><legend>EXTERNAL NETWORK</legend><div><button type="button" aria-pressed={example.externalPathReady} onClick={() => update({ externalPathReady: !example.externalPathReady })}>{example.type === 'NodePort' ? 'Node path ready' : 'Load balancer ready'}</button></div></fieldset>}
    </div>
    <div className="lab-flow" aria-label="Compare Kubernetes Service entry types" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
      {(['ClusterIP', 'NodePort', 'LoadBalancer'] as const).map(type => {
        const selected = type === example.type
        const typeDecision = resolveServiceExample({ ...example, type })
        const typeWarning = typeDecision.status === 'blocked'
        return <div key={type} className={`lab-node ${selected ? typeWarning ? 'lab-node-warning' : 'lab-node-good' : ''}`} style={{ borderColor: selected ? '#65d8e6' : '#40566c', background: selected ? '#173447' : '#13283a' }}>
          {type === 'ClusterIP' ? <Network size={22}/> : type === 'NodePort' ? <Server size={22}/> : <Globe size={22}/>}
          <b>{type}</b>
          <small>{type === 'ClusterIP' ? 'virtual IP inside cluster' : type === 'NodePort' ? 'port on eligible nodes' : 'requests external load balancer'}</small>
          <code>{selected ? typeDecision.status === 'reachable' ? 'SELECTED · REACHABLE' : `SELECTED · ${typeDecision.reason.toUpperCase()}` : 'COMPARE'}</code>
        </div>
      })}
    </div>
    <div className={`lab-result ${decision.status === 'reachable' ? 'lab-result-good' : 'lab-result-warning'}`} role="status"><b>{decision.status === 'reachable' ? 'Request reaches the backend' : 'Request cannot reach the backend'}</b><p>{serviceReason[decision.reason]}</p></div>
    <p className="lab-source">Simplified example: one Service, one Pod, and a correct port mapping. A NodePort still depends on reachable node networking. A LoadBalancer Service only requests an external endpoint; compatible infrastructure/controller setup must provide it. <a href="https://kubernetes.io/docs/concepts/services-networking/service/" target="_blank" rel="noreferrer">Read about Services</a>.</p>
  </div>
}

export function NetworkPolicyLab() {
  const [example, setExample] = useState<PolicyExample>({
    ingressIsolated: true, ingressAllows: false, egressIsolated: true, egressAllows: true, pluginEnforces: true,
  })
  const decision = resolvePolicyExample(example)
  const update = (patch: Partial<PolicyExample>) => setExample(current => ({ ...current, ...patch }))
  return <div className="concept-lab">
    <div className="lab-heading"><div><small>INTERACTIVE LAB · NETWORK POLICY</small><h2>Check both sides of a connection</h2></div><Shield size={23}/></div>
    <p className="lab-intro">NetworkPolicy selects Pods and isolates directions. Toggle source egress, destination ingress, and each side’s allow rule.</p>
    <div className="lab-controls">
      <fieldset><legend>SOURCE · api IN shop</legend><div>
        <button type="button" aria-pressed={example.egressIsolated} onClick={() => update({ egressIsolated: !example.egressIsolated })}>{example.egressIsolated ? 'Egress isolated' : 'Egress open'}</button>
        <button type="button" aria-pressed={example.egressAllows} onClick={() => update({ egressAllows: !example.egressAllows })}>{example.egressAllows ? 'Rule allows database' : 'No allow rule'}</button>
      </div></fieldset>
      <fieldset><legend>DESTINATION · db IN shop</legend><div>
        <button type="button" aria-pressed={example.ingressIsolated} onClick={() => update({ ingressIsolated: !example.ingressIsolated })}>{example.ingressIsolated ? 'Ingress isolated' : 'Ingress open'}</button>
        <button type="button" aria-pressed={example.ingressAllows} onClick={() => update({ ingressAllows: !example.ingressAllows })}>{example.ingressAllows ? 'Rule allows api' : 'No allow rule'}</button>
      </div></fieldset>
      <fieldset><legend>CLUSTER NETWORK</legend><div><button type="button" aria-pressed={example.pluginEnforces} onClick={() => update({ pluginEnforces: !example.pluginEnforces })}>{example.pluginEnforces ? 'Plugin enforces policy' : 'No enforcing plugin'}</button></div></fieldset>
    </div>
    <div className="lab-flow" aria-label="NetworkPolicy direction matrix" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
      <div className={`lab-node ${decision.reason === 'egress' || decision.reason === 'both' || decision.reason === 'plugin' ? 'lab-node-warning' : 'lab-node-good'}`} style={{ borderColor: '#e5a450', background: '#35291e' }}><Network size={22}/><b>Source · api in shop</b><small>Outgoing traffic to db:5432</small><code>{!example.pluginEnforces ? 'PLUGIN DOES NOT ENFORCE' : example.egressIsolated ? example.egressAllows ? 'EGRESS RULE ALLOWS' : 'ISOLATED · BLOCKED' : 'EGRESS NOT ISOLATED'}</code></div>
      <div className={`lab-node ${decision.reason === 'ingress' || decision.reason === 'both' || decision.reason === 'plugin' ? 'lab-node-warning' : 'lab-node-good'}`} style={{ borderColor: '#5aaed1', background: '#1b2c3b' }}><Database size={22}/><b>Destination · db in shop</b><small>Incoming traffic from api:5432</small><code>{!example.pluginEnforces ? 'PLUGIN DOES NOT ENFORCE' : example.ingressIsolated ? example.ingressAllows ? 'INGRESS RULE ALLOWS' : 'ISOLATED · BLOCKED' : 'INGRESS NOT ISOLATED'}</code></div>
    </div>
    <div className={`lab-result ${decision.status === 'allowed' ? 'lab-result-good' : 'lab-result-warning'}`} role="status"><b>{decision.status === 'allowed' ? 'Connection allowed' : decision.status === 'not-enforced' ? 'Policy is not being enforced' : 'Connection blocked'}</b><p>{policyReason[decision.reason]}</p></div>
    <p className="lab-source">Simplified example: one source, one destination, and one rule per direction. Isolation and allowed traffic are direction-specific; policies add allowed traffic together. A NetworkPolicy has no effect unless the cluster’s network plugin enforces it. <a href="https://kubernetes.io/docs/concepts/services-networking/network-policies/" target="_blank" rel="noreferrer">Read about NetworkPolicy</a>.</p>
  </div>
}

export function GatewayLab() {
  const [example, setExample] = useState<GatewayExample>({
    controllerReady: true, routeAttached: true, listenerMatches: true, backendConfigured: true, endpointsReady: true,
  })
  const decision = resolveGatewayExample(example)
  const update = (patch: Partial<GatewayExample>) => setExample(current => ({ ...current, ...patch }))
  const checkButton = (key: keyof GatewayExample, label: string) => <button type="button" aria-pressed={example[key]} onClick={() => update({ [key]: !example[key] })}>{label}: {example[key] ? 'Ready' : 'Needs check'}</button>
  return <div className="concept-lab">
    <div className="lab-heading"><div><small>INTERACTIVE LAB · GATEWAY API</small><h2>Match the listener, route, and backend</h2></div><Waypoints size={23}/></div>
    <p className="lab-intro">A request needs a programmed Gateway, an attached HTTPRoute, a matching listener, and a healthy Service backend.</p>
    <div className="lab-controls">
      <fieldset><legend>IMPLEMENTATION</legend><div>{checkButton('controllerReady', 'Controller has programmed Gateway')}</div></fieldset>
      <fieldset><legend>ROUTE ATTACHMENT & LISTENER</legend><div>{checkButton('routeAttached', 'Route parent')}{checkButton('listenerMatches', 'Host matches listener')}</div></fieldset>
      <fieldset><legend>BACKEND</legend><div>{checkButton('backendConfigured', 'Service port')}{checkButton('endpointsReady', 'Ready endpoints')}</div></fieldset>
    </div>
    <div className="lab-flow" aria-label="Gateway API resource status board" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: 10 }}>
      <div className={`lab-node ${example.controllerReady ? 'lab-node-good' : 'lab-node-warning'}`} style={{ borderColor: '#50c7b1', background: '#173a38' }}><Waypoints size={22}/><b>Gateway listener</b><small>HTTPS · shop.example</small><code>{example.controllerReady ? 'CONTROLLER PROGRAMMED' : 'CONTROLLER MISSING'}</code></div>
      <div className={`lab-node ${example.routeAttached && example.listenerMatches ? 'lab-node-good' : 'lab-node-warning'}`} style={{ borderColor: '#ab81df', background: '#2a2340' }}><Globe size={22}/><b>HTTPRoute</b><small>Parent: shop-gw · Path: /</small><code>{example.routeAttached ? example.listenerMatches ? 'ATTACHED · HOST MATCH' : 'HOST MISMATCH' : 'PARENT NOT ATTACHED'}</code></div>
      <div className={`lab-node ${example.backendConfigured && example.endpointsReady ? 'lab-node-good' : 'lab-node-warning'}`} style={{ borderColor: '#59aed3', background: '#1b2c3c' }}><Server size={22}/><b>Backend Service</b><small>shop:8080 · {example.endpointsReady ? '2 Ready endpoints' : '0 Ready endpoints'}</small><code>{!example.backendConfigured ? 'SERVICE PORT MISSING' : example.endpointsReady ? 'READY BACKENDS' : 'NO READY ENDPOINTS'}</code></div>
    </div>
    <div className={`lab-result ${decision.status === 'routed' ? 'lab-result-good' : 'lab-result-warning'}`} role="status"><b>{decision.status === 'routed' ? 'Request is routed to shop' : 'Route is not ready'}</b><p>{gatewayReason[decision.reason]}</p></div>
    <p className="lab-source">Simplified example: one Gateway listener, HTTPRoute, Service port, and ready endpoints. Gateway API objects describe intent; a compatible controller must program them. Check parent references, listener and route status, backend port, and EndpointSlices. <a href="https://gateway-api.sigs.k8s.io/" target="_blank" rel="noreferrer">Read about Gateway API</a>.</p>
  </div>
}

export function ProvisioningLab() {
  const [example, setExample] = useState<ProvisioningExample>({
    classMatches: true, provisionerReady: true, accessMatches: true, waitForConsumer: true,
    consumerScheduled: false, reclaimPolicy: 'Delete', backupExists: false,
  })
  const decision = resolveProvisioningExample(example)
  const update = (patch: Partial<ProvisioningExample>) => setExample(current => ({ ...current, ...patch }))
  return <div className="concept-lab">
    <div className="lab-heading"><div><small>INTERACTIVE LAB · STORAGE PROVISIONING</small><h2>Why is this claim Pending?</h2></div><Database size={23}/></div>
    <p className="lab-intro">Check the requested StorageClass, provisioner, access mode, and binding mode. Then inspect what happens when the claim is deleted.</p>
    <div className="lab-controls">
      <fieldset><legend>CLAIM AND STORAGE CLASS</legend><div>
        <button type="button" aria-pressed={example.classMatches} onClick={() => update({ classMatches: !example.classMatches })}>Class: {example.classMatches ? 'gold-csi' : 'does not match'}</button>
        <button type="button" aria-pressed={example.provisionerReady} onClick={() => update({ provisionerReady: !example.provisionerReady })}>CSI provisioner: {example.provisionerReady ? 'available' : 'unavailable'}</button>
      </div></fieldset>
      <fieldset><legend>VOLUME FIT</legend><div><button type="button" aria-pressed={example.accessMatches} onClick={() => update({ accessMatches: !example.accessMatches })}>Access mode: {example.accessMatches ? 'compatible' : 'not compatible'}</button></div></fieldset>
      <fieldset><legend>BINDING MODE</legend><div>
        <button type="button" aria-pressed={example.waitForConsumer} onClick={() => update({ waitForConsumer: !example.waitForConsumer })}>WaitForFirstConsumer: {example.waitForConsumer ? 'on' : 'off'}</button>
        <button type="button" aria-pressed={example.consumerScheduled} onClick={() => update({ consumerScheduled: !example.consumerScheduled })}>Node selected for Pod: {example.consumerScheduled ? 'yes' : 'not yet'}</button>
      </div></fieldset>
      <fieldset><legend>AFTER CLAIM DELETION</legend><div>
        {(['Delete', 'Retain'] as const).map(policy => <button key={policy} type="button" aria-pressed={example.reclaimPolicy === policy} onClick={() => update({ reclaimPolicy: policy })}>{policy}</button>)}
        <button type="button" aria-pressed={example.backupExists} onClick={() => update({ backupExists: !example.backupExists })}>Separate backup: {example.backupExists ? 'exists' : 'none'}</button>
      </div></fieldset>
    </div>
    <div className="lab-flow" aria-label="PVC fit checks and data lifecycle" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: 10 }}>
      <div className={`lab-node ${example.classMatches ? 'lab-node-good' : 'lab-node-warning'}`} style={{ borderColor: '#b98ce8', background: '#29213d' }}><Database size={22}/><b>PVC request · 20 Gi</b><small>gold-csi · ReadWriteOnce</small><code>{example.classMatches ? 'CLASS MATCH' : 'CLASS MISMATCH'}</code></div>
      <div className={`lab-node ${example.provisionerReady && example.accessMatches ? 'lab-node-good' : 'lab-node-warning'}`} style={{ borderColor: '#55c5a5', background: '#183730' }}><Server size={22}/><b>Provisioner & access</b><small>CSI driver · storage capability</small><code>{!example.provisionerReady ? 'DRIVER UNAVAILABLE' : example.accessMatches ? 'REQUEST CAN FIT' : 'ACCESS MODE MISMATCH'}</code></div>
      <div className={`lab-node ${decision.status === 'bound' ? 'lab-node-good' : 'lab-node-warning'}`} style={{ borderColor: '#e5a450', background: '#35291e' }}><Database size={22}/><b>{decision.status === 'bound' ? 'Bound volume' : 'Claim Pending'}</b><small>{example.reclaimPolicy} · {example.backupExists ? 'backup exists' : 'no backup'}</small><code>{decision.reason === 'consumer' ? 'WAITING FOR POD' : decision.status === 'bound' ? 'PV BOUND' : 'CHECK REQUEST'}</code></div>
    </div>
    <div className={`lab-result ${decision.status === 'bound' ? 'lab-result-good' : 'lab-result-warning'}`} role="status"><b>{decision.status === 'bound' ? 'Claim is Bound' : decision.reason === 'consumer' ? 'Waiting for a consuming Pod' : 'Claim is Pending'}</b><p>{provisioningReason[decision.reason]} If a bound claim is deleted, its reclaim policy applies: {decision.deletion === 'backing-storage-may-be-removed' ? 'Delete may remove backing storage.' : 'Retain keeps storage for manual handling.'} Backup check: {decision.backup === 'no-backup' ? 'no backup is represented here' : 'a separate backup is represented here'}.</p></div>
    <p className="lab-source">Simplified example: one CSI-backed class and one claim. Provisioning needs a matching class/provisioner and compatible access mode; WaitForFirstConsumer can wait for scheduling. Reclaim policy does not equal backup—verify the storage system and backup separately. <a href="https://kubernetes.io/docs/concepts/storage/storage-classes/" target="_blank" rel="noreferrer">Read about StorageClasses</a>.</p>
  </div>
}

export const networkStorageLessonLabs: Record<NetworkStorageLessonId, ComponentType> = {
  'service-types': ServiceTypesLab,
  'network-policy': NetworkPolicyLab,
  gateway: GatewayLab,
  provisioning: ProvisioningLab,
}
