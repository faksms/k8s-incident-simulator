import { useState } from 'react'
import { BookOpen, Check, CircleCheck, Clipboard, Terminal } from 'lucide-react'
import './LearningMaterials.css'

type Material = {
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

const materials: Record<string, Material> = {
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
    title: 'Placement, availability, and disruption budgets',
    objective: 'Balance spread constraints against capacity and understand what a Pod disruption budget can and cannot protect.',
    concepts: [
      { term: 'Topology spread', detail: 'Spread constraints encourage or require distribution across domains such as zones or nodes. maxSkew limits imbalance relative to eligible domains.' },
      { term: 'Hard and soft constraints', detail: 'DoNotSchedule treats an unsatisfied spread constraint as a scheduling block. ScheduleAnyway treats it as a preference, not a guarantee.' },
      { term: 'Capacity still matters', detail: 'A healthy zone needs enough CPU, memory, quota, and eligible nodes for replacement Pods. Spread policy cannot create capacity.' },
      { term: 'PodDisruptionBudget', detail: 'A PDB limits voluntary disruptions through supported eviction paths. It does not prevent involuntary failures such as a zone outage, and it is not a replacement for replicas.' },
    ],
    exampleLabel: 'SPREAD REPLICAS ACROSS ZONES',
    example: 'topologySpreadConstraints:\n  - maxSkew: 1\n    topologyKey: topology.kubernetes.io/zone\n    whenUnsatisfiable: DoNotSchedule\n    labelSelector:\n      matchLabels:\n        app: api',
    question: 'What does a PodDisruptionBudget primarily constrain?',
    options: ['All failures, including a sudden zone outage', 'Voluntary evictions, such as a supported node drain', 'The scheduler’s CPU and memory requests'],
    answer: 1,
    explanation: 'A PDB is about voluntary disruption through eviction-aware operations. It cannot stop involuntary outages and does not reserve node capacity.',
  },
}

export default function LearningMaterials({ lessonId, onPass }: { lessonId: string; onPass: () => void }) {
  const material = materials[lessonId]
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
    <section className="materials-check"><div className="check-heading"><span>KNOWLEDGE CHECK</span>{selected === material.answer&&<b><CircleCheck size={15}/> MASTERED</b>}</div><h3>{material.question}</h3><div className="check-options">{material.options.map((option,index)=><button key={option} className={selected===index?index===material.answer?'answer-correct':'answer-incorrect':''} onClick={()=>answer(index)} aria-pressed={selected===index}><span>{String.fromCharCode(65+index)}</span>{option}</button>)}</div>{selected!==null&&<p aria-live="polite" className={selected===material.answer?'answer-feedback correct':'answer-feedback'}>{selected===material.answer?<Check size={16}/>:<CircleCheck size={16}/>}<span>{selected===material.answer?'That’s right. ':'Not quite. '}{material.explanation}</span></p>}</section>
  </section>
}
