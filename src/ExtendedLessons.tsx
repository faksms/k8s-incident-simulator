import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, RotateCcw } from 'lucide-react'
import type { Material } from './LearningMaterials'
import './ExtendedLessons.css'

type Step = { title: string; detail: string }
type ExtendedLesson = {
  id: string
  title: string
  body: string
  takeaway: string
  keywords: string
  steps: Step[]
  material: Material
}

export const extendedLessons: ExtendedLesson[] = [
  {
    id: 'getting-started', title: 'Getting started with a cluster',
    body: 'Learn how a local cluster, kubeconfig, and kubectl work together before deploying a workload.',
    takeaway: 'Always verify the current context before changing a cluster.', keywords: 'setup installation minikube kind context kubectl',
    steps: [
      { title: 'Choose a cluster', detail: 'Create a disposable local cluster with a tool such as kind, or use a cluster provided by your organization. Follow that provider’s setup instructions.' },
      { title: 'Select a context', detail: 'A kubeconfig context selects a cluster, user, and optionally a namespace. Check the current context before making changes.' },
      { title: 'Inspect the cluster', detail: 'Use kubectl to inspect nodes and workloads. A working connection and appropriate permissions are needed for API requests.' },
    ],
    material: {
      title: 'Your first cluster workflow', objective: 'Identify the target cluster and inspect it safely before creating resources.',
      concepts: [
        { term: 'Local or managed', detail: 'Local tools are useful for practice; managed clusters delegate some control-plane operations to a provider. Their installation and networking requirements differ.' },
        { term: 'kubeconfig', detail: 'kubectl reads cluster connection information and credentials from kubeconfig. Contexts help select the intended cluster and identity.' },
        { term: 'Declarative workflow', detail: 'A manifest describes desired objects. Inspect the target context and review manifests before using kubectl apply.' },
      ],
      exampleLabel: 'CHECK YOUR TARGET', example: 'kubectl config current-context\nkubectl cluster-info\nkubectl get nodes\nkubectl get pods --all-namespaces',
      question: 'What should you check before applying a manifest?', options: ['The current context and intended target cluster', 'Only the local operating system version', 'Whether every Pod has a public IP'], answer: 0,
      explanation: 'The current context identifies the cluster and user kubectl will use. Confirm it before making changes.',
    },
  },
  {
    id: 'namespaces', title: 'Namespaces & isolation',
    body: 'Explore how namespaces organize namespaced resources and support team boundaries.',
    takeaway: 'Namespaces organize resources; they are not a complete security boundary.', keywords: 'namespace context isolation teams',
    steps: [
      { title: 'Create a boundary', detail: 'A namespace groups namespaced objects. Different namespaces can each contain a Service named api.' },
      { title: 'Target a namespace', detail: 'Specify -n when inspecting or changing namespaced resources. A context can also set a default namespace.' },
      { title: 'Apply safeguards', detail: 'Use RBAC, quotas, network policies, and appropriate workload controls together. A namespace alone does not isolate network traffic.' },
    ],
    material: {
      title: 'Organize workloads safely', objective: 'Distinguish naming scope from authorization and network isolation.',
      concepts: [
        { term: 'Scope', detail: 'Pods, Services, and ConfigMaps are namespaced. Nodes and namespaces themselves are cluster-scoped.' },
        { term: 'Access and traffic', detail: 'Use RBAC to control API access and NetworkPolicy with a supporting network plugin to restrict Pod traffic.' },
        { term: 'Resource governance', detail: 'ResourceQuota and LimitRange can help manage shared namespace resources; they do not enforce network isolation.' },
      ],
      exampleLabel: 'INSPECT NAMESPACES', example: 'kubectl get namespaces\nkubectl get pods -n default\nkubectl api-resources --namespaced=false',
      question: 'Does creating a namespace automatically block traffic from other namespaces?', options: ['Yes, all cross-namespace traffic is blocked', 'No; use appropriate network policies and a supporting network plugin', 'Yes, but only for Services'], answer: 1,
      explanation: 'Namespaces do not automatically block network traffic. NetworkPolicy needs enforcement by the cluster network implementation.',
    },
  },
  {
    id: 'dns', title: 'Service discovery & DNS',
    body: 'Follow a name lookup from an application to the Service it wants to reach.',
    takeaway: 'A Service name gives clients a stable discovery mechanism, not a guarantee of healthy backends.', keywords: 'dns coredns fqdn discovery endpoints',
    steps: [
      { title: 'Ask for a name', detail: 'A Pod resolves a Service name using its configured DNS search domains. A short name normally refers to a Service in the same namespace.' },
      { title: 'Resolve the Service', detail: 'Cluster DNS returns a Service address for a normal Service. A headless Service instead resolves to endpoint addresses.' },
      { title: 'Reach an endpoint', detail: 'A successful lookup does not prove that the Service has ready endpoints or that the application is listening on the right port.' },
    ],
    material: {
      title: 'Names, addresses, and endpoints', objective: 'Separate DNS resolution from actual application connectivity.',
      concepts: [
        { term: 'Service names', detail: 'Services have names under the cluster DNS domain. Namespace-qualified names can address a Service in another namespace.' },
        { term: 'Headless Services', detail: 'A Service with clusterIP: None does not have a virtual ClusterIP; DNS can return individual endpoint addresses.' },
        { term: 'Troubleshooting', detail: 'Check the Pod DNS configuration, cluster DNS health, Service, EndpointSlices, and application port in order.' },
      ],
      exampleLabel: 'INSPECT DISCOVERY', example: 'kubectl get svc -n default\nkubectl get endpointslices -n default\nkubectl get pods -n kube-system -l k8s-app=kube-dns',
      question: 'A Service name resolves but requests fail. What should you inspect next?', options: ['Service endpoints and application port', 'Only the name of the node', 'The DNS name of etcd'], answer: 0,
      explanation: 'Resolution is only one part of connectivity; endpoint readiness and port mapping also matter.',
    },
  },
  {
    id: 'storage', title: 'Persistent storage',
    body: 'Trace a storage request from a workload to a persistent volume and understand its lifecycle.',
    takeaway: 'A claim requests storage; actual persistence and access depend on the storage implementation and policy.', keywords: 'volume pv pvc storageclass csi persistent',
    steps: [
      { title: 'Request storage', detail: 'A PersistentVolumeClaim (PVC) requests capacity and an access mode, optionally using a StorageClass.' },
      { title: 'Bind a volume', detail: 'A suitable PersistentVolume is bound to the claim. A provisioner can dynamically create one when configured.' },
      { title: 'Mount into a Pod', detail: 'A Pod references the claim and mounts it into a container. Deleting a Pod does not by itself delete the claim.' },
    ],
    material: {
      title: 'Claims, volumes, and storage classes', objective: 'Explain how a Pod obtains persistent storage and what happens when it is replaced.',
      concepts: [
        { term: 'PVC and PV', detail: 'A PVC is a request for storage; a PV represents a provisioned storage resource. Binding associates a compatible volume with the claim.' },
        { term: 'StorageClass and CSI', detail: 'StorageClasses describe provisioning options. CSI drivers integrate supported storage systems with Kubernetes.' },
        { term: 'Lifecycle', detail: 'Reclaim policy affects what happens to a PV after its claim is deleted. Backups and tested restores are still essential.' },
      ],
      exampleLabel: 'INSPECT STORAGE', example: 'kubectl get storageclass\nkubectl get pvc,pv\nkubectl describe pvc <claim-name>',
      question: 'What does a PVC represent?', options: ['A request for storage by a workload', 'A copy of every application backup', 'A container network interface'], answer: 0,
      explanation: 'A PVC requests storage with particular properties; it binds to a suitable PV.',
    },
  },
  {
    id: 'configuration', title: 'ConfigMaps & Secrets',
    body: 'See how configuration and sensitive values reach a workload, and where the security boundaries are.',
    takeaway: 'Base64 encoding is not encryption; protect Secrets with access controls and encryption at rest.', keywords: 'configmap secret environment variables configuration encryption',
    steps: [
      { title: 'Separate configuration', detail: 'A ConfigMap holds non-confidential configuration separately from the container image.' },
      { title: 'Protect sensitive values', detail: 'A Secret holds sensitive data, but access must be restricted with RBAC and encryption at rest should be configured.' },
      { title: 'Deliver to a Pod', detail: 'Expose values as environment variables or mounted files. Environment variables do not update in an already running container when the source changes.' },
    ],
    material: {
      title: 'Configuration without rebuilding images', objective: 'Choose a delivery mechanism and recognize Secret protection requirements.',
      concepts: [
        { term: 'ConfigMap', detail: 'Use ConfigMaps for non-confidential settings. A Pod can consume keys as environment variables or mounted files.' },
        { term: 'Secret', detail: 'Secret data is base64 encoded in API representations, not automatically encrypted by that encoding. Limit access and configure encryption at rest.' },
        { term: 'Updates', detail: 'Mounted configuration can update eventually, with exceptions such as subPath mounts. Environment variables require a new container to see changed values.' },
      ],
      exampleLabel: 'INSPECT CONFIGURATION METADATA', example: 'kubectl get configmaps\nkubectl get secrets\nkubectl describe configmap <configmap-name>',
      question: 'Is base64-encoded Secret data encrypted?', options: ['Yes, base64 is encryption', 'No; encoding is not encryption', 'Only when mounted as an environment variable'], answer: 1,
      explanation: 'Base64 is an encoding. Protect Secret access and configure encryption at rest where appropriate.',
    },
  },
  {
    id: 'statefulsets', title: 'StatefulSets & identity',
    body: 'Explore stable workload identity and storage for applications that need to distinguish their replicas.',
    takeaway: 'Stable identity helps stateful workloads; it does not replace replication or backups.', keywords: 'statefulset ordinal headless service volume claim database',
    steps: [
      { title: 'Assign identities', detail: 'A StatefulSet gives Pods stable ordinal names such as database-0 and database-1.' },
      { title: 'Discover peers', detail: 'A governing headless Service enables stable network identities for StatefulSet Pods when configured correctly.' },
      { title: 'Retain data', detail: 'volumeClaimTemplates can create a PVC per Pod. Check the StatefulSet PVC retention and PV reclaim policies before scaling or deleting.' },
    ],
    material: {
      title: 'Stable identity and per-replica storage', objective: 'Explain why a stateful application may need stable names and distinct claims.',
      concepts: [
        { term: 'Ordinal identity', detail: 'StatefulSet Pods have stable ordinal names. Replacement Pods reuse the identity rather than receiving an arbitrary Deployment-style name.' },
        { term: 'Network identity', detail: 'A governing headless Service provides the DNS domain for individual Pod identities.' },
        { term: 'Data lifecycle', detail: 'Per-Pod claims can persist beyond a Pod. PVC retention and PV reclaim policies determine later cleanup behavior; maintain backups separately.' },
      ],
      exampleLabel: 'INSPECT STATEFUL WORKLOADS', example: 'kubectl get statefulsets\nkubectl get pods,pvc\nkubectl describe statefulset <name>',
      question: 'What distinguishes StatefulSet replicas from interchangeable Deployment Pods?', options: ['Stable ordinal identity and support for per-Pod claims', 'Automatic database backups', 'Guaranteed survival of every storage failure'], answer: 0,
      explanation: 'StatefulSets offer stable identities and can create individual claims, but applications still need their own resilience and backups.',
    },
  },
  {
    id: 'api', title: 'The Kubernetes API',
    body: 'Trace how a request reaches the API server and how controllers respond to changes.',
    takeaway: 'The API stores desired state; controllers reconcile it asynchronously.', keywords: 'api server manifest spec status admission custom resource crd',
    steps: [
      { title: 'Send a request', detail: 'kubectl sends an authenticated request to the API server for a resource and namespace.' },
      { title: 'Authorize and admit', detail: 'The API server authorizes the request and applies relevant admission checks before accepting a write.' },
      { title: 'Reconcile and observe', detail: 'Controllers react to accepted state over time. Inspect status and events rather than assuming a successful write means the workload is ready.' },
    ],
    material: {
      title: 'Objects and API operations', objective: 'Distinguish accepted configuration from observed workload state.',
      concepts: [
        { term: 'Objects', detail: 'API objects have metadata and usually a spec describing intent and status reporting observed state.' },
        { term: 'Admission', detail: 'Admission controllers can validate or mutate requests after authentication and authorization.' },
        { term: 'Extensibility', detail: 'CustomResourceDefinitions add resource types; separate controllers can reconcile those resources.' },
      ],
      exampleLabel: 'EXPLORE THE API', example: 'kubectl api-resources\nkubectl explain deployment.spec\nkubectl get deployment <name> -o yaml',
      question: 'Does a successful API write mean all Pods are already Ready?', options: ['Yes, the API server waits for every Pod', 'No, controllers reconcile asynchronously and status must be checked', 'Yes, unless DNS is disabled'], answer: 1,
      explanation: 'The API accepting desired state is distinct from controllers bringing the workload to readiness.',
    },
  },
  {
    id: 'rbac', title: 'API access & RBAC',
    body: 'Follow an API request through identity and authorization using least-privilege permissions.',
    takeaway: 'Grant only the verbs and resources an identity needs, at the narrowest practical scope.', keywords: 'authentication authorization role rolebinding serviceaccount permissions rbac',
    steps: [
      { title: 'Authenticate', detail: 'The API server identifies the caller, such as a human user or a workload ServiceAccount.' },
      { title: 'Authorize', detail: 'An authorization mechanism such as RBAC evaluates whether that identity can perform the requested verb on the resource.' },
      { title: 'Bind permissions', detail: 'A RoleBinding grants the referenced permissions in its namespace; ClusterRoleBindings grant cluster-wide scope.' },
    ],
    material: {
      title: 'Least privilege for API requests', objective: 'Connect an identity, permissions, and a binding to the scope of access.',
      concepts: [
        { term: 'Authentication and authorization', detail: 'Authentication establishes identity; authorization decides whether a requested action is allowed.' },
        { term: 'Roles and bindings', detail: 'Roles define rules. RoleBindings grant permissions within a namespace, including when referencing a ClusterRole.' },
        { term: 'ServiceAccounts', detail: 'Workloads can use ServiceAccounts as identities. Avoid broad permissions and disable automatic token mounting where the workload does not need API access.' },
      ],
      exampleLabel: 'CHECK ACCESS', example: 'kubectl auth can-i get pods -n default\nkubectl get roles,rolebindings -n default\nkubectl get serviceaccounts -n default',
      question: 'What does a RoleBinding to a ClusterRole grant?', options: ['Permissions within the RoleBinding namespace', 'Unrestricted access across the whole cluster', 'Network access to every Pod'], answer: 0,
      explanation: 'A RoleBinding scopes the referenced permissions to its namespace, even when it references a ClusterRole.',
    },
  },
  {
    id: 'security', title: 'Threat modeling & production security',
    body: 'Walk through assets, threats, and layered controls for a Kubernetes workload.',
    takeaway: 'Security is layered across identities, workloads, networking, supply chain, and operations.', keywords: 'security threats pod security admission policy network supply chain hardening',
    steps: [
      { title: 'Identify assets', detail: 'List sensitive data, workload identities, images, and control-plane access. Identify trust boundaries and entry points.' },
      { title: 'Consider threats', detail: 'Consider a compromised container, exposed credentials, vulnerable image, or overly broad API permissions and their potential impact.' },
      { title: 'Layer defenses', detail: 'Use least privilege, restricted Pod Security Standards, network controls, patched images, audit logging, and tested recovery procedures.' },
    ],
    material: {
      title: 'Build a layered defense', objective: 'Choose controls that reduce exposure and limit the impact of a compromised workload.',
      concepts: [
        { term: 'Threat modeling', detail: 'Identify assets, trust boundaries, plausible threats, and mitigations; revisit the model as the system changes.' },
        { term: 'Workload hardening', detail: 'Use the Pod Security Standards and Pod Security Admission where appropriate; run as non-root, drop unnecessary capabilities, and avoid privileged containers.' },
        { term: 'Defense in depth', detail: 'Combine scoped identities, network policy enforcement, image provenance and updates, audit logging, and backup and recovery. No single control covers every threat.' },
        { term: 'Current guidance', detail: 'PodSecurityPolicy was removed in Kubernetes 1.25. Use supported alternatives such as Pod Security Admission or an appropriate policy engine.' },
      ],
      exampleLabel: 'INSPECT SECURITY POSTURE', example: 'kubectl get namespace --show-labels\nkubectl auth can-i list secrets -n default\nkubectl get networkpolicy -A',
      question: 'Which statement describes base Kubernetes namespace isolation?', options: ['Namespaces alone secure workloads against all threats', 'Namespaces need complementary access, workload, and network controls', 'PodSecurityPolicy is available in all current clusters'], answer: 1,
      explanation: 'Namespaces are an organizational scope, not a complete security boundary. Layer controls appropriate to the cluster.',
    },
  },
  {
    id: 'terminology', title: 'Kubernetes terminology',
    body: 'Build a mental map of the vocabulary you will encounter across the learning path.',
    takeaway: 'Think in terms of desired state, controllers, workloads, and networking.', keywords: 'glossary terminology vocabulary definitions objects',
    steps: [
      { title: 'Declare intent', detail: 'A manifest describes Kubernetes API objects. The spec expresses desired configuration, while status reports observed state.' },
      { title: 'Run workloads', detail: 'A Pod groups containers; controllers such as Deployments and StatefulSets manage Pods to meet workload goals.' },
      { title: 'Connect and persist', detail: 'Services provide discovery and connectivity, while persistent volume claims request storage for workloads.' },
    ],
    material: {
      title: 'A practical vocabulary', objective: 'Recognize core Kubernetes terms and where they fit in the system.',
      concepts: [
        { term: 'Cluster and node', detail: 'A cluster contains a control plane and worker nodes. Nodes provide resources on which Pods run.' },
        { term: 'Object and manifest', detail: 'An object is a record in the Kubernetes API. A manifest is a representation of desired object configuration, commonly written in YAML.' },
        { term: 'Controller and reconciliation', detail: 'A controller observes state and takes actions to move it toward the desired state.' },
        { term: 'Pod, Deployment, Service', detail: 'A Pod runs containers; a Deployment manages replicated stateless workloads; a Service provides a stable way to reach selected endpoints.' },
        { term: 'Namespace and context', detail: 'A namespace scopes namespaced resources. A kubeconfig context selects a cluster, user, and optionally a default namespace.' },
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
  return <div className="explore-scene">
    <div className="explore-heading"><span>INTERACTIVE WALKTHROUGH</span><span>{step + 1} / {lesson.steps.length}</span></div>
    <h2>Explore the flow</h2>
    <p>Choose a step to see how the pieces fit together.</p>
    <div className="explore-steps" aria-label="Walkthrough steps">
      {lesson.steps.map((item, index) => <button key={item.title} className={index === step ? 'active' : ''} onClick={() => setStep(index)} aria-pressed={index === step}><span>{String(index + 1).padStart(2, '0')}</span><b>{item.title}</b><ArrowRight size={16}/></button>)}
    </div>
    <motion.div key={step} className="explore-detail" initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} aria-live="polite">
      <small>STEP {step + 1} · {lesson.title}</small><h3>{lesson.steps[step].title}</h3><p>{lesson.steps[step].detail}</p>
    </motion.div>
    <div className="explore-actions"><button onClick={() => setStep(0)}><RotateCcw size={15}/> Start over</button><button onClick={() => setStep((step + 1) % lesson.steps.length)}>{step === lesson.steps.length - 1 ? 'Replay flow' : 'Next step'} <ArrowRight size={15}/></button></div>
  </div>
}
