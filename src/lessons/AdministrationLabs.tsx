import { useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { Boxes, ChartNoAxesCombined, Database, Network, Package, Server } from 'lucide-react'
import LessonCoach from './LessonCoach'
import LabValue from './LabValue'
import './ConceptLabs.css'

type ChoiceProps<T extends string | number> = {
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
}

function Choice<T extends string | number>({ label, value, options, onChange }: ChoiceProps<T>) {
  return <fieldset><legend>{label}</legend><div>{options.map(option =>
    <button type="button" key={option.value} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>
  )}</div></fieldset>
}

const yesNo = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] as const
type YesNo = 'yes' | 'no'

function Card({ title, detail, value, good }: { title: string; detail: string; value: string | number; good: boolean }) {
  return <div className={`lab-node ${good ? 'lab-node-good' : 'lab-node-warning'}`}><b>{title}</b><small>{detail}</small><LabValue value={value}/></div>
}

function Result({ good, title, children }: { good: boolean; title: string; children: ReactNode }) {
  return <div className={`lab-result ${good ? 'lab-result-good' : 'lab-result-warning'}`} role="status"><b>{title}</b><p>{children}</p></div>
}

type BootstrapSettings = { prepared: YesNo; initialized: YesNo; cni: YesNo; joined: YesNo }
export function bootstrapExample(s: BootstrapSettings) {
  const controlPlane = s.prepared === 'yes' && s.initialized === 'yes'
  return { controlPlane, workerJoined: controlPlane && s.joined === 'yes', networkConfigured: controlPlane && s.cni === 'yes' }
}

export function KubeadmLab() {
  const [s, set] = useState<BootstrapSettings>({ prepared: 'yes', initialized: 'yes', cni: 'no', joined: 'no' })
  const result = bootstrapExample(s)
  return <div className="concept-lab">
    <div className="lab-heading"><div><small>BOOTSTRAP SANDBOX</small><h2>What does kubeadm leave to you?</h2></div><Server size={24}/></div>
    <p className="lab-intro">Prepare the hosts, initialize the control plane, and try joining a worker. Then add a compatible Pod network and compare the results.</p>
    <div className="lab-controls">
      <Choice label="HOSTS PREPARED" value={s.prepared} options={yesNo} onChange={prepared => set({ ...s, prepared })}/>
      <Choice label="INIT SUCCEEDED" value={s.initialized} options={yesNo} onChange={initialized => set({ ...s, initialized })}/>
      <Choice label="COMPATIBLE POD NETWORK INSTALLED" value={s.cni} options={yesNo} onChange={cni => set({ ...s, cni })}/>
      <Choice label="WORKER JOIN SUCCEEDED" value={s.joined} options={yesNo} onChange={joined => set({ ...s, joined })}/>
    </div>
    <div className="lab-flow" aria-label="Bootstrap outcomes">
      <Card title="Control plane" detail="Prepared hosts and successful init" value={result.controlPlane ? 'INITIALIZED' : 'NOT INITIALIZED'} good={result.controlPlane}/>
      <Card title="Worker" detail="Joining is separate from network installation" value={result.workerJoined ? 'JOINED' : 'NOT JOINED'} good={result.workerJoined}/>
      <Card title="Pod network" detail="Provided by a compatible add-on" value={result.networkConfigured ? 'INSTALLED' : 'NOT INSTALLED'} good={result.networkConfigured}/>
    </div>
    <Result good={result.controlPlane && result.workerJoined && result.networkConfigured} title={!result.controlPlane ? 'Prepare hosts and initialize first' : !result.networkConfigured ? 'Initialization does not install a Pod network' : !result.workerJoined ? 'Network installed; join the worker' : 'The example prerequisites are in place'}>Check node readiness and system Pods after setup. A worker can join before the Pod network is installed, but networking and readiness still need verification.</Result>
    <LessonCoach task="Join the worker, then install the Pod network. Compare the three status cards." hint="Worker joining and Pod networking are separate steps. Select Yes for both." complete={result.workerJoined && result.networkConfigured} success="The worker joined and the network was installed in this example; check readiness separately."/>
    <p className="lab-source">Simplified simulation, not a live cluster or readiness test. It assumes compatible versions, a working runtime and correct network configuration when selected. Keep join tokens and kubeconfig secure. <a href="https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/">Kubeadm guide</a>.</p>
  </div>
}

