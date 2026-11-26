import { useState } from 'react'
import { BookOpen, Check, CircleCheck, Clipboard, Terminal } from 'lucide-react'
import './LearningMaterials.css'
import './LearningMaterialsPolish.css'

export type Material = {
  title: string
  objective: string
  concepts: { term: string; detail: string }[]
  exampleLabel: string
  example: string
  question: string
  options: string[]
  answer: number
  explanation: string
}

export const materials: Record<string, Material> = {
  architecture: {
    title: 'Control plane, node agents, and the data path',
    objective: 'Trace how Kubernetes accepts intent, reconciles it into a running workload, and routes traffic independently.',
    concepts: [
      { term: 'API server', detail: 'The authenticated, validated front door for Kubernetes API operations. Controllers, schedulers, kubelets, and kubectl use it; it is not the application packet router.' },
      { term: 'etcd', detail: 'The consistent backing store for API state. Clients interact with it through the API server rather than accessing it directly.' },
      { term: 'Controllers and scheduler', detail: 'Controllers reconcile objects toward declared intent. The scheduler selects a node for an unscheduled Pod and records a binding through the API.' },
      { term: 'Node agents and data plane', detail: 'Kubelet works with the container runtime to run Pods. CNI configures Pod networking; the Service data plane forwards traffic to eligible endpoints.' },
    ],
    exampleLabel: 'TRACE A DEPLOYMENT',
    example: 'kubectl apply -f app.yaml\nkubectl get deployment,pods -w\nkubectl describe pod <pod-name>\nkubectl get events --sort-by=.lastTimestamp',
    question: 'Which component handles a client request sent to a Service virtual IP?',
    options: ['etcd reads the Service record and proxies the packet', 'The Service data plane forwards it to an eligible endpoint', 'The API server streams the request to the container'],
    answer: 1,
    explanation: 'Service forwarding happens in the cluster data plane. The API server stores and serves configuration; etcd is its backing store. Neither carries ordinary application packets.',
  },
  pods: {
    title: 'Pod lifecycle and container boundaries',
    objective: 'Choose a Pod boundary deliberately and distinguish a restart from replacement by a controller.',
    concepts: [
      { term: 'Scheduling unit', detail: 'Kubernetes schedules a Pod onto a node. Containers in that Pod are placed together and share its network namespace and IP address.' },
      { term: 'Shared resources', detail: 'Containers may communicate over localhost and can mount the same volume. They still have separate filesystems and processes unless resources are explicitly shared.' },
      { term: 'Init containers', detail: 'Init containers run in sequence and must finish before application containers start. They are useful for database migrations, credentials, permissions, and other one-time setup.' },
      { term: 'Sidecars', detail: 'Sidecars run alongside application containers for the Pod lifecycle. Typical roles include log shipping, configuration synchronization, encryption, or auxiliary monitoring.' },
      { term: 'Ambassadors', detail: 'Ambassadors provide a localhost proxy or adapter for the application. The app can talk to a simple local endpoint while the ambassador handles remote routing, authentication, or protocol translation.' },
      { term: 'Probes', detail: 'Startup probes protect slow initialization, readiness controls whether a Pod receives Service traffic, and liveness can trigger a container restart.' },
      { term: 'Ephemeral identity', detail: 'A Pod is replaceable. A new Pod has a new identity and may receive a different IP; use a controller and Service for stable workload management and discovery.' },
    ],
    exampleLabel: 'POD WITH A SHARED VOLUME',
    example: 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: app-with-agent\nspec:\n  containers:\n    - name: app\n      image: busybox:1.36\n      command: ["sh", "-c", "while true; do date >> /var/log/app/access.log; sleep 5; done"]\n      volumeMounts:\n        - name: shared\n          mountPath: /var/log/app\n    - name: log-agent\n      image: busybox:1.36\n      command: ["sh", "-c", "tail -f /var/log/app/access.log"]\n      volumeMounts:\n        - name: shared\n          mountPath: /var/log/app\n  volumes:\n    - name: shared\n      emptyDir: {}',
    question: 'A sidecar in the same Pod needs to reach the app on its listening port. Which address should it use?',
    options: ['The app container name as a DNS hostname', 'localhost and the app container port', 'The Pod IP plus a separate Pod network namespace'],
    answer: 1,
    explanation: 'Containers in one Pod share a network namespace, so they can communicate through localhost. They must avoid binding conflicting ports.',
  },
  deployments: {
    title: 'ReplicaSets, rollouts, and reconciliation',
    objective: 'Observe how declared replica count drives recovery, then connect that behavior to a rollout workflow.',
    concepts: [
      { term: 'Desired state', detail: 'A Deployment declares a Pod template and replica target. The controller repeatedly compares desired and observed state.' },
      { term: 'ReplicaSet', detail: 'A Deployment manages ReplicaSets, which maintain the requested number of matching Pods. Deleted Pods are replaced; the deleted Pod itself is not repaired.' },
      { term: 'Rollout strategy', detail: 'Rolling updates replace old Pods gradually. Readiness and surge/unavailable settings shape how availability and rollout speed trade off.' },
      { term: 'Revision and rollback', detail: 'Deployment revisions capture template changes. Rollbacks can restore a prior template, but they do not reverse external side effects or data migrations.' },
    ],
    exampleLabel: 'INSPECT AND UNDO A ROLLOUT',
    example: 'kubectl rollout status deployment/web\nkubectl rollout history deployment/web\nkubectl rollout undo deployment/web\nkubectl get rs,pods -l app=web',
    question: 'A Pod managed by a Deployment is deleted. What should happen next?',
    options: ['The deleted Pod is repaired in place', 'The ReplicaSet creates a replacement to move toward the replica target', 'The scheduler increases the Deployment replica count'],
    answer: 1,
    explanation: 'The ReplicaSet observes too few matching Pods and creates a new Pod. The replacement is a new object with a new identity.',
  },
  services: {
    title: 'Stable discovery and endpoint eligibility',
    objective: 'Diagnose the three common reasons a Pod may not appear as a usable Service endpoint.',
    concepts: [
      { term: 'Stable virtual address', detail: 'A Service provides a stable cluster identity while backing Pods can be replaced. Clients target the Service rather than tracking Pod IPs.' },
      { term: 'Selectors and labels', detail: 'The Service selector must match Pod labels. A typo or mismatched label leaves the Service without those Pods as endpoints.' },
      { term: 'Readiness', detail: 'Matching Pods that are not Ready are normally excluded from regular Service traffic. Readiness should reflect the app being able to serve requests.' },
      { term: 'Ports', detail: 'The Service port is the client-facing port; targetPort maps to the port on the selected Pod. A healthy endpoint can still fail if the application is listening elsewhere.' },
    ],
    exampleLabel: 'SERVICE SELECTOR AND PORT MAPPING',
    example: 'apiVersion: v1\nkind: Service\nmetadata:\n  name: api\nspec:\n  selector:\n    app: api\n  ports:\n    - name: http\n      port: 80\n      targetPort: 8080',
    question: 'The Service has no endpoints, but its Pods are running. What should you check first?',
    options: ['Whether the Service selector matches Pod labels and Pods are Ready', 'Whether the Pods use hostNetwork', 'Whether the Deployment has a public LoadBalancer address'],
    answer: 0,
    explanation: 'Endpoint eligibility depends on selector matching and readiness. Start by comparing Service selectors with Pod labels and checking Pod conditions.',
  },
  traffic: {
    title: 'Ingress and Gateway request routing',
    objective: 'Separate external entry, HTTP routing, Service discovery, and the final container port.',
    concepts: [
      { term: 'DNS and load balancer', detail: 'DNS resolves a hostname. External infrastructure provides a reachable entry point; exact behavior depends on the cloud, network, and controller.' },
      { term: 'Ingress or Gateway', detail: 'These APIs express host, path, listener, and backend routing intent. A controller implements that intent; creating a routing object alone does not guarantee an implementation exists.' },
      { term: 'Service backend', detail: 'The route commonly targets a Service, which selects eligible endpoints. The Service targetPort must align with the app listener.' },
      { term: 'Troubleshooting layers', detail: 'Check DNS and reachability, controller/address and route status, backend Service endpoints, then application port and health.' },
    ],
    exampleLabel: 'TRACE THE ROUTE',
    example: 'kubectl get ingress -A\nkubectl describe ingress <name>\nkubectl get svc,endpointslices -n <namespace>\nkubectl get pods -n <namespace> -o wide',
    question: 'An Ingress rule points to a Service, but external requests fail. What is the best next check?',
    options: ['Confirm the controller has programmed the route, then inspect the Service endpoints', 'Restart etcd because it carries the HTTP request', 'Change every Pod IP in the route'],
    answer: 0,
    explanation: 'The route needs a functioning controller and a backend with eligible endpoints. Inspect status and follow the request path one layer at a time.',
  },
  topology: {
    title: 'Node and zone placement, availability, and disruption budgets',
    objective: 'Compare hostname-level and zone-level spread, then reason about failure scope, capacity, and voluntary disruption.',
    concepts: [
      { term: 'topologyKey defines the domain', detail: 'kubernetes.io/hostname spreads Pods across nodes; topology.kubernetes.io/zone spreads across zones. Nodes in one zone count as one domain only when the zone key is selected.' },
      { term: 'maxSkew and eligible domains', detail: 'maxSkew limits the count difference between eligible topology domains. Node spread can look balanced while most replicas still sit inside one zone.' },
      { term: 'Hard and soft constraints', detail: 'DoNotSchedule treats an unsatisfied spread constraint as a scheduling block. ScheduleAnyway treats it as a preference, not a guarantee.' },
      { term: 'Capacity still matters', detail: 'A healthy zone needs enough CPU, memory, quota, and eligible nodes for replacement Pods. Spread policy cannot create capacity.' },
      { term: 'PodDisruptionBudget', detail: 'A PDB limits voluntary disruptions through supported eviction paths. It does not prevent involuntary failures such as a zone outage, and it is not a replacement for replicas.' },
    ],
    exampleLabel: 'SPREAD PODS ACROSS HOSTNAMES',
    example: 'topologySpreadConstraints:\n  - maxSkew: 1\n    topologyKey: kubernetes.io/hostname\n    whenUnsatisfiable: DoNotSchedule\n    labelSelector:\n      matchLabels:\n        app: api',
    question: 'Four replicas are evenly spread across four nodes, but three nodes are in zone A. What does hostname spread guarantee?',
    options: ['At most one replica in each zone', 'Balanced counts across nodes, but not necessarily across zones', 'That every replica survives a zone-A outage'],
    answer: 1,
    explanation: 'The topology key determines what counts as a domain. Hostname spread balances node counts; it does not guarantee zone balance or survival of a zone failure. Use a zone key when zone-level distribution is required.',
  },
  'resource-quota': {
    title: 'ResourceQuota and namespace admission',
    objective: 'Predict whether a workload fits an aggregate namespace budget and identify which resource request blocks admission.',
    concepts: [
      { term: 'Namespace scope', detail: 'A ResourceQuota applies to selected resources in one namespace. It can cap aggregate CPU and memory requests, limits, object counts, and other supported resources.' },
      { term: 'Admission check', detail: 'Quota admission checks each namespaced object against applicable hard limits. An over-quota Pod is rejected, while other Pods from the same Deployment may still be admitted.' },
      { term: 'Requests and limits', detail: 'requests.cpu and requests.memory reserve scheduling resources. limits.cpu and limits.memory cap container use. They are separate quota dimensions and must be budgeted separately.' },
      { term: 'Defaults and diagnosis', detail: 'When a quota tracks requests or limits, Pods generally need those values set directly or supplied by a LimitRange default. Use kubectl describe resourcequota and inspect the rejected object’s admission error.' },
    ],
    exampleLabel: 'SET NAMESPACE REQUEST AND LIMIT BUDGETS',
    example: 'apiVersion: v1\nkind: ResourceQuota\nmetadata:\n  name: team-budget\n  namespace: team-api\nspec:\n  hard:\n    requests.cpu: "4"\n    requests.memory: 8Gi\n    limits.cpu: "8"\n    limits.memory: 16Gi',
    question: 'A namespace has 2 CPU cores of requests.cpu remaining. A Deployment requests 3 replicas at 750m each. What should you expect?',
    options: ['All three Pods are admitted because each uses less than 2 cores', 'Two Pods may be admitted; the third Pod admission is rejected until quota is available', 'The Deployment controller silently lowers each request to fit'],
    answer: 1,
    explanation: 'Quota is checked for each Pod admission. Two Pods consume 1500m of the 2000m remaining; the third would bring the total to 2250m, so that Pod is rejected while the Deployment remains below its desired replicas.',
  },
  'resource-requests': {
    title: 'Pod requests, limits, and runtime behavior',
    objective: 'Choose resource values that allow placement and understand what happens when runtime demand exceeds a limit.',
    concepts: [
      { term: 'Requests guide scheduling', detail: 'The scheduler evaluates a Pod’s resource requests against node allocatable capacity. Requests are reservations for placement decisions, not a prediction of exact usage.' },
      { term: 'CPU limits throttle', detail: 'CPU is compressible. When a container tries to exceed its CPU limit, it is throttled and receives less CPU time; it is not normally killed for CPU use alone.' },
      { term: 'Memory limits can OOM-kill', detail: 'Memory is not compressible. A container that exceeds its memory limit may be terminated by the kernel with an OOM kill and restarted according to its restart policy.' },
      { term: 'QoS and sizing', detail: 'Requests and limits also affect scheduling and QoS classification. Set them from observed workload behavior, leave headroom, and verify under representative load.' },
    ],
    exampleLabel: 'SET RESOURCES ON A POD CONTAINER',
    example: 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: api\nspec:\n  containers:\n    - name: app\n      image: nginx:1.27\n      resources:\n        requests:\n          cpu: 500m\n          memory: 512Mi\n        limits:\n          cpu: "1"\n          memory: 1Gi',
    question: 'A Pod requests 500m CPU and has a 1 CPU limit. The process wants 1.2 CPU. What is the expected effect?',
    options: ['The scheduler rejects the Pod because demand is above its request', 'The container is CPU-throttled near its limit while continuing to run', 'The container is OOM-killed because CPU demand exceeded the request'],
    answer: 1,
    explanation: 'Requests guide placement and do not cap CPU usage. CPU limits are enforced by throttling; memory limit violations have different behavior and can cause an OOM kill.',
  },
  probes: {
    title: 'Startup, readiness, and liveness probes',
    objective: 'Choose the probe that matches initialization, traffic eligibility, or process recovery—and tune it against real startup behavior.',
    concepts: [
      { term: 'Startup probe', detail: 'Runs while the container starts and protects slow initialization. Until it succeeds, kubelet does not start regular liveness or readiness checks for that container.' },
      { term: 'Readiness probe', detail: 'Determines whether the Pod should receive Service traffic. Failure makes the Pod NotReady and removes it from regular endpoints, but does not automatically restart the container.' },
      { term: 'Liveness probe', detail: 'Detects when the container process is unhealthy and cannot recover. Consecutive failures restart the container according to the Pod restart policy.' },
      { term: 'Probe mechanisms and tuning', detail: 'Probes can use HTTP, TCP, or an exec command. initialDelaySeconds, periodSeconds, timeoutSeconds, successThreshold, and failureThreshold control timing and repeated failure behavior.' },
    ],
    exampleLabel: 'CONFIGURE ALL THREE PROBE TYPES',
    example: 'containers:\n  - name: api\n    image: example/api:1.0\n    ports:\n      - containerPort: 8080\n    startupProbe:\n      httpGet:\n        path: /started\n        port: 8080\n      failureThreshold: 30\n      periodSeconds: 2\n    readinessProbe:\n      httpGet:\n        path: /ready\n        port: 8080\n      periodSeconds: 5\n    livenessProbe:\n      httpGet:\n        path: /healthz\n        port: 8080\n      initialDelaySeconds: 10\n      periodSeconds: 10',
    question: 'An application is healthy but temporarily overloaded and returns HTTP 503 on its readiness endpoint. What should Kubernetes do?',
    options: ['Restart the container immediately', 'Mark the Pod NotReady and stop sending regular Service traffic', 'Replace the Node because the readiness endpoint failed'],
    answer: 1,
    explanation: 'Readiness failure controls endpoint eligibility. It does not itself restart the container; liveness handles repeated container health failures, and startup gates initialization.',
  },
}

