import { useState } from 'react'
import './TerminologyGuide.css'

type GlossaryTerm = { name: string; meaning: string; topic?: string }
type GlossaryGroup = { title: string; terms: GlossaryTerm[] }

export const glossary: GlossaryGroup[] = [
  { title: 'Cluster basics', terms: [
    { name: 'Cluster', meaning: 'A group of machines that Kubernetes uses to run applications.', topic: 'architecture' },
    { name: 'Control plane', meaning: 'The parts that manage the cluster, including the API server, scheduler, and controllers.', topic: 'architecture' },
    { name: 'Node', meaning: 'A machine in the cluster. Worker nodes provide resources for Pods.', topic: 'architecture' },
    { name: 'API server', meaning: 'The front door for Kubernetes management requests. Tools and cluster components use its API.', topic: 'api' },
    { name: 'etcd', meaning: 'The database that stores Kubernetes cluster configuration and state.', topic: 'architecture' },
    { name: 'Scheduler', meaning: 'The control-plane component that chooses a suitable node for a Pod that has not been assigned one.', topic: 'scheduling' },
    { name: 'kubelet', meaning: 'An agent on each node that works with the container runtime to run the Pods assigned to that node.', topic: 'architecture' },
    { name: 'Container runtime', meaning: 'Software on a node that starts and runs containers.', topic: 'cluster-extensions' },
    { name: 'kubectl', meaning: 'A command-line tool for sending requests to the Kubernetes API.', topic: 'getting-started' },
    { name: 'kubeconfig and context', meaning: 'A kubeconfig holds connection and identity settings. A context selects a cluster, user, and optionally a default namespace.', topic: 'getting-started' },
  ] },
  { title: 'Objects and workloads', terms: [
    { name: 'Object', meaning: 'A record in the Kubernetes API that represents something Kubernetes manages, such as a Pod or Service.', topic: 'api' },
    { name: 'Manifest', meaning: 'A file, often written in YAML, that describes the Kubernetes objects you want.', topic: 'api' },
    { name: 'Spec and status', meaning: 'Spec usually describes the desired state; status reports what Kubernetes has observed.', topic: 'api' },
    { name: 'Desired state and reconciliation', meaning: 'Desired state is what you ask for. Controllers repeatedly compare it with what they observe and work to reduce the difference.', topic: 'deployments' },
    { name: 'Controller', meaning: 'A component that watches resources and takes action to move the cluster toward the desired state.', topic: 'deployments' },
    { name: 'Namespace', meaning: 'A named area for grouping many Kubernetes objects. It does not by itself block network traffic.', topic: 'namespaces' },
    { name: 'Labels and selectors', meaning: 'Labels are key-value tags on objects. Selectors match those tags to find a group of objects.', topic: 'services' },
    { name: 'Container and image', meaning: 'An image is a package for an app. A container is a running instance of an image.', topic: 'pods' },
    { name: 'Pod', meaning: 'The smallest unit Kubernetes schedules. A Pod runs one or more containers together on a node.', topic: 'pods' },
    { name: 'Deployment', meaning: 'A workload object that manages ReplicaSets for app copies and updates.', topic: 'deployments' },
    { name: 'ReplicaSet and replica', meaning: 'A replica is an app copy. A ReplicaSet creates or removes Pods to reach its requested number of matching Pods.', topic: 'deployments' },
    { name: 'StatefulSet', meaning: 'A workload controller for Pods that need stable identities and often their own storage claims.', topic: 'statefulsets' },
    { name: 'DaemonSet', meaning: 'A workload controller that keeps a Pod on each eligible node, often for node-level services.' },
    { name: 'Job and CronJob', meaning: 'A Job runs work to completion. A CronJob creates Jobs on a schedule.' },
    { name: 'Rollout and rollback', meaning: 'A rollout is an update to a workload. A rollback restores an earlier workload configuration; it does not undo external changes.', topic: 'rollouts' },
  ] },
  { title: 'Networking and access', terms: [
    { name: 'Service', meaning: 'A stable way to find and reach a group of endpoints, often selected by Pod labels.', topic: 'services' },
    { name: 'ClusterIP', meaning: 'The default Service type. It provides a virtual IP for access inside the cluster.', topic: 'service-types' },
    { name: 'NodePort', meaning: 'A Service type that exposes a port on each node. Outside clients also need a working network path to a node.', topic: 'service-types' },
    { name: 'LoadBalancer', meaning: 'A Service type that requests an external load balancer. A compatible provider or controller must supply it.', topic: 'service-types' },
    { name: 'ExternalName', meaning: 'A Service type that maps a Service name to an external DNS name. It does not proxy traffic or select Pods.', topic: 'service-types' },
    { name: 'EndpointSlice', meaning: 'A Kubernetes object that records network endpoints for a Service, including their readiness information.', topic: 'services' },
    { name: 'DNS and CoreDNS', meaning: 'DNS translates names into addresses. CoreDNS is commonly used for DNS inside a Kubernetes cluster.', topic: 'dns' },
    { name: 'Ingress', meaning: 'Rules for routing outside HTTP or HTTPS traffic to Services. An Ingress controller must implement them.', topic: 'gateway' },
    { name: 'Gateway API', meaning: 'A set of resources for describing network entry points and routes. A compatible controller must implement them.', topic: 'gateway' },
    { name: 'NetworkPolicy', meaning: 'Rules for allowed network traffic to or from selected Pods. They need a network plugin that enforces them.', topic: 'network-policy' },
    { name: 'CNI', meaning: 'The Container Network Interface: a way for Kubernetes to use plugins that set up Pod networking.', topic: 'cluster-extensions' },
  ] },
  { title: 'Storage and configuration', terms: [
    { name: 'Volume', meaning: 'Storage made available to containers in a Pod. Its lifetime and behavior depend on its type.', topic: 'storage' },
    { name: 'PersistentVolume (PV)', meaning: 'A Kubernetes resource representing storage available to a cluster.', topic: 'storage' },
    { name: 'PersistentVolumeClaim (PVC)', meaning: 'A request for storage that can bind to a suitable PersistentVolume and be used by a Pod.', topic: 'storage' },
    { name: 'StorageClass', meaning: 'A resource describing how storage can be provided, including which provisioner and settings to use.', topic: 'provisioning' },
    { name: 'CSI', meaning: 'The Container Storage Interface: a way to connect supported storage systems to Kubernetes.', topic: 'cluster-extensions' },
    { name: 'ConfigMap', meaning: 'An object for non-secret configuration that an app can use as files or environment variables.', topic: 'configuration' },
    { name: 'Secret', meaning: 'An object for sensitive values such as credentials. Access controls and safe storage still matter.', topic: 'configuration' },
  ] },
  { title: 'Health, capacity, and security', terms: [
    { name: 'Startup probe', meaning: 'A health check that gives a container time to start before its liveness and readiness checks begin.', topic: 'probes' },
    { name: 'Readiness probe', meaning: 'A health check for whether a Pod is ready for normal Service traffic. Failure alone does not restart the container.', topic: 'probes' },
    { name: 'Liveness probe', meaning: 'A health check that can trigger a container restart after repeated failures.', topic: 'probes' },
    { name: 'Requests and limits', meaning: 'Requests help the scheduler find room for a Pod. Limits restrict container resource use in different ways for CPU and memory.', topic: 'resource-requests' },
    { name: 'ResourceQuota', meaning: 'A shared budget for selected resources in a namespace.', topic: 'resource-quota' },
    { name: 'Horizontal Pod Autoscaler (HPA)', meaning: 'A controller that adjusts a workload’s desired replica count using configured metrics and limits.', topic: 'autoscaling' },
    { name: 'Taint and toleration', meaning: 'A taint can keep Pods off a node; a matching toleration allows a Pod to be considered for that node.', topic: 'scheduling' },
    { name: 'PodDisruptionBudget (PDB)', meaning: 'A limit on certain voluntary Pod disruptions, such as supported evictions during maintenance.', topic: 'cluster-lifecycle' },
    { name: 'RBAC', meaning: 'Role-based access control: permissions that decide which Kubernetes API actions an identity may perform.', topic: 'rbac' },
    { name: 'ServiceAccount', meaning: 'A Kubernetes identity that a workload can use when accessing the API or other systems.', topic: 'rbac' },
    { name: 'Events and logs', meaning: 'Events record things Kubernetes reports about objects. Logs contain output written by a container.', topic: 'workload-troubleshooting' },
  ] },
]