type LifecycleSettings = { healthy: 2 | 3; maintenance: YesNo; backup: YesNo; pdb: YesNo }
export function lifecycleExample(s: LifecycleSettings) {
  const remaining = s.healthy - (s.maintenance === 'yes' ? 1 : 0)
  return { remaining, quorum: remaining >= 2, drainAllowed: s.pdb === 'yes', backupReady: s.backup === 'yes' }
}

export function ClusterLifecycleLab() {
  const [s, set] = useState<LifecycleSettings>({ healthy: 3, maintenance: 'yes', backup: 'no', pdb: 'yes' })
  const r = lifecycleExample(s)
  return <div className="concept-lab">
    <div className="lab-heading"><div><small>MAINTENANCE PLANNER</small><h2>Protect quorum and recovery</h2></div><Database size={24}/></div>
    <p className="lab-intro">This cluster has three etcd members. Take one healthy member down for maintenance and compare quorum with backup and workload safeguards.</p>
    <div className="lab-controls">
      <Choice label="HEALTHY ETCD MEMBERS BEFORE MAINTENANCE" value={s.healthy} options={[{ value: 3, label: '3 healthy' }, { value: 2, label: '2 healthy' }]} onChange={healthy => set({ ...s, healthy })}/>
      <Choice label="TAKE ONE HEALTHY MEMBER DOWN" value={s.maintenance} options={yesNo} onChange={maintenance => set({ ...s, maintenance })}/>
      <Choice label="TESTED ETCD BACKUP AVAILABLE" value={s.backup} options={yesNo} onChange={backup => set({ ...s, backup })}/>
      <Choice label="PDB ALLOWS EVICTION" value={s.pdb} options={yesNo} onChange={pdb => set({ ...s, pdb })}/>
    </div>
    <div className="lab-flow" aria-label="Etcd quorum and safeguards">
      {[1, 2, 3].map(n => <Card key={n} title={`etcd member ${n}`} detail={n <= r.remaining ? 'Available' : 'Unavailable'} value={n <= r.remaining ? 'ONLINE' : 'OFFLINE'} good={n <= r.remaining}/>)}
    </div>
    <Result good={r.quorum && r.backupReady && r.drainAllowed} title={`${r.remaining} of 3 members available · ${r.quorum ? 'quorum remains' : 'quorum lost'}`}>
      {r.quorum ? 'A majority of two is available.' : 'One member is not a majority; etcd cannot make normal progress.'} {r.backupReady ? 'A tested backup is available.' : 'High availability is not a backup; prepare and test etcd recovery.'} {r.drainAllowed ? 'The example PDB permits eviction.' : 'The PDB blocks this example eviction; drain must wait.'}
    </Result>
    <LessonCoach task="Start with two healthy etcd members and take one down. Watch the quorum result." hint="Three members need a majority of two to make normal progress." complete={s.healthy === 2 && s.maintenance === 'yes' && !r.quorum} success="Only one member remains, so this three-member example loses quorum."/>
    <p className="lab-source">Simplified simulation: one healthy etcd member is taken offline at most, and the PDB describes only one workload. Cordon prevents new scheduling but does not evict; drain has exceptions and other safeguards. Follow current version-skew and kubeadm upgrade guidance, verify health after each stage, and use a tested recovery plan. <a href="https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/">Upgrade guidance</a>.</p>
  </div>
}

type ExtensionSettings = { cri: YesNo; cni: YesNo; csi: YesNo }
export function extensionExample(s: ExtensionSettings) {
  return { runtime: s.cri === 'yes', network: s.cri === 'yes' && s.cni === 'yes', storage: s.csi === 'yes' }
}

