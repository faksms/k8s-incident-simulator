import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Activity, ArrowRight, Boxes, CirclePause, Database, FileCode2, Globe, KeyRound, Network, Play, RotateCcw, Server, ShieldCheck } from 'lucide-react'
import type { Material } from './LearningMaterials'
import './ExtendedLessons.css'

type Step = { title: string; detail: string }
export type ExtendedLesson = {
  id: string
  title: string
  body: string
  takeaway: string
  keywords: string
  steps: Step[]
  diagram: { nodes: [string, string, string]; links: [string, string] }
  material: Material
}

export const extendedLessons: ExtendedLesson[] = [
  {
    id: 'getting-started', title: 'Getting started with a cluster',
    body: 'Learn how a local cluster, kubeconfig, and kubectl work together before you deploy an application.',
    takeaway: 'Check the current context to make sure you are connected to the right cluster before changing it.', keywords: 'setup installation minikube kind context kubectl',
    diagram: { nodes: ['Cluster', 'Context', 'kubectl'], links: ['select target', 'inspect'] },
    steps: [
      { title: 'Choose a cluster', detail: 'Create a temporary local cluster with a tool such as kind, or use one provided by your organization. Follow its setup instructions.' },
      { title: 'Select a context', detail: 'A kubeconfig context tells kubectl which cluster and user to use, and can set a default namespace. Check it before making changes.' },
      { title: 'Inspect the cluster', detail: 'Use kubectl to inspect nodes and workloads. API requests need a working connection and the right permissions.' },
    ],
    material: {
      title: 'Your first cluster workflow', objective: 'Identify the target cluster and inspect it safely before creating resources.',
      concepts: [
        { term: 'Local or managed', detail: 'Local tools are useful for practice. With a managed cluster, a provider handles some control-plane tasks. Setup and networking needs differ.' },
        { term: 'kubeconfig', detail: 'kubectl reads connection details and credentials from kubeconfig. A context helps choose the cluster and identity to use.' },
        { term: 'Declarative workflow', detail: 'A manifest describes the objects you want. Check the target context and review the manifest before using kubectl apply.' },
      ],
      exampleLabel: 'CHECK YOUR TARGET', example: 'kubectl config current-context\nkubectl cluster-info\nkubectl get nodes\nkubectl get pods --all-namespaces',
      question: 'What should you check before applying a manifest?', options: ['The current context and intended target cluster', 'Only the local operating system version', 'Whether every Pod has a public IP'], answer: 0,
      explanation: 'The current context identifies the cluster and user kubectl will use. Confirm it before making changes.',
    },
  },
  {
    id: 'namespaces', title: 'Namespaces & isolation',
    body: 'Learn how namespaces group namespaced resources and help teams organize their work.',
    takeaway: 'Namespaces organize resources, but do not provide complete security by themselves.', keywords: 'namespace context isolation teams',
    diagram: { nodes: ['Namespace', 'Target', 'Controls'], links: ['scope', 'protect'] },
    steps: [
      { title: 'Create a boundary', detail: 'A namespace groups objects that belong to a namespace. Two namespaces can each have a Service named api.' },
      { title: 'Target a namespace', detail: 'Use -n to inspect or change namespaced resources. A context can also choose a default namespace.' },
      { title: 'Apply safeguards', detail: 'Combine RBAC, quotas, network policies, and suitable workload controls. A namespace alone does not block network traffic.' },
    ],
    material: {
      title: 'Organize workloads safely', objective: 'Distinguish naming scope from authorization and network isolation.',
      concepts: [
        { term: 'Scope', detail: 'Pods, Services, and ConfigMaps belong to a namespace. Nodes and namespaces themselves apply to the whole cluster.' },
        { term: 'Access and traffic', detail: 'Use RBAC to control API access. To limit Pod traffic, use NetworkPolicy with a network plugin that supports it.' },
        { term: 'Resource governance', detail: 'ResourceQuota and LimitRange can help manage shared resources in a namespace. They do not isolate network traffic.' },
      ],
      exampleLabel: 'INSPECT NAMESPACES', example: 'kubectl get namespaces\nkubectl get pods -n default\nkubectl api-resources --namespaced=false',
      question: 'Does creating a namespace automatically block traffic from other namespaces?', options: ['Yes, all cross-namespace traffic is blocked', 'No; use appropriate network policies and a supporting network plugin', 'Yes, but only for Services'], answer: 1,
      explanation: 'Namespaces do not automatically block network traffic. NetworkPolicy needs enforcement by the cluster network implementation.',
    },
  },
  {
    id: 'dns', title: 'Service discovery & DNS',
    body: 'Follow how an application looks up the name of a Service it wants to reach.',
    takeaway: 'A Service name stays useful for finding it, but does not mean its backends are healthy.', keywords: 'dns coredns fqdn discovery endpoints',
    diagram: { nodes: ['Client Pod', 'Cluster DNS', 'Service + endpoint'], links: ['lookup', 'resolve'] },
    steps: [
      { title: 'Ask for a name', detail: 'A Pod looks up a Service name using its DNS search domains. A short name usually means a Service in the same namespace.' },
      { title: 'Resolve the Service', detail: 'Cluster DNS returns an address for a normal Service. For a headless Service, it returns endpoint addresses instead.' },
      { title: 'Reach an endpoint', detail: 'A successful lookup does not prove that the Service has ready endpoints or that the application listens on the right port.' },
    ],
    material: {
      title: 'Names, addresses, and endpoints', objective: 'Separate DNS resolution from actual application connectivity.',
      concepts: [
        { term: 'Service names', detail: 'Services have names in the cluster DNS domain. Add the namespace to a name to find a Service in another namespace.' },
        { term: 'Headless Services', detail: 'A Service with clusterIP: None has no virtual ClusterIP. DNS can return the addresses of its individual endpoints.' },
        { term: 'Troubleshooting', detail: 'Check the Pod DNS settings, cluster DNS health, Service, EndpointSlices, and application port in that order.' },
      ],
      exampleLabel: 'INSPECT DISCOVERY', example: 'kubectl get svc -n default\nkubectl get endpointslices -n default\nkubectl get pods -n kube-system -l k8s-app=kube-dns',
      question: 'A Service name resolves but requests fail. What should you inspect next?', options: ['Service endpoints and application port', 'Only the name of the node', 'The DNS name of etcd'], answer: 0,
      explanation: 'Resolution is only one part of connectivity; endpoint readiness and port mapping also matter.',
    },
  },
  {
    id: 'storage', title: 'Persistent storage',
    body: 'Follow a workload’s storage request to a persistent volume and learn how that storage is managed.',
    takeaway: 'A claim asks for storage; whether data persists and how it can be accessed depends on the storage system and its policy.', keywords: 'volume pv pvc storageclass csi persistent',
    diagram: { nodes: ['PVC request', 'PersistentVolume', 'Pod mount'], links: ['bind', 'mount'] },
    steps: [
      { title: 'Request storage', detail: 'A PersistentVolumeClaim (PVC) asks for storage capacity and an access mode. It can also name a StorageClass.' },
      { title: 'Bind a volume', detail: 'Kubernetes connects a suitable PersistentVolume to the claim. A configured provisioner can create a volume when needed.' },
      { title: 'Mount into a Pod', detail: 'A Pod refers to the claim and mounts its storage into a container. Deleting the Pod does not also delete the claim.' },
    ],
    material: {
      title: 'Claims, volumes, and storage classes', objective: 'Explain how a Pod obtains persistent storage and what happens when it is replaced.',
      concepts: [
        { term: 'PVC and PV', detail: 'A PVC asks for storage; a PV is a storage resource. Binding connects a suitable PV to the claim.' },
        { term: 'StorageClass and CSI', detail: 'StorageClasses describe how storage can be provided. CSI drivers connect supported storage systems to Kubernetes.' },
        { term: 'Lifecycle', detail: 'The reclaim policy controls what happens to a PV after its claim is deleted. Backups and tested restores are still essential.' },
      ],
      exampleLabel: 'INSPECT STORAGE', example: 'kubectl get storageclass\nkubectl get pvc,pv\nkubectl describe pvc <claim-name>',
      question: 'What does a PVC represent?', options: ['A request for storage by a workload', 'A copy of every application backup', 'A container network interface'], answer: 0,
      explanation: 'A PVC requests storage with particular properties; it binds to a suitable PV.',
    },
  },
  {
    id: 'configuration', title: 'ConfigMaps & Secrets',
    body: 'Learn how settings and sensitive values reach an application, and what protects them.',
    takeaway: 'Base64 encoding is not encryption; protect Secrets with access controls and encryption at rest.', keywords: 'configmap secret environment variables configuration encryption',
    diagram: { nodes: ['ConfigMap', 'Secret', 'Pod'], links: ['separate values', 'consume'] },
    steps: [
      { title: 'Separate configuration', detail: 'A ConfigMap stores settings that are not confidential, separately from the container image.' },
      { title: 'Protect sensitive values', detail: 'A Secret stores sensitive data. Limit access with RBAC and configure encryption at rest.' },
      { title: 'Deliver to a Pod', detail: 'Provide values as environment variables or mounted files. Environment variables in a running container do not change when the source changes.' },
    ],
    material: {
      title: 'Configuration without rebuilding images', objective: 'Choose a delivery mechanism and recognize Secret protection requirements.',
      concepts: [
        { term: 'ConfigMap', detail: 'Use ConfigMaps for settings that are not confidential. A Pod can use their values as environment variables or mounted files.' },
        { term: 'Secret', detail: 'Secret data is base64 encoded when shown through the API. Base64 does not encrypt it. Limit access and configure encryption at rest.' },
        { term: 'Updates', detail: 'Mounted settings can update after a delay, except in cases such as subPath mounts. A container must be replaced to get changed environment variables.' },
      ],
      exampleLabel: 'INSPECT CONFIGURATION METADATA', example: 'kubectl get configmaps\nkubectl get secrets\nkubectl describe configmap <configmap-name>',
      question: 'Is base64-encoded Secret data encrypted?', options: ['Yes, base64 is encryption', 'No; encoding is not encryption', 'Only when mounted as an environment variable'], answer: 1,
      explanation: 'Base64 is an encoding. Protect Secret access and configure encryption at rest where appropriate.',
    },
  },
  {
    id: 'statefulsets', title: 'StatefulSets & identity',
    body: 'Learn how StatefulSets give each replica a steady identity and storage when an application needs to tell replicas apart.',
    takeaway: 'Stable identity helps stateful applications, but does not replace replication or backups.', keywords: 'statefulset ordinal headless service volume claim database',
    diagram: { nodes: ['StatefulSet', 'Headless Service', 'Pod + PVC'], links: ['discovery', 'identity & data'] },
    steps: [
      { title: 'Assign identities', detail: 'A StatefulSet gives each Pod a steady numbered name, such as database-0 or database-1.' },
      { title: 'Discover peers', detail: 'When set up correctly, a governing headless Service gives StatefulSet Pods steady network identities.' },
      { title: 'Retain data', detail: 'volumeClaimTemplates can create a PVC for each Pod. Before scaling or deleting, check the StatefulSet PVC retention and PV reclaim policies.' },
    ],
    material: {
      title: 'Stable identity and per-replica storage', objective: 'Explain why a stateful application may need stable names and distinct claims.',
      concepts: [
        { term: 'Ordinal identity', detail: 'StatefulSet Pods have steady numbered names. A replacement Pod reuses its name instead of getting a random Deployment-style name.' },
        { term: 'Network identity', detail: 'A governing headless Service provides the DNS domain used to identify each Pod.' },
        { term: 'Data lifecycle', detail: 'A Pod’s claim can remain after the Pod is gone. PVC retention and PV reclaim policies control later cleanup; keep separate backups.' },
      ],
      exampleLabel: 'INSPECT STATEFUL WORKLOADS', example: 'kubectl get statefulsets\nkubectl get pods,pvc\nkubectl describe statefulset <name>',
      question: 'What distinguishes StatefulSet replicas from interchangeable Deployment Pods?', options: ['Stable ordinal identity and support for per-Pod claims', 'Automatic database backups', 'Guaranteed survival of every storage failure'], answer: 0,
      explanation: 'StatefulSets offer stable identities and can create individual claims, but applications still need their own resilience and backups.',
    },
  },
  {
    id: 'api', title: 'The Kubernetes API',
    body: 'Follow a request to the API server and see how controllers respond to changes.',
    takeaway: 'The API stores desired state; controllers reconcile it asynchronously.', keywords: 'api server manifest spec status admission custom resource crd',
    diagram: { nodes: ['kubectl', 'API server', 'Controller'], links: ['request', 'reconcile'] },
    steps: [
      { title: 'Send a request', detail: 'kubectl sends a request with your identity to the API server for a resource in a namespace.' },
      { title: 'Authorize and admit', detail: 'The API server checks whether the request is allowed and runs relevant admission checks before accepting a change.' },
      { title: 'Reconcile and observe', detail: 'Controllers work toward the accepted state over time. Check status and events; an accepted change does not mean the workload is ready.' },
    ],
    material: {
      title: 'Objects and API operations', objective: 'Distinguish accepted configuration from observed workload state.',
      concepts: [
        { term: 'Objects', detail: 'API objects have metadata and usually a spec describing what you want and a status describing what is happening.' },
        { term: 'Admission', detail: 'After checking identity and permission, admission controllers can check a request or change it before it is accepted.' },
        { term: 'Extensibility', detail: 'CustomResourceDefinitions (CRDs) add resource types. Separate controllers can act on those resources.' },
      ],
      exampleLabel: 'EXPLORE THE API', example: 'kubectl api-resources\nkubectl explain deployment.spec\nkubectl get deployment <name> -o yaml',
      question: 'Does a successful API write mean all Pods are already Ready?', options: ['Yes, the API server waits for every Pod', 'No, controllers reconcile asynchronously and status must be checked', 'Yes, unless DNS is disabled'], answer: 1,
      explanation: 'The API accepting desired state is distinct from controllers bringing the workload to readiness.',
    },
  },
  {
    id: 'rbac', title: 'API access & RBAC',
    body: 'Follow how the API checks who made a request and whether they have permission, using least privilege.',
    takeaway: 'Give an identity only the actions and resources it needs, within the narrowest useful scope.', keywords: 'authentication authorization role rolebinding serviceaccount permissions rbac',
    diagram: { nodes: ['Identity', 'Authorization', 'RoleBinding'], links: ['authenticate', 'grant scope'] },
    steps: [
      { title: 'Authenticate', detail: 'The API server identifies who is making the request, such as a person or a workload ServiceAccount.' },
      { title: 'Authorize', detail: 'An authorization system such as RBAC checks whether that identity can perform the requested action on the resource.' },
      { title: 'Bind permissions', detail: 'A RoleBinding grants the listed permissions in its namespace. A ClusterRoleBinding grants them across the cluster.' },
    ],
    material: {
      title: 'Least privilege for API requests', objective: 'Connect an identity, permissions, and a binding to the scope of access.',
      concepts: [
        { term: 'Authentication and authorization', detail: 'Authentication checks who you are. Authorization decides whether you may perform an action.' },
        { term: 'Roles and bindings', detail: 'Roles list permission rules. RoleBindings grant permissions in a namespace, even when they refer to a ClusterRole.' },
        { term: 'ServiceAccounts', detail: 'Workloads can use ServiceAccounts as their identities. Avoid broad permissions, and turn off automatic token mounting when a workload does not need API access.' },
      ],
      exampleLabel: 'CHECK ACCESS', example: 'kubectl auth can-i get pods -n default\nkubectl get roles,rolebindings -n default\nkubectl get serviceaccounts -n default',
      question: 'What does a RoleBinding to a ClusterRole grant?', options: ['Permissions within the RoleBinding namespace', 'Unrestricted access across the whole cluster', 'Network access to every Pod'], answer: 0,
      explanation: 'A RoleBinding scopes the referenced permissions to its namespace, even when it references a ClusterRole.',
    },
  },
  {
    id: 'security', title: 'Threat modeling & production security',
    body: 'Identify what needs protection, consider possible threats, and choose several layers of controls for a workload.',
    takeaway: 'Protect Kubernetes at several layers: identities, workloads, networking, software supply chain, and operations.', keywords: 'security threats pod security admission policy network supply chain hardening',
    diagram: { nodes: ['Assets', 'Threats', 'Defenses'], links: ['assess', 'mitigate'] },
    steps: [
      { title: 'Identify assets', detail: 'List sensitive data, workload identities, images, and control-plane access. Mark where trust changes and where someone could enter.' },
      { title: 'Consider threats', detail: 'Think about what could happen if a container is compromised, credentials are exposed, an image is vulnerable, or API permissions are too broad.' },
      { title: 'Layer defenses', detail: 'Use least privilege, restricted Pod Security Standards, network controls, patched images, audit logs, and tested recovery steps.' },
    ],
    material: {
      title: 'Build a layered defense', objective: 'Choose controls that reduce exposure and limit the impact of a compromised workload.',
      concepts: [
        { term: 'Threat modeling', detail: 'List important assets, trust boundaries, possible threats, and ways to reduce risk. Review the model when the system changes.' },
        { term: 'Workload hardening', detail: 'Use Pod Security Standards and Pod Security Admission where they fit. Run as non-root, remove unneeded capabilities, and avoid privileged containers.' },
        { term: 'Defense in depth', detail: 'Combine limited identities, enforced network policies, checked and updated images, audit logs, and backup and recovery. No one control stops every threat.' },
        { term: 'Current guidance', detail: 'PodSecurityPolicy was removed in Kubernetes 1.25. Use supported options such as Pod Security Admission or a suitable policy engine.' },
      ],
      exampleLabel: 'INSPECT SECURITY POSTURE', example: 'kubectl get namespace --show-labels\nkubectl auth can-i list secrets -n default\nkubectl get networkpolicy -A',
      question: 'Which statement describes base Kubernetes namespace isolation?', options: ['Namespaces alone secure workloads against all threats', 'Namespaces need complementary access, workload, and network controls', 'PodSecurityPolicy is available in all current clusters'], answer: 1,
      explanation: 'Namespaces are an organizational scope, not a complete security boundary. Layer controls appropriate to the cluster.',
    },
  },
  {
    id: 'terminology', title: 'Kubernetes terminology',
    body: 'Learn the words used in Kubernetes and see how a Deployment, ReplicaSet, Pods, and a Service work together.',
    takeaway: 'A Deployment manages ReplicaSets; a ReplicaSet manages Pods. A Service helps clients reach the app.', keywords: 'glossary terminology vocabulary definitions objects replicaset service types clusterip nodeport loadbalancer',
    diagram: { nodes: ['Manifest', 'Workload', 'Service + PVC'], links: ['declare', 'connect'] },
    steps: [
      { title: 'Declare intent', detail: 'A manifest describes Kubernetes API objects. The spec says what you want; status says what is happening.' },
      { title: 'Run workloads', detail: 'A Deployment manages ReplicaSets. Each ReplicaSet works toward its requested number of Pods, and each Pod runs one or more containers.' },
      { title: 'Connect and persist', detail: 'Services help workloads find and reach each other. Persistent volume claims ask for storage.' },
    ],
    material: {
      title: 'A practical vocabulary', objective: 'Recognize core Kubernetes terms and where they fit in the system.',
      concepts: [
        { term: 'Cluster and node', detail: 'A cluster has a control plane and worker nodes. Pods run on the resources that nodes provide.' },
        { term: 'Object and manifest', detail: 'An object is a record in the Kubernetes API. A manifest describes the object you want, often in YAML.' },
        { term: 'Controller and reconciliation', detail: 'A controller checks the current state and takes action to move it toward the state you want.' },
        { term: 'Deployment → ReplicaSet → Pod', detail: 'A Deployment manages ReplicaSets for app copies and updates. A ReplicaSet creates or removes Pods to reach its requested count. Each Pod runs one or more containers.' },
        { term: 'Service', detail: 'A Service gives clients a steady way to reach an app. Its selector can match Pod labels, and it normally sends traffic to ready endpoints.' },
        { term: 'Namespace and context', detail: 'A namespace groups namespaced resources. A kubeconfig context selects a cluster and user, and can set a default namespace.' },
      ],
      exampleLabel: 'DISCOVER RESOURCE TYPES', example: 'kubectl api-resources\nkubectl explain pod\nkubectl explain service.spec',
      question: 'Which term describes a controller repeatedly working toward desired state?', options: ['Reconciliation', 'DNS resolution', 'Base64 encoding'], answer: 0,
      explanation: 'Reconciliation compares observed state with desired state and takes actions to reduce the difference.',
    },
  },
]