export function filterGlossary(query: string): GlossaryGroup[] {
  const search = query.trim().toLowerCase()
  return glossary.map(group => ({
    ...group,
    terms: group.terms.filter(term => `${group.title} ${term.name} ${term.meaning}`.toLowerCase().includes(search)),
  })).filter(group => group.terms.length > 0)
}

export const deploymentManifest = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:1.27
          ports:
            - containerPort: 80`

export const serviceManifests = {
  ClusterIP: `apiVersion: v1
kind: Service
metadata:
  name: web-internal
spec:
  type: ClusterIP
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80`,
  NodePort: `apiVersion: v1
kind: Service
metadata:
  name: web-node
spec:
  type: NodePort
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80
      nodePort: 30080`,
  LoadBalancer: `apiVersion: v1
kind: Service
metadata:
  name: web-public
spec:
  type: LoadBalancer
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80`,
}

const serviceDescriptions = {
  ClusterIP: 'The default type. Clients inside the cluster can use the Service name or its virtual IP. Outside access needs another entry point.',
  NodePort: 'Opens a chosen port on nodes. A client needs a reachable node address and port; firewalls and networking still matter. The example uses port 30080, which must be allowed by the cluster’s configured range and not already in use.',
  LoadBalancer: 'Requests an external load balancer and its address. This only works when a compatible provider or controller is configured; it may involve provider costs.',
}

function Manifest({ title, code }: { title: string; code: string }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopyState('copied')
    } catch {
      setCopyState('error')
    }
  }
  return <section className="materials-example terminology-manifest">
    <header><div><b>{title}</b></div><button type="button" onClick={copy} aria-label={`Copy ${title}`}>{copyState === 'copied' ? 'Copied' : 'Copy'}</button></header>
    <pre><code>{code}</code></pre>
    {copyState === 'error' && <p className="copy-error" role="status">Clipboard permission was unavailable. Select the example text to copy it manually.</p>}
  </section>
}

export default function TerminologyGuide({ onTopic }: { onTopic: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [serviceType, setServiceType] = useState<keyof typeof serviceManifests>('ClusterIP')
  const matches = filterGlossary(query)
  const count = matches.reduce((total, group) => total + group.terms.length, 0)
  return <section className="terminology-guide" aria-labelledby="terminology-guide-title">
    <header><p className="terminology-kicker">PUT THE PIECES TOGETHER</p><h2 id="terminology-guide-title">From a manifest to a running app</h2><p>A manifest is a file describing what you want. Kubernetes controllers work toward that goal; the result can take time and depends on available resources.</p></header>
    <ol className="terminology-chain">
      <li><b>1. Deployment</b><span>Asks for three copies of the web app and manages ReplicaSets when the app is updated.</span></li>
      <li><b>2. ReplicaSet</b><span>Tries to keep the requested number of matching Pods. If a Pod disappears, it can create a replacement.</span></li>
      <li><b>3. Pods</b><span>Each Pod runs the web container. A new Pod is a new object and can have a different IP address.</span></li>
      <li><b>4. Service</b><span>Finds Pods with the matching label and gives clients a stable way to reach ready endpoints.</span></li>
    </ol>
    <p>A Deployment may manage more than one ReplicaSet during an update. Kubernetes creates and manages those ReplicaSets for the Deployment; you normally do not need a separate ReplicaSet manifest.</p>
    <h3>Example Deployment</h3>
    <p><code>replicas: 3</code> is the requested number of Pods, not a promise that all three will be ready. The Deployment selector must match the Pod template label <code>app: web</code>.</p>
    <Manifest title="Deployment manifest" code={deploymentManifest}/>
    <h3>Three common Service types</h3>
    <p>These are alternative ways to expose the same example app. Each selector matches <code>app: web</code> above. <code>port</code> is the Service port; <code>targetPort</code> is where the container listens.</p>
    <fieldset className="terminology-types"><legend>Choose a Service type</legend><div>{(Object.keys(serviceManifests) as (keyof typeof serviceManifests)[]).map(type => <button key={type} type="button" aria-pressed={serviceType === type} onClick={() => setServiceType(type)}>{type}</button>)}</div></fieldset>
    <div className="terminology-type-detail" aria-live="polite"><h4>{serviceType}</h4><p>{serviceDescriptions[serviceType]}</p></div>
    <Manifest key={serviceType} title={`${serviceType} Service manifest`} code={serviceManifests[serviceType]}/>
    <p>These examples are for learning and do not run on this website. Before applying them to a real cluster, check your context, permissions, networking, and provider settings. Kubernetes also has <b>ExternalName</b>, which maps a Service name to another DNS name rather than exposing selected Pods.</p>
    <h3>Search Kubernetes terms</h3>
    <p>Explore common terms below. For a full, version-specific reference, see the <a href="https://kubernetes.io/docs/reference/glossary/" target="_blank" rel="noreferrer">official Kubernetes glossary</a> (opens in a new tab).</p>
    <label className="terminology-search">Search the glossary<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try ReplicaSet, DNS, storage..."/></label>
    <p className="terminology-count" aria-live="polite">{count} {count === 1 ? 'term' : 'terms'} shown</p>
    {matches.length === 0 && <p>No terms found. Try a different word.</p>}
    {matches.map(group => <section key={group.title} className="terminology-group"><h4>{group.title}</h4><dl>{group.terms.map(term => {
      const topic = term.topic
      return <div key={term.name}><dt>{term.name}</dt><dd>{term.meaning}{topic && <> <button type="button" onClick={() => onTopic(topic)}>Explore topic <span className="sr-only">: {term.name}</span> →</button></>}</dd></div>
    })}</dl></section>)}
  </section>
}