export function ClusterExtensionsLab() {
  const [s, set] = useState<ExtensionSettings>({ cri: 'yes', cni: 'yes', csi: 'yes' })
  const r = extensionExample(s)
  return <div className="concept-lab">
    <div className="lab-heading"><div><small>INTEGRATION DIAGNOSTICS</small><h2>Which boundary is affected?</h2></div><Network size={24}/></div>
    <p className="lab-intro">Switch each integration between working and unavailable. See which part of this Pod setup is affected.</p>
    <div className="lab-controls">
      <Choice label="CRI RUNTIME WORKING" value={s.cri} options={yesNo} onChange={cri => set({ ...s, cri })}/>
      <Choice label="CNI PLUGIN WORKING" value={s.cni} options={yesNo} onChange={cni => set({ ...s, cni })}/>
      <Choice label="CSI DRIVER WORKING" value={s.csi} options={yesNo} onChange={csi => set({ ...s, csi })}/>
    </div>
    <div className="lab-flow" aria-label="Integration diagnostics">
      <Card title="CRI · containers" detail="Kubelet talks to the runtime" value={r.runtime ? 'RUNTIME AVAILABLE' : 'RUNTIME UNAVAILABLE'} good={r.runtime}/>
      <Card title="CNI · Pod network" detail="Runtime calls plugins for the sandbox" value={r.network ? 'SETUP AVAILABLE' : 'SETUP BLOCKED'} good={r.network}/>
      <Card title="CSI · volume" detail="Driver integrates the storage system" value={r.storage ? 'DRIVER AVAILABLE' : 'DRIVER UNAVAILABLE'} good={r.storage}/>
    </div>
    <Result good={r.runtime && r.network && r.storage} title={r.runtime && r.network && r.storage ? 'All three integrations are available' : 'Investigate the affected boundary'}>CRI manages sandboxes and containers, CNI configures Pod networking, and CSI provides storage integration. NetworkPolicy enforcement depends on the network implementation.</Result>
    <LessonCoach task="Turn off the CNI plugin and compare the network with the runtime and storage." hint="Choose No under CNI while leaving CRI and CSI working." complete={s.cri === 'yes' && s.cni === 'no' && s.csi === 'yes'} success="In this example, Pod network setup is blocked while the other integrations remain available."/>
    <p className="lab-source">Simplified simulation of a new Pod using a CSI volume, not a diagnostic of a real cluster. Working drivers do not guarantee connectivity, provisioning, mounting, or policy support; capabilities depend on the implementation. <a href="https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/">Integration interfaces</a>.</p>
  </div>
}

type PackagingSettings = { tool: 'helm' | 'kustomize'; environment: 'development' | 'production' }
export function packagingExample(s: PackagingSettings) {
  const replicas = s.environment === 'production' ? 3 : 1
  return { replicas, source: s.tool === 'helm' ? 'Chart + values' : 'Base + overlay', history: s.tool === 'helm' ? 'Helm release revisions' : 'No Kustomize release history' }
}

export function HelmKustomizeLab() {
  const [s, set] = useState<PackagingSettings>({ tool: 'helm', environment: 'development' })
  const r = packagingExample(s)
  return <div className="concept-lab">
    <div className="lab-heading"><div><small>MANIFEST WORKBENCH</small><h2>Two routes to a manifest</h2></div><Package size={24}/></div>
    <p className="lab-intro">Choose the tool and environment. Both examples render the same Deployment replica count, but their inputs and release tracking differ.</p>
    <div className="lab-controls">
      <Choice label="TOOL" value={s.tool} options={[{ value: 'helm', label: 'Helm' }, { value: 'kustomize', label: 'Kustomize' }]} onChange={tool => set({ ...s, tool })}/>
      <Choice label="ENVIRONMENT" value={s.environment} options={[{ value: 'development', label: 'Development' }, { value: 'production', label: 'Production' }]} onChange={environment => set({ ...s, environment })}/>
    </div>
    <div className="lab-flow" aria-label="Manifest preview">
      <Card title={r.source} detail={s.tool === 'helm' ? 'Values fill chart templates' : 'Overlay modifies base manifests'} value={s.environment.toUpperCase()} good/>
      <Card title="Rendered Deployment" detail="Preview before applying" value={`spec.replicas: ${r.replicas}`} good/>
    </div>
    <Result good title={r.history}>{s.tool === 'helm' ? 'Helm tracks a release and its revisions when installed; rendering alone does not create one. Release history is not Deployment rollout history.' : 'Kustomize builds manifests; applying them is a separate operation. It does not itself track Helm-style releases.'}</Result>
    <LessonCoach task="Choose Kustomize and production. Watch the rendered replica count and release-history explanation." hint="Use the Tool and Environment choices above." complete={s.tool === 'kustomize' && s.environment === 'production'} success="The production example renders three replicas, without Helm-style release history."/>
    <p className="lab-source">Simplified simulation, no manifests are applied. Review rendered permissions, cluster-wide resources, ownership and secrets. Rollback may not restore external data. Preview with helm template or kubectl kustomize. <a href="https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/">Kustomize documentation</a>.</p>
  </div>
}