export default function LearningMaterials({ lessonId, passed, onPass, extraMaterial }: { lessonId: string; passed: boolean; onPass: () => void; extraMaterial?: Material }) {
  const material = extraMaterial ?? materials[lessonId]
  const [selected, setSelected] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  async function copyExample() {
    try {
      await navigator.clipboard.writeText(material.example)
      setCopied(true)
      setCopyError(false)
    } catch {
      setCopied(false)
      setCopyError(true)
    }
  }

  function answer(index: number) {
    setSelected(index)
    if (index === material.answer) onPass()
  }

  return <section className="learning-materials" aria-labelledby="materials-title">
    <header className="materials-heading"><div><p>FIELD NOTES · {lessonId.toUpperCase()}</p><h2 id="materials-title">{material.title}</h2><span>{material.objective}</span></div><BookOpen size={22}/></header>
    <div className="materials-concepts">{material.concepts.map(item => <article key={item.term}><h3>{item.term}</h3><p>{item.detail}</p></article>)}</div>
    <section className="materials-example"><header><div><Terminal size={15}/><b>{material.exampleLabel}</b></div><button onClick={copyExample} aria-label="Copy example"><Clipboard size={14}/>{copied ? 'Copied' : 'Copy'}</button></header><pre><code>{material.example}</code></pre>{copyError&&<p className="copy-error">Clipboard permission was unavailable. Select the example text to copy it manually.</p>}</section>
    <section className="materials-check"><div className="check-heading"><span>KNOWLEDGE CHECK</span>{passed&&<b><CircleCheck size={15}/> CHECK PASSED</b>}</div><h3>{material.question}</h3><div className="check-options">{material.options.map((option,index)=><button key={option} className={selected===index?index===material.answer?'answer-correct':'answer-incorrect':''} onClick={()=>answer(index)} aria-pressed={selected===index}><span>{String.fromCharCode(65+index)}</span>{option}</button>)}</div>{selected!==null&&<p aria-live="polite" className={selected===material.answer?'answer-feedback correct':'answer-feedback'}>{selected===material.answer?<Check size={16}/>:<CircleCheck size={16}/>}<span>{selected===material.answer?`That’s right. ${material.explanation}`:'Not quite. Review the notes above and try another answer.'}</span></p>}</section>
  </section>
}
