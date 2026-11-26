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