type OperatorSettings = { crd: YesNo; controller: YesNo; desired: 1 | 3 }
export function operatorExample(s: OperatorSettings) {
  const accepted = s.crd === 'yes'
  const reconciles = accepted && s.controller === 'yes'
  return { accepted, reconciles, observed: reconciles ? s.desired : 1 }
}

export function OperatorsLab() {
  const [s, set] = useState<OperatorSettings>({ crd: 'yes', controller: 'no', desired: 3 })
  const r = operatorExample(s)
  return <div className="concept-lab">
    <div className="lab-heading"><div><small>RECONCILIATION LAB</small><h2>Accepted is not reconciled</h2></div><Boxes size={24}/></div>
    <p className="lab-intro">A fictional database already has one copy. Register its resource type, request a desired count and see whether the operator acts.</p>
    <div className="lab-controls">
      <Choice label="CRD REGISTERED" value={s.crd} options={yesNo} onChange={crd => set({ ...s, crd })}/>
      <Choice label="OPERATOR RUNNING" value={s.controller} options={yesNo} onChange={controller => set({ ...s, controller })}/>
      <Choice label="CUSTOM RESOURCE DESIRED COPIES" value={s.desired} options={[{ value: 1, label: '1 copy' }, { value: 3, label: '3 copies' }]} onChange={desired => set({ ...s, desired })}/>
    </div>
    <div className="lab-flow" aria-label="Desired versus observed copies">
      <Card title="API registration" detail="The CRD defines the type and schema" value={r.accepted ? 'TYPE REGISTERED' : 'TYPE UNKNOWN'} good={r.accepted}/>
      <Card title="Custom resource" detail="The desired count is stored only if accepted" value={r.accepted ? `${s.desired} DESIRED` : 'NOT ACCEPTED'} good={r.accepted}/>
      <Card title="Observed database" detail={r.reconciles ? 'Operator reconciles the object' : 'No reconciliation in this example'} value={`${r.observed} COPIES`} good={r.reconciles}/>
    </div>
    <Result good={r.reconciles} title={!r.accepted ? 'The API does not know this type' : !r.reconciles ? 'The resource can exist without an operator' : 'The operator moves observed state toward desired state'}>A CRD registers a type; an instance describes desired state. A running controller implements behavior, rather than the CRD itself.</Result>
    <LessonCoach task="Start the operator and watch the observed database copies move toward the requested three." hint="The CRD is already registered. Select Yes for Operator running." complete={r.reconciles && s.desired === 3} success="The example operator moves the observed count from one to three."/>
    <p className="lab-source">Simplified simulation: the custom resource is valid, the existing database starts at one copy, and a working authorized operator converges instantly. Real controllers can fail or take time; check their status, permissions and logs. <a href="https://kubernetes.io/docs/concepts/extend-kubernetes/operator/">Operator pattern</a>.</p>
  </div>
}

type AutoscalingSettings = { metrics: YesNo; requests: YesNo; usage: 25 | 50 | 150; min: 1 | 2; max: 3 | 6 }
export function autoscalingExample(s: AutoscalingSettings) {
  if (s.metrics !== 'yes' || s.requests !== 'yes') return { desired: null, raw: null }
  const raw = Math.ceil(2 * s.usage / 50)
  return { raw, desired: Math.max(s.min, Math.min(s.max, raw)) }
}

