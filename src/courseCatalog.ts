export type TopicNode = { id: string; children?: TopicNode[] }
export type CourseChapter = { id: string; title: string; description: string; topics: TopicNode[] }

export const courseChapters: CourseChapter[] = [
  { id: 'foundations', title: 'Foundations', description: 'Start with the cluster and its API.', topics: [
    { id: 'architecture' }, { id: 'getting-started' }, { id: 'terminology' }, { id: 'api' },
    { id: 'namespaces', children: [{ id: 'resource-quota' }] },
  ] },
  { id: 'workloads', title: 'Workloads', description: 'Understand how applications run and recover.', topics: [
    { id: 'pods', children: [{ id: 'probes' }, { id: 'resource-requests' }] },
    { id: 'deployments', children: [{ id: 'topology' }] }, { id: 'statefulsets' },
  ] },
  { id: 'networking', title: 'Networking', description: 'Discover services and follow requests.', topics: [
    { id: 'services', children: [{ id: 'dns' }, { id: 'traffic' }] },
  ] },
  { id: 'data', title: 'Storage & configuration', description: 'Manage application data and settings.', topics: [
    { id: 'storage' }, { id: 'configuration' },
  ] },
  { id: 'security', title: 'Security', description: 'Protect access and workloads.', topics: [
    { id: 'rbac' }, { id: 'security' },
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
