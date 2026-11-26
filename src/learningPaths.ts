export type LearningPath = {
  id: string
  title: string
  description: string
  topics: { id: string; title: string }[]
}

export const learningPaths: LearningPath[] = [
  {
    id: 'beginner', title: 'Kubernetes beginner',
    description: 'Build a mental model, then connect workloads to traffic.',
    topics: [
      { id: 'architecture', title: 'Cluster architecture' },
      { id: 'pods', title: 'Pods and containers' },
      { id: 'deployments', title: 'Deployments' },
      { id: 'services', title: 'Services and endpoints' },
    ],
  },
  {
    id: 'operator', title: 'Kubernetes operator',
    description: 'Explore networking, persistent data, access, and workload controls.',
    topics: [
      { id: 'namespaces', title: 'Namespaces' },
      { id: 'dns', title: 'Service discovery and DNS' },
      { id: 'storage', title: 'Storage' },
      { id: 'rbac', title: 'RBAC' },
      { id: 'resource-requests', title: 'Resource requests and limits' },
    ],
  },
  {
    id: 'responder', title: 'Incident responder',
    description: 'Learn the signals behind common workload and traffic failures.',
    topics: [
      { id: 'pods', title: 'Pods and containers' },
      { id: 'probes', title: 'Health probes' },
      { id: 'resource-requests', title: 'Resource requests and limits' },
      { id: 'services', title: 'Services and endpoints' },
      { id: 'traffic', title: 'Application traffic' },
    ],
  },
  {
    id: 'cka', title: 'CKA topic explorer',
    description: 'Explore cluster administration, scheduling, networking, storage, and troubleshooting.',
    topics: [
      { id: 'kubeadm', title: 'Cluster bootstrap' },
      { id: 'cluster-lifecycle', title: 'Cluster upgrades and availability' },
      { id: 'cluster-extensions', title: 'Runtime, network and storage interfaces' },
      { id: 'rbac', title: 'API access and RBAC' },
      { id: 'helm-kustomize', title: 'Helm and Kustomize' },
      { id: 'operators', title: 'Custom resources and operators' },
      { id: 'scheduling', title: 'Scheduling and affinity' },
      { id: 'autoscaling', title: 'Autoscaling' },
      { id: 'network-policy', title: 'NetworkPolicy' },
      { id: 'service-types', title: 'Service types and endpoints' },
      { id: 'gateway', title: 'Gateway and Ingress' },
      { id: 'dns', title: 'Service discovery and DNS' },
      { id: 'provisioning', title: 'Storage provisioning' },
      { id: 'configuration', title: 'ConfigMaps and Secrets' },
      { id: 'rollouts', title: 'Rollouts and rollbacks' },
      { id: 'cluster-troubleshooting', title: 'Cluster troubleshooting' },
      { id: 'workload-troubleshooting', title: 'Workload troubleshooting' },
    ],
  },
]

export const serviceLabProgressId = 'practice:service-lab'
export function incidentProgressId(index: number) { return `incident:${index}` }

export function nextPathTopic(path: LearningPath, passed: Set<string>) {
  return path.topics.find(topic => !passed.has(topic.id)) ?? path.topics[0]
}

export function weeklyIncidentIndex(date: Date, count: number) {
  if (!Number.isInteger(count) || count <= 0 || !Number.isFinite(date.getTime())) {
    throw new Error('A valid date and a positive incident count are required')
  }
  const mondayEpoch = Date.UTC(1970, 0, 5)
  const week = Math.floor((date.getTime() - mondayEpoch) / (7 * 24 * 60 * 60 * 1000))
  return ((week % count) + count) % count
}
