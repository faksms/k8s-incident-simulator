import type { ExtendedLesson } from './ExtendedLessons'

export const ckaLessons: ExtendedLesson[] = [
  {
    id: 'kubeadm', title: 'Bootstrap a cluster with kubeadm',
    body: 'Learn the main kubeadm steps: prepare the machines, start the control plane, and join worker nodes.',
    takeaway: 'Initialization is only one step. The cluster also needs working networking and healthy nodes.',
    keywords: 'kubeadm install init join runtime cni prerequisites cluster setup',
    diagram: { nodes: ['Prepare hosts', 'Control plane', 'Worker + CNI'], links: ['initialize', 'join & network'] },
    steps: [
      { title: 'Prepare hosts', detail: 'Check the official requirements, network connection, supported versions, container runtime, and kubelet settings on each machine.' },
      { title: 'Initialize the control plane', detail: 'kubeadm init sets up the control plane and gives instructions for administrator access and joining nodes.' },
      { title: 'Join and verify', detail: 'Install a compatible Pod network, then join workers using the generated instructions. Check node readiness and system Pods, and follow the network provider’s documentation.' },
    ],
    material: {
      title: 'From prepared hosts to a cluster', objective: 'Identify the major bootstrap stages without running changes against a real machine.',
      concepts: [
        { term: 'Host prerequisites', detail: 'Before setup, each machine needs a working runtime, supported kubeadm and kubelet versions, network access, and correct settings.' },
        { term: 'Control plane', detail: 'kubeadm sets up the control plane, but does not install every network or infrastructure component.' },
        { term: 'Pod networking', detail: 'Install a compatible network add-on and check its requirements. System Pods may stay Pending until networking is ready.' },
        { term: 'Credentials', detail: 'Join tokens and kubeconfig files are sensitive. Keep them safe and follow current guidance on how long to use them.' },
      ],
      exampleLabel: 'READ-ONLY CHECKS ON AN EXISTING CLUSTER', example: 'kubectl get nodes -o wide\nkubectl get pods -n kube-system\nkubectl cluster-info',
      question: 'After kubeadm initializes a cluster, what else is needed for Pod networking?', options: ['A compatible Pod network add-on', 'Only a Service of type LoadBalancer', 'A Secret for every Pod'], answer: 0,
      explanation: 'A compatible Pod network must be installed and configured. kubeadm does not automatically provide every network add-on.',
      source: 'https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/',
    },
  },
  {
    id: 'cluster-lifecycle', title: 'Cluster upgrades & availability',
    body: 'Plan node maintenance and supported upgrades, and prepare to recover the control plane. High availability is not the same as a backup.',
    takeaway: 'Follow supported upgrade steps, protect quorum, and check recovery plans before and after maintenance.',
    keywords: 'upgrade kubeadm drain cordon high availability etcd backup restore quorum version skew',
    diagram: { nodes: ['Plan & backup', 'Maintain nodes', 'Verify health'], links: ['upgrade', 'check'] },
    steps: [
      { title: 'Plan and back up', detail: 'Check the version-skew and kubeadm upgrade guidance for your target versions. Make sure you have a usable, tested etcd backup and a recovery plan.' },
      { title: 'Maintain nodes', detail: 'Follow the documented order for upgrading control-plane and worker nodes. Cordon and drain nodes when needed, while protecting disruption budgets and application availability.' },
      { title: 'Verify health', detail: 'After each stage, check nodes, control-plane components, workloads, and connections. Uncordon a node only when it is ready to run workloads.' },
    ],
    material: {
      title: 'Upgrade and recovery safeguards', objective: 'Explain the checks required for planned cluster changes.',
      concepts: [
        { term: 'Version skew', detail: 'Kubernetes limits which versions of kubeadm, API servers, kubelets, and other components can work together. Check the current rules instead of skipping minor versions.' },
        { term: 'Node maintenance', detail: 'Cordon stops new Pods from being scheduled on a node. Drain evicts eligible workloads, but a PodDisruptionBudget can block it. DaemonSet and unmanaged Pods need special care.' },
        { term: 'Control-plane availability', detail: 'Multiple control-plane instances and a suitable load balancer can help keep the API available. An etcd cluster needs quorum, and availability does not replace backups.' },
        { term: 'Recovery', detail: 'Back up and restore etcd with the right access, secure storage, and a tested procedure for your cluster setup.' },
      ],
      exampleLabel: 'INSPECT BEFORE MAINTENANCE', example: 'kubectl get nodes\nkubectl get pdb -A\nkubectl get pods -n kube-system',
      question: 'What does cordoning a node do?', options: ['Prevents new Pods from being scheduled there; it does not evict existing Pods', 'Deletes all Pods immediately', 'Backs up etcd'], answer: 0,
      explanation: 'Cordon marks the node unschedulable for new placements. Draining is a separate operation with its own safeguards.',
      source: 'https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/',
    },
  },
  {
    id: 'cluster-extensions', title: 'Container, network & storage interfaces',
    body: 'Learn how Kubernetes connects to container runtimes, Pod networks, and storage systems.',
    takeaway: 'CRI runs containers, CNI configures Pod networking, and CSI integrates storage.',
    keywords: 'cri cni csi runtime containerd network plugin storage driver interfaces',
    diagram: { nodes: ['CRI runtime', 'CNI network', 'CSI storage'], links: ['network setup', 'volume integration'] },
    steps: [
      { title: 'Run containers', detail: 'The kubelet uses the Container Runtime Interface (CRI) to work with a supported container runtime.' },
      { title: 'Configure Pod networking', detail: 'When setting up a Pod sandbox, the runtime calls the configured CNI plugins to set up its network.' },
      { title: 'Attach and mount volumes', detail: 'CSI drivers connect Kubernetes to supported storage systems so it can provide and mount volumes.' },
    ],
    material: {
      title: 'Three integration boundaries', objective: 'Identify which integration is relevant when containers, networking, or storage fail.',
      concepts: [
        { term: 'CRI', detail: 'The container runtime provides the actions kubelet needs to manage Pod sandboxes and containers.' },
        { term: 'CNI', detail: 'Network plugins set up Pod networks. Whether NetworkPolicy works depends on the network implementation.' },
        { term: 'CSI', detail: 'Storage drivers can provide, attach, and mount volumes. Available features depend on the driver and storage system.' },
      ],
      exampleLabel: 'INSPECT COMPONENTS', example: 'kubectl get nodes -o wide\nkubectl get pods -n kube-system\nkubectl get csidrivers',
      question: 'Which interface integrates storage drivers with Kubernetes?', options: ['CSI', 'CRI', 'CNI'], answer: 0,
      explanation: 'CSI is the storage interface. CRI concerns container runtimes and CNI concerns network configuration.',
      source: 'https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/',
    },
  },
  {
    id: 'helm-kustomize', title: 'Helm & Kustomize',
    body: 'Compare Helm’s templates with Kustomize’s manifest changes before installing cluster components.',
    takeaway: 'Preview the generated manifests and check who manages them before applying or upgrading a release.',
    keywords: 'helm chart release values upgrade rollback kustomize overlay kubectl kustomize',
    diagram: { nodes: ['Source', 'Render', 'Apply & inspect'], links: ['configure', 'verify'] },
    steps: [
      { title: 'Choose a source', detail: 'A Helm chart packages templates and default settings. A Kustomize base and overlays describe changes to manifests.' },
      { title: 'Render and inspect', detail: 'Review Helm values or Kustomize overlays, then preview the output before applying it. Pay close attention to permissions and cluster-wide resources.' },
      { title: 'Install and verify', detail: 'Install with your chosen tool, then check release state, rollout status, and workload health. Helm release history differs from Deployment rollout history.' },
    ],
    material: {
      title: 'Package and customize safely', objective: 'Distinguish Helm releases from Kustomize output and inspect before changing a cluster.',
      concepts: [
        { term: 'Helm', detail: 'A chart is a package of templates. A release tracks an installation and its revisions. Values change the generated configuration.' },
        { term: 'Kustomize', detail: 'Kustomize builds manifests from a base and overlays. Use kubectl kustomize to preview a directory.' },
        { term: 'Operational safety', detail: 'Check the generated output, who manages the release, prerequisites, and rollback plan. Protect secret values; a rollback may not restore external data.' },
      ],
      exampleLabel: 'INSPECT RELEASES AND MANIFESTS', example: 'helm list -A\nhelm history <release-name> -n <namespace>\nkubectl kustomize <directory>',
      question: 'Which command renders a Kustomize directory without applying it?', options: ['kubectl kustomize <directory>', 'kubectl delete namespace <name>', 'helm rollback <release-name>'], answer: 0,
      explanation: 'kubectl kustomize renders the configured manifests; it does not apply them.',
      source: 'https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/',
    },
  },
  {
    id: 'operators', title: 'Custom resources & operators',
    body: 'Learn how a CustomResourceDefinition adds a resource type and how a controller acts on it.',
    takeaway: 'A CRD defines a resource type; an operator must be running to reconcile its custom resources.',
    keywords: 'crd custom resource operator controller reconciliation extension api',
    diagram: { nodes: ['CRD', 'Custom resource', 'Operator'], links: ['adds type', 'reconciles'] },
    steps: [
      { title: 'Register a type', detail: 'A CustomResourceDefinition adds a resource type to the API, including its schema and scope.' },
      { title: 'Create an object', detail: 'A custom resource is one instance of that type. The API server can accept it even when no operator is acting on it.' },
      { title: 'Reconcile the object', detail: 'An operator or another controller watches these objects and carries out application-specific tasks. If it fails, check its status and logs.' },
    ],
    material: {
      title: 'Extending the API', objective: 'Separate registration, desired state, and the controller that acts on it.',
      concepts: [
        { term: 'CRD', detail: 'A CRD describes a custom resource type and its schema. Installing it adds that type to the Kubernetes API.' },
        { term: 'Custom resource', detail: 'An instance stores settings and often its observed status. The API accepting it does not mean the requested work is done.' },
        { term: 'Operator', detail: 'An operator uses controllers to manage application-specific tasks. Check its setup, permissions, and lifecycle needs before deploying it.' },
      ],
      exampleLabel: 'INSPECT EXTENSIONS', example: 'kubectl get crd\nkubectl api-resources\nkubectl get deployments -A',
      question: 'Does creating a CRD alone implement its desired operational behavior?', options: ['No; a controller is needed to act on custom resources', 'Yes; the CRD automatically runs the application', 'Yes; kubelet implements every CRD'], answer: 0,
      explanation: 'A CRD registers a resource type. A controller or operator implements the corresponding behavior.',
      source: 'https://kubernetes.io/docs/concepts/extend-kubernetes/operator/',
    },
  },
  {
    id: 'scheduling', title: 'Scheduling, affinity & taints',
    body: 'Learn how Pod requirements and available resources affect which node it can run on.',
    takeaway: 'Placement requires an eligible node; toleration permits a taint but does not select a node.',
    keywords: 'scheduler nodeSelector node affinity taints tolerations admission pod placement pending',
    diagram: { nodes: ['Pod requirements', 'Filter nodes', 'Schedule'], links: ['constraints', 'bind'] },
    steps: [
      { title: 'Describe requirements', detail: 'A Pod can request resources and use selectors or affinity rules to limit which nodes are eligible.' },
      { title: 'Filter nodes', detail: 'The scheduler checks resources, node conditions, and taints. A toleration lets a Pod pass a matching taint check, but does not force the Pod onto a node.' },
      { title: 'Bind or investigate', detail: 'The scheduler chooses an eligible node. If none fit, check the Pending Pod’s events and node conditions.' },
    ],
    material: {
      title: 'Why is a Pod Pending?', objective: 'Use scheduling evidence to distinguish placement constraints from runtime problems.',
      concepts: [
        { term: 'Resource requests', detail: 'The scheduler compares requests with the resources available on a node. A process’s current usage is different from its request.' },
        { term: 'Affinity and selectors', detail: 'nodeSelector and required node affinity limit which nodes can be chosen. Preferred affinity affects ranking but is not a strict requirement.' },
        { term: 'Taints and tolerations', detail: 'A taint can keep away Pods without a matching toleration. A toleration lets a Pod be considered; it does not guarantee a node.' },
        { term: 'Admission', detail: 'Admission can reject or change a request before scheduling. An API rejection is different from a Pod that is Pending.' },
      ],
      exampleLabel: 'INSPECT SCHEDULING', example: 'kubectl get pods -A -o wide\nkubectl describe pod <pod-name> -n <namespace>\nkubectl describe node <node-name>',
      question: 'Does a toleration force a Pod onto a matching tainted node?', options: ['No; it permits consideration but other constraints still apply', 'Yes, it selects that node', 'Yes, it reserves resources there'], answer: 0,
      explanation: 'Tolerations remove a matching taint obstacle; node selection and other scheduling rules still matter.',
      source: 'https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/',
    },
  },
  {
    id: 'priority-classes', title: 'Priority classes & preemption',
    body: 'See how Pod priority affects the scheduling queue, how preemption makes room, and how Pod templates obtain a priority.',
    takeaway: 'A higher priority influences scheduling order; preemption is conditional and does not guarantee placement.',
    keywords: 'priorityclass priorityClassName globalDefault preemption preempt pdb scheduling queue terminationGracePeriodSeconds',
    diagram: { nodes: ['PriorityClass', 'Pending queue', 'Node decision'], links: ['assign priority', 'schedule or preempt'] },
    steps: [
      { title: 'Assign priority', detail: 'A cluster-scoped PriorityClass maps a name to an integer. A Pod can reference it directly or through a workload Pod template.' },
      { title: 'Order the queue', detail: 'The scheduler generally considers higher-priority pending Pods first, but still checks whether each Pod can fit.' },
      { title: 'Consider preemption', detail: 'If enabled, a pending Pod may displace lower-priority Pods when removing them would make a node feasible. Victims have a graceful termination period.' },
    ],
    material: {
      title: 'PriorityClass field notes', objective: 'Explain queue order, defaults, and the limits of preemption.',
      concepts: [
        { term: 'PriorityClass and values', detail: 'PriorityClass is cluster-scoped. Higher numeric values represent higher priority. User-defined values range from -2147483648 to 1000000000; larger values are reserved for built-in system-critical classes.' },
        { term: 'Pod template and admission', detail: 'Set priorityClassName in a Pod spec or a Deployment’s spec.template.spec. Admission resolves the class to a numeric priority; an unknown class rejects Pod creation. Deleting a class does not change existing Pods.' },
        { term: 'Global default', detail: 'At most one class can be globalDefault. Pods without a class name receive that default when created, or priority 0 when there is no default. Adding or changing a default does not retroactively change existing Pods.' },
        { term: 'Queue ordering', detail: 'The scheduler considers higher-priority pending Pods ahead of lower-priority Pods. Failed attempts, backoff, and placement constraints can allow lower-priority Pods to be scheduled first.' },
        { term: 'Preemption policy', detail: 'PreemptLowerPriority is the default. Never still gives a Pod queue priority but prevents it from preempting other Pods; it can itself be preempted by a higher-priority Pod.' },
        { term: 'Feasibility and termination', detail: 'Preemption needs a node that can fit the incoming Pod after suitable lower-priority victims are removed. Victims receive their termination grace period. A nominated node is not a guarantee of placement; other constraints and scheduling changes still apply.' },
        { term: 'PDB and safeguards', detail: 'The scheduler attempts to avoid violating PodDisruptionBudgets, but respects them only on a best-effort basis during preemption. Use priority sparingly and restrict high-priority usage with appropriate ResourceQuota and access controls.' },
      ],
      exampleLabel: 'PRIORITY CLASSES AND A DEPLOYMENT',
      example: `apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: critical
value: 1000
globalDefault: false
preemptionPolicy: PreemptLowerPriority
description: "Important workloads that may preempt lower-priority Pods"
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: queue-only
value: 900
globalDefault: false
preemptionPolicy: Never
description: "Important workloads that do not preempt others"
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: standard-default
value: 100
# Set to true only after checking the cluster's existing global default.
globalDefault: false
description: "Optional default for newly admitted Pods"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: priority-demo
spec:
  replicas: 2
  selector:
    matchLabels:
      app: priority-demo
  template:
    metadata:
      labels:
        app: priority-demo
    spec:
      priorityClassName: critical
      containers:
        - name: web
          image: nginx:1.27
          resources:
            requests:
              cpu: 100m`,
      commandsLabel: 'APPLY AND INVESTIGATE',
      commands: `# Use a disposable cluster; check your context and namespace first.
# Save the example as priority-demo.yaml. PriorityClasses are cluster-scoped.
kubectl apply -f priority-demo.yaml
kubectl get priorityclasses
kubectl get pods -l app=priority-demo -o custom-columns=NAME:.metadata.name,CLASS:.spec.priorityClassName,PRIORITY:.spec.priority,NOMINATED:.status.nominatedNodeName
kubectl describe pods -l app=priority-demo
kubectl get events --sort-by=.lastTimestamp
# Cleanup only resources created for this exercise.
kubectl delete deployment priority-demo
kubectl delete priorityclass critical queue-only standard-default`,
      question: 'A high-priority Pod uses preemptionPolicy: Never. What happens when no node has room?',
      options: ['It may preempt any lower-priority Pod', 'It waits for a suitable node without preempting other Pods', 'It skips all placement checks'],
      answer: 1,
      explanation: 'Never disables preemption by this Pod, not its queue priority or normal scheduling checks.',
      source: 'https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/',
    },
  },
  {
    id: 'autoscaling', title: 'Horizontal Pod autoscaling',
    body: 'Learn how workload metrics, resource requests, and replica limits affect an HPA’s scaling decisions.',
    takeaway: 'An HPA changes the desired number of replicas. It does not add node capacity or fix missing metrics.',
    keywords: 'hpa horizontal pod autoscaler metrics server cpu utilization replicas scale',
    diagram: { nodes: ['Metrics', 'HPA', 'Workload'], links: ['compare', 'scale'] },
    steps: [
      { title: 'Collect metrics', detail: 'The HPA gets measurements from the right metrics APIs. Resource metrics usually need a working metrics-server.' },
      { title: 'Compare to target', detail: 'The controller compares measured values with the target. CPU targets need CPU requests set for the relevant containers.' },
      { title: 'Adjust replicas', detail: 'The controller changes the desired replica count within its limits. Pods still need room on nodes and healthy dependencies.' },
    ],
    material: {
      title: 'Scale from observed demand', objective: 'Diagnose why an autoscaler cannot measure or add useful capacity.',
      concepts: [
        { term: 'Metrics', detail: 'Check the HPA conditions and metrics API. Resource and custom metrics each need a suitable provider.' },
        { term: 'Requests', detail: 'CPU utilization is measured against requested CPU. Without the needed requests, the HPA may not be able to calculate utilization-based scaling.' },
        { term: 'Limits and capacity', detail: 'minReplicas and maxReplicas set the lower and upper replica counts. Quotas, node capacity, startup time, and downstream limits can still prevent useful scaling.' },
      ],
      exampleLabel: 'INSPECT AUTOSCALING', example: 'kubectl get hpa\nkubectl describe hpa <name>\nkubectl top pods',
      question: 'What happens if an HPA needs resource metrics but the metrics API is unavailable?', options: ['It cannot calculate that scaling signal', 'It automatically creates new nodes', 'It can always determine CPU from Pod labels'], answer: 0,
      explanation: 'The HPA needs its configured metrics source. Inspect HPA conditions and the metrics provider before changing replica limits.',
      source: 'https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/',
    },
  },
  {
    id: 'rollouts', title: 'Rolling updates & rollbacks',
    body: 'Review a Deployment revision, watch the rollout, and learn what a rollback can and cannot fix.',
    takeaway: 'An accepted API change does not mean the new rollout is available. Check its status and readiness.',
    keywords: 'deployment rollout history status undo rolling update revision strategy rollback',
    diagram: { nodes: ['New template', 'ReplicaSets', 'Rollout status'], links: ['replace gradually', 'verify'] },
    steps: [
      { title: 'Change the Pod template', detail: 'A Deployment creates a new revision when its Pod template changes. Check the image and settings before updating.' },
      { title: 'Watch replacement', detail: 'The rollout strategy controls how old and new replicas replace each other. Readiness and available capacity affect progress.' },
      { title: 'Inspect or roll back', detail: 'Check rollout status, events, and revision history. A rollback restores an earlier Pod template, but does not undo outside changes such as database updates.' },
    ],
    material: {
      title: 'Operate a Deployment revision', objective: 'Recognize a stalled rollout and the scope of a rollback.',
      concepts: [
        { term: 'Rolling update', detail: 'maxSurge and maxUnavailable limit how the rollout proceeds. Readiness and scheduling affect whether new replicas become available.' },
        { term: 'Rollout status', detail: 'Check the Deployment status, ReplicaSets, Pods, and events. A rollout can stall even after the API accepts its update.' },
        { term: 'Rollback scope', detail: 'A Deployment rollback restores an earlier Pod template. Check the application afterward and handle database or other outside changes separately.' },
      ],
      exampleLabel: 'INSPECT A ROLLOUT', example: 'kubectl rollout status deployment/<name> -n <namespace>\nkubectl rollout history deployment/<name> -n <namespace>\nkubectl get replicasets -n <namespace>\n# Restore the previous Pod template after reviewing the rollout:\nkubectl rollout undo deployment/<name> -n <namespace>',
      question: 'What does a Deployment rollback restore?', options: ['A previous Pod template', 'All external database data automatically', 'Every deleted Kubernetes object'], answer: 0,
      explanation: 'Deployment rollback targets the Pod template. External state and data require separate recovery procedures.',
      source: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/',
    },
  },
  {
    id: 'service-types', title: 'Service types & endpoints',
    body: 'Compare how Services make workloads reachable inside or outside the cluster, and follow traffic to their backends.',
    takeaway: 'The Service type affects how clients reach it. Ready endpoints and correct port mappings still matter.',
    keywords: 'clusterip nodeport loadbalancer service endpointslices ports targetport',
    diagram: { nodes: ['Client', 'Service type', 'Endpoint'], links: ['reach', 'forward'] },
    steps: [
      { title: 'Choose an entry point', detail: 'ClusterIP works inside the cluster. NodePort opens a port on nodes. LoadBalancer asks a compatible system to provide an external load balancer.' },
      { title: 'Inspect the mapping', detail: 'A Service port can differ from its targetPort. The Service selector finds backend Pods, and readiness affects which Pods can receive traffic.' },
      { title: 'Follow the backend', detail: 'Check EndpointSlices, Pod readiness, and the ports the application listens on. A Service alone does not guarantee outside routing or a healthy application.' },
    ],
    material: {
      title: 'Expose and inspect a Service', objective: 'Choose a Service type and diagnose missing backends.',
      concepts: [
        { term: 'ClusterIP', detail: 'A ClusterIP gives clients inside the cluster a virtual address for the Service, if they can route to it.' },
        { term: 'NodePort and LoadBalancer', detail: 'NodePort opens a port on eligible nodes. A LoadBalancer Service needs a system that sets up an external load balancer.' },
        { term: 'Endpoints', detail: 'Before blaming the network, check selector labels, readiness, target ports, and EndpointSlices.' },
      ],
      exampleLabel: 'INSPECT SERVICE ROUTING', example: 'kubectl get services -A\nkubectl describe service <name> -n <namespace>\nkubectl get endpointslices -n <namespace>',
      question: 'Does creating a LoadBalancer Service alone guarantee an external load balancer on every cluster?', options: ['No; a compatible implementation must provide it', 'Yes, Kubernetes always provides the infrastructure', 'Yes, even without a Service controller'], answer: 0,
      explanation: 'A LoadBalancer Service requests external provisioning; the cluster needs a compatible implementation.',
      source: 'https://kubernetes.io/docs/concepts/services-networking/service/',
    },
  },
  {
    id: 'network-policy', title: 'NetworkPolicy & Pod connectivity',
    body: 'Learn how NetworkPolicy selects Pods and controls which connections are allowed.',
    takeaway: 'NetworkPolicy needs an enforcing network plugin; policies combine allowed traffic additively.',
    keywords: 'networkpolicy ingress egress deny allow podselector namespaceSelector cni',
    diagram: { nodes: ['Source Pod', 'Policies', 'Destination'], links: ['egress', 'ingress'] },
    steps: [
      { title: 'Select Pods', detail: 'A NetworkPolicy selects Pods in its namespace. It isolates them for the incoming (ingress) or outgoing (egress) traffic directions it names.' },
      { title: 'Allow peers and ports', detail: 'Rules allow traffic from or to selected peers on selected ports. Applicable policies add together; they do not have a priority order.' },
      { title: 'Test both sides', detail: 'For a connection between isolated Pods, the source’s egress and destination’s ingress must both allow it. Check that the network plugin enforces policies.' },
    ],
    material: {
      title: 'Reason about traffic policy', objective: 'Identify selection, traffic direction, and enforcement requirements.',
      concepts: [
        { term: 'Enforcement', detail: 'A NetworkPolicy does nothing unless the network system supports enforcing it.' },
        { term: 'Directions', detail: 'Incoming and outgoing traffic are controlled separately. A policy affects only the Pods and directions it selects.' },
        { term: 'Combined rules', detail: 'Traffic allowed by applicable policies is combined. Both the source’s outgoing rules and the destination’s incoming rules must allow a connection.' },
        { term: 'DNS', detail: 'When limiting outgoing traffic, allow for the DNS requests workloads need. Test how routing and policies work in your cluster.' },
      ],
      exampleLabel: 'INSPECT NETWORK POLICIES', example: 'kubectl get networkpolicy -A\nkubectl describe networkpolicy <name> -n <namespace>\nkubectl get pods -n <namespace> --show-labels',
      question: 'What is needed for a NetworkPolicy to restrict traffic?', options: ['A network implementation that enforces NetworkPolicy', 'A namespace alone', 'Only a Service selector'], answer: 0,
      explanation: 'NetworkPolicy resources require an implementing network plugin or controller to enforce them.',
      source: 'https://kubernetes.io/docs/concepts/services-networking/network-policies/',
    },
  },
  {
    id: 'gateway', title: 'Gateway API & Ingress',
    body: 'Compare the resources that describe how outside application traffic reaches a Kubernetes Service.',
    takeaway: 'Gateway and Ingress need compatible controllers to route traffic. Check routes, backends, and status.',
    keywords: 'gateway api gatewayclass httproute ingress controller external http routing',
    diagram: { nodes: ['Gateway / Ingress', 'HTTP route', 'Service'], links: ['accept', 'forward'] },
    steps: [
      { title: 'Provide a controller', detail: 'A compatible controller acts on the chosen GatewayClass or IngressClass. The API objects alone do not send traffic.' },
      { title: 'Configure routing', detail: 'Gateway API uses Gateway and route resources such as HTTPRoute. Ingress describes HTTP routes for an Ingress controller to handle.' },
      { title: 'Inspect status and backend', detail: 'If requests do not arrive, check controller and route status, host and path rules, Service ports, and ready endpoints.' },
    ],
    material: {
      title: 'Route HTTP traffic into a cluster', objective: 'Distinguish declarative routing resources from their implementations.',
      concepts: [
        { term: 'Gateway API', detail: 'GatewayClass names the controller to use. Gateway describes where traffic enters; HTTPRoute describes HTTP rules and backends.' },
        { term: 'Ingress', detail: 'Ingress needs an Ingress controller. Extra behavior and setup depend on which controller you use.' },
        { term: 'Status and connectivity', detail: 'Before changing settings, check conditions, accepted routes, Service ports, EndpointSlices, and the application.' },
      ],
      exampleLabel: 'INSPECT ROUTES WHEN INSTALLED', example: 'kubectl get gatewayclass,gateway,httproute -A\nkubectl get ingress -A\nkubectl get service,endpointslice -n <namespace>',
      question: 'Does an Ingress resource by itself route traffic?', options: ['No; an Ingress controller is required', 'Yes, the API server forwards every request', 'Yes, etcd proxies the traffic'], answer: 0,
      explanation: 'Ingress declares routing configuration. An appropriate controller must implement it.',
      source: 'https://kubernetes.io/docs/concepts/services-networking/gateway/',
    },
  },
  {
    id: 'provisioning', title: 'Storage classes & volume lifecycle',
    body: 'Follow how Kubernetes provides storage on demand, and learn about access modes, binding, and reclaim policy.',
    takeaway: 'The StorageClass and storage driver control how storage is provided. Reclaim policy matters when a claim is deleted.',
    keywords: 'storageclass dynamic provisioning pvc pv reclaim policy waitforfirstconsumer access modes csi',
    diagram: { nodes: ['PVC', 'StorageClass', 'PV'], links: ['request', 'provision & bind'] },
    steps: [
      { title: 'Request a volume', detail: 'A PVC names a StorageClass or uses the configured default. It asks for capacity and an access mode.' },
      { title: 'Provision and bind', detail: 'A provisioner creates a suitable PV. With WaitForFirstConsumer, binding may wait until scheduling has enough information about where the Pod can run.' },
      { title: 'Manage the lifecycle', detail: 'Before deleting a claim, check the PV reclaim policy and storage system. Retain and Delete have different effects; check backups separately.' },
    ],
    material: {
      title: 'Provision storage intentionally', objective: 'Understand why a claim is Pending and how storage lifecycle policies affect data.',
      concepts: [
        { term: 'Dynamic provisioning', detail: 'A StorageClass names a provisioner and its settings. The needed driver and storage system must be available.' },
        { term: 'Binding mode', detail: 'WaitForFirstConsumer delays binding or provisioning until a Pod helps decide where storage is needed. The claim may be Pending until then.' },
        { term: 'Access modes', detail: 'Access modes describe how storage can be mounted and help decide which volume can bind. They are not general file write protection.' },
        { term: 'Reclaim policy', detail: 'Delete may remove the backing storage after the claim is deleted. Retain keeps it for manual handling. Check how the actual volume and storage system behave.' },
      ],
      exampleLabel: 'INSPECT A CLAIM', example: 'kubectl get storageclass\nkubectl get pvc -A\nkubectl get pv\nkubectl describe pvc <claim-name> -n <namespace>',
      question: 'Why might a WaitForFirstConsumer claim stay Pending before a Pod uses it?', options: ['Binding waits for a consumer and its scheduling context', 'Every PVC must immediately bind', 'It means DNS is always broken'], answer: 0,
      explanation: 'WaitForFirstConsumer can delay binding until a consuming Pod provides scheduling context.',
      source: 'https://kubernetes.io/docs/concepts/storage/storage-classes/',
    },
  },
  {
    id: 'cluster-troubleshooting', title: 'Troubleshoot clusters & nodes',
    body: 'Find the scope of a cluster problem, then check API access, node conditions, and control-plane health.',
    takeaway: 'First find what is affected and gather evidence. Node problems and control-plane problems need different checks.',
    keywords: 'cluster node notready kubelet api server control plane etcd events troubleshoot',
    diagram: { nodes: ['Scope impact', 'Node / API', 'Component evidence'], links: ['isolate', 'inspect'] },
    steps: [
      { title: 'Determine scope', detail: 'Find out whether one workload, one node, or the cluster API is affected. Check your context and access before investigating.' },
      { title: 'Inspect node and control plane', detail: 'If the API works, check node conditions, events, and system Pods. If it does not, use host-level procedures to check kubelet, runtime, API server, and etcd.' },
      { title: 'Validate a recovery plan', detail: 'Keep evidence, understand dependencies and quorum, and take a controlled action. Then check both component and application health.' },
    ],
    material: {
      title: 'Investigate the failure domain', objective: 'Choose useful evidence without assuming that every problem can be solved from kubectl.',
      concepts: [
        { term: 'Node NotReady', detail: 'Check conditions and events, then investigate kubelet, runtime, networking, and machine resources using approved procedures.' },
        { term: 'Control plane', detail: 'If the API works, check system Pods and events. If it is down, kubectl may not work; use suitable node-level tools and access.' },
        { term: 'Recovery safety', detail: 'Do not restart or replace control-plane components without a plan. Protect etcd quorum, keep evidence, and follow tested runbooks.' },
      ],
      exampleLabel: 'INSPECT IF API IS REACHABLE', example: 'kubectl get nodes\nkubectl describe node <node-name>\nkubectl get pods -n kube-system\nkubectl get events -A --sort-by=.lastTimestamp',
      question: 'If the API server is unreachable, which approach is appropriate?', options: ['Use authorized host-level checks and investigate control-plane dependencies', 'Assume kubectl will always work', 'Delete every application namespace'], answer: 0,
      explanation: 'kubectl depends on API connectivity. A control-plane outage may require host-level investigation.',
      source: 'https://kubernetes.io/docs/tasks/debug/debug-cluster/',
    },
  },
  {
    id: 'workload-troubleshooting', title: 'Logs, metrics & workload diagnosis',
    body: 'Use Pod status, events, container logs, and resource measurements together to investigate application failures.',
    takeaway: 'Compare several signals and their times. One status or measurement rarely explains the whole problem.',
    keywords: 'logs previous metrics top events crashloopbackoff resource usage troubleshoot container',
    diagram: { nodes: ['Pod status', 'Logs & events', 'Metrics'], links: ['inspect', 'correlate'] },
    steps: [
      { title: 'Check status', detail: 'Check whether the Pod is ready, how often it restarts, why containers are waiting or stopped, and which node it runs on.' },
      { title: 'Collect evidence', detail: 'Read events and container logs. If a container restarted, its earlier logs may be available with kubectl logs --previous.' },
      { title: 'Correlate usage', detail: 'Use kubectl top if resource metrics are available. Compare usage with requests, limits, and node conditions, then check the effect of any change.' },
    ],
    material: {
      title: 'Investigate without guessing', objective: 'Select useful signals for a restarting or resource-constrained workload.',
      concepts: [
        { term: 'Events and status', detail: 'Pod details and events can show why scheduling failed, why a probe failed, or why a container stopped.' },
        { term: 'Logs', detail: 'Choose the right Pod and container. --previous asks for logs from the earlier container instance, if those logs are still available.' },
        { term: 'Resource metrics', detail: 'kubectl top reads the resource metrics API, often provided by metrics-server. If metrics are missing, that does not mean usage is zero.' },
      ],
      exampleLabel: 'COLLECT WORKLOAD SIGNALS', example: 'kubectl describe pod <pod-name> -n <namespace>\nkubectl logs <pod-name> -n <namespace> --previous\nkubectl top pods -n <namespace>',
      question: 'What does kubectl logs --previous request?', options: ['Logs from the previous container instance, if available', 'The complete cluster event history', 'CPU requests for every node'], answer: 0,
      explanation: '--previous requests logs from the previous container instance; the logs must still be available.',
      source: 'https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/',
    },
  },
]