export function ExtendedLessonScene({ lesson }: { lesson: ExtendedLesson }) {
  const [step, setStep] = useState(0)
  const reducedMotion = useReducedMotion()
  const [playing, setPlaying] = useState(() => !reducedMotion)
  useEffect(() => {
    if (reducedMotion) setPlaying(false)
  }, [reducedMotion])
  useEffect(() => {
    if (!playing || reducedMotion) return
    const timer = window.setTimeout(() => setStep(current => (current + 1) % lesson.steps.length), 8000)
    return () => window.clearTimeout(timer)
  }, [playing, reducedMotion, step, lesson.steps.length])
  function selectStep(index: number) {
    setPlaying(false)
    setStep(index)
  }
  const diagramIcons: Record<string, [typeof Server, typeof Server, typeof Server]> = {
    'getting-started': [Server, FileCode2, Activity],
    namespaces: [Boxes, FileCode2, ShieldCheck],
    dns: [Boxes, Globe, Network],
    storage: [FileCode2, Database, Boxes],
    configuration: [FileCode2, KeyRound, Boxes],
    statefulsets: [Server, Network, Database],
    api: [FileCode2, Server, Activity],
    rbac: [KeyRound, ShieldCheck, FileCode2],
    security: [Database, Activity, ShieldCheck],
    terminology: [FileCode2, Boxes, Network],
    kubeadm: [Server, Activity, Network],
    'cluster-lifecycle': [Server, Activity, ShieldCheck],
    'cluster-extensions': [Network, Server, Database],
    'helm-kustomize': [FileCode2, Boxes, Activity],
    operators: [FileCode2, Activity, Boxes],
    scheduling: [FileCode2, Activity, Server],
    autoscaling: [Activity, Server, Boxes],
    rollouts: [FileCode2, Boxes, Activity],
    'service-types': [Globe, Network, Boxes],
    'network-policy': [ShieldCheck, Network, Boxes],
    gateway: [Globe, Network, Boxes],
    provisioning: [FileCode2, Database, Boxes],
    'cluster-troubleshooting': [Server, Activity, ShieldCheck],
    'workload-troubleshooting': [Boxes, Activity, FileCode2],
  }
  const icons = diagramIcons[lesson.id]
  return <div className="explore-scene">
    <div className="explore-heading"><span>INTERACTIVE CONCEPT MAP</span><span>{step + 1} / {lesson.steps.length}</span></div>
    <h2>Explore the flow</h2>
    <p>Follow the highlighted component and the explanation below. Moving signals illustrate connections, not live cluster traffic. Select a component to pause and inspect it.</p>
    <div className={`explore-diagram ${playing && !reducedMotion ? 'diagram-playing' : ''}`} aria-label={`${lesson.title} concept map`}>
      {lesson.diagram.nodes.map((node, index) => {
        const Icon = icons[index]
        return <div className="explore-diagram-part" key={node}>
          <button className={`explore-node ${step === index ? 'explore-node-active' : ''}`} onClick={() => selectStep(index)} aria-pressed={step === index}>
            <span className="explore-node-icon"><Icon size={21}/></span><b>{node}</b><small>0{index + 1} · INSPECT</small>
          </button>
          {index < lesson.diagram.links.length && <div className="explore-link" aria-hidden="true"><span className="explore-link-line"><i/><i/></span><small>{lesson.diagram.links[index]}</small></div>}
        </div>
      })}
    </div>
    <div className="explore-diagram-toolbar"><span><i/> {playing && !reducedMotion ? 'WALKTHROUGH PLAYING' : 'WALKTHROUGH PAUSED'}</span><button type="button" onClick={() => setPlaying(value => !value)} disabled={Boolean(reducedMotion)}>{playing && !reducedMotion ? <CirclePause size={15}/> : <Play size={15}/>} {playing && !reducedMotion ? 'Pause walkthrough' : reducedMotion ? 'Reduced motion enabled' : 'Play walkthrough'}</button></div>
    <motion.div key={step} className="explore-detail" initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} aria-live={playing ? 'off' : 'polite'}>
      <small>HIGHLIGHTED: {lesson.diagram.nodes[step]} · STEP {step + 1}</small><h3>{lesson.steps[step].title}</h3><p>{lesson.steps[step].detail}</p>
    </motion.div>
    <div className="explore-steps" aria-label="Walkthrough steps">
      {lesson.steps.map((item, index) => <button key={item.title} className={index === step ? 'active' : ''} onClick={() => selectStep(index)} aria-pressed={index === step}><span>{String(index + 1).padStart(2, '0')}</span><b>{item.title}</b><ArrowRight size={16}/></button>)}
    </div>
    <div className="explore-actions"><button onClick={() => selectStep(0)}><RotateCcw size={15}/> Start over</button><button onClick={() => selectStep((step + 1) % lesson.steps.length)}>{step === lesson.steps.length - 1 ? 'Replay flow' : 'Next step'} <ArrowRight size={15}/></button></div>
  </div>
}