export function AutoscalingLab() {
  const [s, set] = useState<AutoscalingSettings>({ metrics: 'yes', requests: 'yes', usage: 150, min: 1, max: 3 })
  const r = autoscalingExample(s)
  return <div className="concept-lab">
    <div className="lab-heading"><div><small>HPA CALCULATOR</small><h2>From CPU demand to replicas</h2></div><ChartNoAxesCombined size={24}/></div>
    <p className="lab-intro">Two running Pods each request 100m CPU when requests are present. The target is 50% utilization. Change their average usage, replica bounds, and measurement prerequisites.</p>
    <div className="lab-controls">
      <Choice label="RESOURCE METRICS AVAILABLE" value={s.metrics} options={yesNo} onChange={metrics => set({ ...s, metrics })}/>
      <Choice label="CPU REQUESTS PRESENT" value={s.requests} options={yesNo} onChange={requests => set({ ...s, requests })}/>
      <Choice label="AVERAGE CPU PER POD" value={s.usage} options={[{ value: 25, label: '25m' }, { value: 50, label: '50m' }, { value: 150, label: '150m' }]} onChange={usage => set({ ...s, usage })}/>
      <Choice label="MIN REPLICAS" value={s.min} options={[{ value: 1, label: '1' }, { value: 2, label: '2' }]} onChange={min => set({ ...s, min })}/>
      <Choice label="MAX REPLICAS" value={s.max} options={[{ value: 3, label: '3' }, { value: 6, label: '6' }]} onChange={max => set({ ...s, max })}/>
    </div>
    <div className="lab-flow" aria-label="CPU scaling calculation">
      <Card title="Measured utilization" detail="Usage divided by 100m request" value={s.metrics === 'yes' && s.requests === 'yes' ? `${s.usage}%` : 'UNKNOWN'} good={r.desired !== null}/>
      <Card title="Calculated replicas" detail="2 × utilization / 50%, rounded up" value={r.raw === null ? 'UNAVAILABLE' : r.raw} good={r.raw !== null}/>
      <Card title="Desired replicas" detail={`Bounded by min ${s.min} and max ${s.max}`} value={r.desired === null ? 'NO CPU SIGNAL' : r.desired} good={r.desired !== null}/>
    </div>
    <div className="hpa-replica-preview" role="img" aria-label={r.desired === null ? 'Desired replicas cannot be calculated from this CPU signal' : `Desired replicas: ${r.desired} of 6 shown`}>
      <span>DESIRED COPIES · NOT RUNNING PODS</span><div aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <i key={index} className={r.desired !== null && index < r.desired ? 'hpa-slot-active' : ''}/>)}</div>
    </div>
    <Result good={r.desired !== null} title={r.desired === null ? 'Cannot calculate this CPU utilization signal' : `Example desired count: ${r.desired}`}>{r.desired === null ? 'The HPA needs a resource metrics provider and CPU requests for the relevant containers to calculate utilization.' : r.raw !== r.desired ? 'The minimum or maximum replica setting bounds the calculated count.' : 'The calculated count is within the configured limits.'} The HPA adjusts desired replicas, not node capacity; new Pods still need resources and time to become Ready.</Result>
    <LessonCoach task="Raise max replicas to 6 and watch the desired-copy preview." hint="At 150m usage, this example calculates six copies, but its initial maximum is three." complete={r.desired === 6} success="The new maximum allows the calculated desired count of six. It does not guarantee six Ready Pods."/>
    <p className="lab-source">Simplified simulation: only one CPU metric, identical Pods with complete metrics and requests, no tolerance, stabilization or scaling policies. Real HPA behavior also accounts for missing metrics, readiness and other metrics. This is not a live cluster. <a href="https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/">HPA documentation</a>.</p>
  </div>
}

export type AdministrationLessonId = 'kubeadm' | 'cluster-lifecycle' | 'cluster-extensions' | 'helm-kustomize' | 'operators' | 'autoscaling'
export const administrationLabs: Record<AdministrationLessonId, ComponentType> = {
  kubeadm: KubeadmLab,
  'cluster-lifecycle': ClusterLifecycleLab,
  'cluster-extensions': ClusterExtensionsLab,
  'helm-kustomize': HelmKustomizeLab,
  operators: OperatorsLab,
  autoscaling: AutoscalingLab,
}
