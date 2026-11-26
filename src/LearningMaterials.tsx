import { useState } from 'react'
import { BookOpen, Check, CircleCheck, Clipboard, Terminal } from 'lucide-react'
import { deploymentExampleManifest } from './lessons/deploymentManifest'
import './LearningMaterials.css'
import './LearningMaterialsPolish.css'

export type Material = {
  title: string
  objective: string
  concepts: { term: string; detail: string }[]
  exampleLabel: string
  example: string
  commandsLabel?: string
  commands?: string
  question: string
  options: string[]
  answer: number
  explanation: string
  source?: string
}

export const materials: Record<string, Material> = {
  architecture: {
    title: 'How the cluster runs your app',
    objective: 'Follow how Kubernetes starts your app and sends traffic to it.',
    concepts: [
      { term: 'API server', detail: 'The front door for managing the cluster. It checks requests from tools and other cluster components. It does not carry normal app traffic.' },
      { term: 'etcd', detail: 'A database that stores cluster configuration and state, so the control plane can remember them. You normally use the API server rather than accessing etcd directly.' },
      { term: 'Controllers and scheduler', detail: 'Controllers compare what you asked for with what is running and try to close the gap. The scheduler chooses a node for a Pod and records that choice through the API.' },
      { term: 'Node agents and traffic', detail: 'The kubelet works with the container runtime to run Pods. A CNI network plugin connects Pods; the Service data plane sends traffic to suitable endpoints.' },
    ],
    exampleLabel: 'TRACE A DEPLOYMENT',
    example: 'kubectl apply -f app.yaml\nkubectl get deployment,pods -w\nkubectl describe pod <pod-name>\nkubectl get events --sort-by=.lastTimestamp',
    question: 'Which component handles a client request sent to a Service virtual IP?',
    options: ['etcd reads the Service record and proxies the packet', 'The Service data plane forwards it to an eligible endpoint', 'The API server streams the request to the container'],
    answer: 1,
    explanation: 'The Service data plane sends the request to a suitable endpoint. The API server manages configuration, and etcd stores it; neither carries normal app traffic.',
  },
  pods: {
    title: 'Pods and the containers inside them',
    objective: 'Understand what containers share and how a new Pod differs from a restarted container.',
    concepts: [
      { term: 'Placed together', detail: 'Kubernetes places a whole Pod on one node. Its containers share the Pod’s network and IP address.' },
      { term: 'Shared resources', detail: 'Containers in a Pod can talk over localhost and can mount the same volume to share files. Their files and processes are otherwise separate unless sharing is set up.' },
      { term: 'Init containers', detail: 'Ordinary init containers run one at a time and finish before app containers start. They can do one-time setup, such as preparing a database.' },
      { term: 'Sidecars', detail: 'A sidecar is a helper that runs alongside the app. For example, it can collect and send the app’s logs.' },
      { term: 'Ambassadors', detail: 'An ambassador is a helper that handles connections for the app. The app talks to it locally; it can then connect to another service.' },
      { term: 'Probes', detail: 'Probes are health checks. Startup waits for the app to start; readiness controls normal Service traffic; liveness can restart an unhealthy container.' },
      { term: 'Replacing a Pod', detail: 'A replacement Pod is a new object and can have a different IP. A controller can create replacements, while a Service gives clients a stable way to find the app.' },
    ],
    exampleLabel: 'POD WITH A SHARED VOLUME',
    example: 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: app-with-agent\nspec:\n  containers:\n    - name: app\n      image: busybox:1.36\n      command: ["sh", "-c", "while true; do date >> /var/log/app/access.log; sleep 5; done"]\n      volumeMounts:\n        - name: shared\n          mountPath: /var/log/app\n    - name: log-agent\n      image: busybox:1.36\n      command: ["sh", "-c", "tail -f /var/log/app/access.log"]\n      volumeMounts:\n        - name: shared\n          mountPath: /var/log/app\n  volumes:\n    - name: shared\n      emptyDir: {}',
    question: 'A sidecar in the same Pod needs to reach the app on its listening port. Which address should it use?',
    options: ['The app container name as a DNS hostname', 'localhost and the app container port', 'The Pod IP plus a separate Pod network namespace'],
    answer: 1,
    explanation: 'Containers in the same Pod share a network, so they can talk using localhost. They must not try to use the same listening port at the same time.',
  },
  deployments: {
    title: 'Deployments: desired state, updates, and recovery',
    objective: 'Declare an app and replica target, watch controllers reconcile it, then roll out or undo a Pod-template update.',
    concepts: [
      { term: 'Desired state and reconciliation', detail: 'The Deployment spec declares a Pod template and replica target. Controllers repeatedly observe actual state, compare it with that target, and take action; reconciliation is ongoing, not a one-time command.' },
      { term: 'ReplicaSet and self-healing', detail: 'A Deployment creates and manages ReplicaSets, which keep the requested number of matching Pods. If a Pod disappears, the ReplicaSet creates a new Pod with a new identity; it cannot repair the deleted Pod. A matching count does not guarantee app health.' },
      { term: 'Scaling and scheduling', detail: 'Changing spec.replicas changes the target. Controllers request more or fewer Pods, while the scheduler places new Pods when suitable capacity is available. Quotas, placement rules, or resource requests can leave Pods Pending.' },
      { term: 'Rolling update', detail: 'Changing the Pod template creates a new ReplicaSet. The Deployment replaces Pods gradually; readiness and maxSurge/maxUnavailable influence how many copies remain available. A rollout can stall if new Pods cannot become Ready.' },
      { term: 'Rollback and history', detail: 'A rollback restores an earlier Pod template recorded in rollout history. It does not reverse database migrations, external configuration, or other changes outside the Deployment.' },
      { term: 'Inspect the workload', detail: 'Check the Deployment, its ReplicaSets, Pods, events, and rollout status together. A desired/ready mismatch is a clue to inspect scheduling, image pulls, probes, and events.' },
      { term: 'Service and cleanup', detail: 'A Deployment does not provide a stable network address. A Service selects matching Pod labels and gives clients a stable endpoint; remove both resources when the exercise is finished.' },
      { term: 'Declarative and imperative changes', detail: 'A manifest describes the intended configuration; kubectl scale or rollout undo changes the live object directly. Update your source manifest after an imperative change or a later apply or GitOps sync may restore the old settings. A Deployment can continue reconciling after either kind of change.' },
      { term: 'Availability and compatibility', detail: 'A rolling update is not a guarantee of zero downtime. Sufficient capacity, readiness checks, client compatibility across versions, and safe handling of shared data all matter.' },
    ],
    exampleLabel: 'DECLARATIVE DEPLOYMENT MANIFEST',
    example: deploymentExampleManifest,
    commandsLabel: 'APPLY, INSPECT, UPDATE, AND CLEAN UP',
    commands: `# Real-cluster commands: check your context and namespace first.
# Save the manifest above as deployment.yaml before applying.
kubectl apply -f deployment.yaml
kubectl get deployment,replicasets,pods -l app=web
kubectl get pods -l app=web -w
# Stop watching with Ctrl+C before running the next command.
kubectl describe deployment web
kubectl get pods -l app=web --show-labels
kubectl rollout status deployment/web
kubectl expose deployment/web --name=web --port=80 --target-port=80
kubectl get service/web
kubectl get endpointslices -l kubernetes.io/service-name=web
# An imperative scale or image change can differ from deployment.yaml.
kubectl scale deployment/web --replicas=4
kubectl set image deployment/web web=nginx:1.28
kubectl rollout pause deployment/web
kubectl rollout resume deployment/web
kubectl rollout history deployment/web
kubectl rollout undo deployment/web
kubectl rollout status deployment/web
# Update your manifest to match the intended final state.
# Cleanup deletes these resources; use only in a disposable exercise.
kubectl delete service/web deployment/web`,
    question: 'A Pod managed by a Deployment is deleted. What should happen next?',
    options: ['The deleted Pod is repaired in place', 'The ReplicaSet creates a replacement to move toward the replica target', 'The scheduler increases the Deployment replica count'],
    answer: 1,
    explanation: 'The ReplicaSet observes too few matching Pods and creates a new Pod. The replacement is a new object with a new identity.',
  },
  services: {
    title: 'How a Service finds your app',
    objective: 'Check labels, readiness, and ports when a Service cannot reach an app.',
    concepts: [
      { term: 'Stable address', detail: 'A Service gives clients a stable address, even when its app Pods are replaced. Clients do not need to track each Pod IP.' },
      { term: 'Selectors and labels', detail: 'A Service uses a selector to find Pods with matching labels. If the labels do not match, those Pods are not selected.' },
      { term: 'Readiness', detail: 'A matching Pod normally needs to be Ready before it receives regular Service traffic. The readiness check should reflect whether the app can serve requests.' },
      { term: 'Ports', detail: 'The Service port is where clients connect. targetPort is the Pod port where the app should be listening. A wrong targetPort can prevent requests from working.' },
    ],
    exampleLabel: 'SERVICE SELECTOR AND PORT MAPPING',
    example: 'apiVersion: v1\nkind: Service\nmetadata:\n  name: api\nspec:\n  selector:\n    app: api\n  ports:\n    - name: http\n      port: 80\n      targetPort: 8080',
    question: 'The Service has no endpoints, but its Pods are running. What should you check first?',
    options: ['Whether the Service selector matches Pod labels and Pods are Ready', 'Whether the Pods use hostNetwork', 'Whether the Deployment has a public LoadBalancer address'],
    answer: 0,
    explanation: 'Endpoint eligibility depends on selector matching and readiness. Start by comparing Service selectors with Pod labels and checking Pod conditions.',
  },
  traffic: {
    title: 'How a request reaches your app',
    objective: 'Follow a request from outside the cluster to the app container.',
    concepts: [
      { term: 'DNS and load balancer', detail: 'DNS looks up the address for a name. A load balancer or other network entry point can bring outside traffic to the cluster; its setup varies by environment.' },
      { term: 'Ingress or Gateway', detail: 'These resources describe where HTTP requests should go, based on rules such as the host and path. A suitable controller must be installed to make the rules work.' },
      { term: 'Service backend', detail: 'The route often points to a Service. The Service finds suitable app endpoints, and its targetPort must match the port where the app listens.' },
      { term: 'Check each layer', detail: 'Check DNS and the entry point, then the route and controller, the Service endpoints, and finally the app’s port and health.' },
    ],
    exampleLabel: 'TRACE THE ROUTE',
    example: 'kubectl get ingress -A\nkubectl describe ingress <name>\nkubectl get svc,endpointslices -n <namespace>\nkubectl get pods -n <namespace> -o wide',
    question: 'An Ingress rule points to a Service, but external requests fail. What is the best next check?',
    options: ['Confirm the controller has programmed the route, then inspect the Service endpoints', 'Restart etcd because it carries the HTTP request', 'Change every Pod IP in the route'],
    answer: 0,
    explanation: 'The route needs a functioning controller and a backend with eligible endpoints. Inspect status and follow the request path one layer at a time.',
  },
  topology: {
    title: 'Spread app copies across nodes and zones',
    objective: 'See how spreading app copies can reduce the effect of a node or zone failure.',
    concepts: [
      { term: 'Choose nodes or zones', detail: 'The topologyKey says what to spread across. kubernetes.io/hostname means nodes; topology.kubernetes.io/zone means zones. A zone can contain several nodes.' },
      { term: 'maxSkew', detail: 'maxSkew limits how uneven Pod counts can be across eligible groups. A balance across nodes does not always mean a balance across zones.' },
      { term: 'Required or preferred', detail: 'DoNotSchedule can leave a Pod Pending if the spread rule cannot be met. ScheduleAnyway treats the rule as a preference instead.' },
      { term: 'Leave room for replacements', detail: 'A healthy zone still needs enough CPU, memory, quota, and suitable nodes for replacement Pods. A spread rule does not create extra capacity.' },
      { term: 'PodDisruptionBudget', detail: 'A PDB limits certain planned removals of Pods, such as supported evictions during maintenance. It cannot stop an unexpected node or zone failure.' },
    ],
    exampleLabel: 'SPREAD PODS ACROSS HOSTNAMES',
    example: 'topologySpreadConstraints:\n  - maxSkew: 1\n    topologyKey: kubernetes.io/hostname\n    whenUnsatisfiable: DoNotSchedule\n    labelSelector:\n      matchLabels:\n        app: api',
    question: 'Four replicas are evenly spread across four nodes, but three nodes are in zone A. What does hostname spread guarantee?',
    options: ['At most one replica in each zone', 'Balanced counts across nodes, but not necessarily across zones', 'That every replica survives a zone-A outage'],
    answer: 1,
    explanation: 'The topology key determines what counts as a domain. Hostname spread balances node counts; it does not guarantee zone balance or survival of a zone failure. Use a zone key when zone-level distribution is required.',
  },
  'resource-quota': {
    title: 'ResourceQuota: a budget for a namespace',
    objective: 'See whether new Pods fit within the namespace’s shared resource budget.',
    concepts: [
      { term: 'One namespace', detail: 'A ResourceQuota sets a shared budget for selected resources in one namespace. It can limit total CPU or memory requests, limits, and object counts.' },
      { term: 'Checking the budget', detail: 'The API checks each new object against applicable quotas. A Pod that does not fit is rejected, even if other Pods from the same Deployment fit.' },
      { term: 'Requests and limits', detail: 'CPU and memory requests help the scheduler find space for Pods. Limits control container use. Quotas track requests and limits separately.' },
      { term: 'Finding the problem', detail: 'When a quota tracks requests or limits, Pods usually need those values, either set directly or supplied by a LimitRange. Check kubectl describe resourcequota and the rejection message.' },
    ],
    exampleLabel: 'SET NAMESPACE REQUEST AND LIMIT BUDGETS',
    example: 'apiVersion: v1\nkind: ResourceQuota\nmetadata:\n  name: team-budget\n  namespace: team-api\nspec:\n  hard:\n    requests.cpu: "4"\n    requests.memory: 8Gi\n    limits.cpu: "8"\n    limits.memory: 16Gi',
    question: 'A namespace has 2 CPU cores of requests.cpu remaining. A Deployment requests 3 replicas at 750m each. What should you expect?',
    options: ['All three Pods are admitted because each uses less than 2 cores', 'Two Pods may be admitted; the third Pod admission is rejected until quota is available', 'The Deployment controller silently lowers each request to fit'],
    answer: 1,
    explanation: 'Quota is checked for each Pod admission. Two Pods consume 1500m of the 2000m remaining; the third would bring the total to 2250m, so that Pod is rejected while the Deployment remains below its desired replicas.',
  },
  'resource-requests': {
    title: 'CPU and memory: requests and limits',
    objective: 'See how Kubernetes finds room for a Pod and what happens when a container reaches a limit.',
    concepts: [
      { term: 'Requests help find space', detail: 'The scheduler checks a Pod’s requests against the node’s available allocatable resources. A request helps reserve space for placement; it is not a prediction of exact use.' },
      { term: 'CPU limits slow work', detail: 'If a container tries to use more CPU than its limit, it can be throttled: it gets less CPU time. CPU use alone does not normally cause it to be killed.' },
      { term: 'Memory limits can stop a container', detail: 'If a container exceeds its memory limit, the system may stop it with an out-of-memory (OOM) kill. Its restart policy determines whether it restarts.' },
      { term: 'Choose values carefully', detail: 'Requests and limits also affect the Pod’s quality-of-service (QoS) class. Measure real app use, leave extra room, and test with realistic traffic.' },
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
    objective: 'Choose the right health check for starting the app, receiving traffic, or restarting it.',
    concepts: [
      { term: 'Startup probe', detail: 'Gives a slow app time to start. Until this check succeeds, the kubelet does not run the container’s regular readiness or liveness checks.' },
      { term: 'Readiness probe', detail: 'Checks whether the Pod is ready for normal Service traffic. A failed check makes it NotReady; it does not by itself restart the container.' },
      { term: 'Liveness probe', detail: 'Checks whether the container is still healthy. Repeated failures can restart it according to the Pod’s restart policy.' },
      { term: 'How to check', detail: 'A probe can use an HTTP request, a TCP connection, or a command. Timing and threshold settings control how often it runs and how many results count.' },
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
  const [copied, setCopied] = useState<'example' | 'commands' | null>(null)
  const [copyError, setCopyError] = useState(false)
  const commands = material.commands

  async function copyContent(content: string, section: 'example' | 'commands') {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(section)
      setCopyError(false)
    } catch {
      setCopied(null)
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
    <section className="materials-example"><header><div><Terminal size={15}/><b>{material.exampleLabel}</b></div><button onClick={()=>copyContent(material.example,'example')} aria-label="Copy example"><Clipboard size={14}/>{copied==='example'?'Copied':'Copy'}</button></header><pre><code>{material.example}</code></pre></section>
    {commands&&<section className="materials-example"><header><div><Terminal size={15}/><b>{material.commandsLabel??'COMMANDS'}</b></div><button onClick={()=>copyContent(commands,'commands')} aria-label="Copy commands"><Clipboard size={14}/>{copied==='commands'?'Copied':'Copy'}</button></header><pre><code>{commands}</code></pre></section>}
    {copyError&&<p className="copy-error">Clipboard permission was unavailable. Select the code above to copy it manually.</p>}
    <section className="materials-check"><div className="check-heading"><span>KNOWLEDGE CHECK</span>{passed&&<b><CircleCheck size={15}/> CHECK PASSED</b>}</div><h3>{material.question}</h3><div className="check-options">{material.options.map((option,index)=><button key={option} className={selected===index?index===material.answer?'answer-correct':'answer-incorrect':''} onClick={()=>answer(index)} aria-pressed={selected===index}><span>{String.fromCharCode(65+index)}</span>{option}</button>)}</div>{selected!==null&&<p aria-live="polite" className={selected===material.answer?'answer-feedback correct':'answer-feedback'}>{selected===material.answer?<Check size={16}/>:<CircleCheck size={16}/>}<span>{selected===material.answer?`That’s right. ${material.explanation}`:'Not quite. Review the notes above and try another answer.'}</span></p>}</section>
    {material.source && <p className="materials-source">Further reading: <a href={material.source} target="_blank" rel="noreferrer">official documentation</a> (opens in a new tab).</p>}
  </section>
}
