export type TopicNode = { id: string; children?: TopicNode[] }
export type CourseChapter = { id: string; title: string; description: string; topics: TopicNode[] }

export const courseChapters: CourseChapter[] = [
  { id: 'foundations', title: 'Foundations', description: 'Start with the cluster and its API.', topics: [
    { id: 'architecture' }, { id: 'getting-started' }, { id: 'terminology' }, { id: 'api' },
    { id: 'namespaces', children: [{ id: 'resource-quota' }] },
  ] },
  { id: 'administration', title: 'Cluster administration', description: 'Build, maintain, and extend clusters.', topics: [
    { id: 'kubeadm' }, { id: 'cluster-lifecycle' }, { id: 'cluster-extensions' }, { id: 'helm-kustomize' }, { id: 'operators' },
  ] },
  { id: 'workloads', title: 'Workloads', description: 'Understand how applications run and recover.', topics: [
    { id: 'pods', children: [{ id: 'probes' }, { id: 'resource-requests' }] },
    { id: 'deployments', children: [{ id: 'topology' }] }, { id: 'statefulsets' }, { id: 'scheduling' }, { id: 'autoscaling' }, { id: 'rollouts' },
  ] },
  { id: 'networking', title: 'Networking', description: 'Discover services and follow requests.', topics: [
    { id: 'services', children: [{ id: 'dns' }, { id: 'traffic' }] }, { id: 'service-types' }, { id: 'network-policy' }, { id: 'gateway' },
  ] },
  { id: 'data', title: 'Storage & configuration', description: 'Manage application data and settings.', topics: [
    { id: 'storage' }, { id: 'provisioning' }, { id: 'configuration' },
  ] },
  { id: 'security', title: 'Security', description: 'Protect access and workloads.', topics: [
    { id: 'rbac' }, { id: 'security' },
  ] },
  { id: 'troubleshooting', title: 'Troubleshooting', description: 'Diagnose cluster and workload failures.', topics: [
    { id: 'cluster-troubleshooting' }, { id: 'workload-troubleshooting' },
  ] },
]

export function flattenTopics(nodes: TopicNode[]): string[] {
  return nodes.flatMap(node => [node.id, ...flattenTopics(node.children ?? [])])
}

export function filterTopics(nodes: TopicNode[], matches: (id: string) => boolean, includeAll = false): TopicNode[] {
  return nodes.flatMap(node => {
    const matched = includeAll || matches(node.id)
    const children = filterTopics(node.children ?? [], matches, matched)
    return matched || children.length ? [{ id: node.id, ...(children.length ? { children } : {}) }] : []
  })
}
