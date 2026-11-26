export type SpreadKey = 'zone' | 'node'
export type FailureScope = 'node' | 'zone'
export type PlacementPolicy = 'strict' | 'best-effort'
export type Placement = { id: number; node: number | null }

export const topologyNodes = [
  { name: 'node-01', zone: 'zone-a' },
  { name: 'node-02', zone: 'zone-a' },
  { name: 'node-03', zone: 'zone-b' },
  { name: 'node-04', zone: 'zone-c' },
]
export const topologyZones = [...new Set(topologyNodes.map(node => node.zone))]
export const nodePodCapacity = 3

type Settings = {
  replicas: number
  spreadKey: SpreadKey
  policy: PlacementPolicy
  failureActive: boolean
  failureScope: FailureScope
  failedTarget: string
  preferredNode: string
}

export function topologyPlacements(settings: Settings): Placement[] {
  const { replicas, spreadKey, policy, failureActive, failureScope, failedTarget, preferredNode } = settings
  const domains = spreadKey === 'node' ? topologyNodes.map(node => node.name) : topologyZones
  const domainForNode = (node: number) => spreadKey === 'node' ? topologyNodes[node].name : topologyNodes[node].zone
  const allNodes = topologyNodes.map((_, index) => index)
  const eligible = allNodes.filter(index => !failureActive || (failureScope === 'node' ? topologyNodes[index].name !== failedTarget : topologyNodes[index].zone !== failedTarget))

  function place(placements: Placement[], id: number, candidates: number[]): Placement {
    const nodeCounts = allNodes.map(node => placements.filter(item => item.node === node).length)
    const domainCounts = domains.map(domain => placements.filter(item => item.node !== null && domainForNode(item.node) === domain).length)
    const sorted = candidates.filter(node => nodeCounts[node] < nodePodCapacity).sort((a, b) =>
      domainCounts[domains.indexOf(domainForNode(a))] - domainCounts[domains.indexOf(domainForNode(b))] || nodeCounts[a] - nodeCounts[b] || a - b,
    )
    const target = sorted.find(node => {
      if (policy !== 'strict') return true
      const domainIndex = domains.indexOf(domainForNode(node))
      const next = domainCounts.map((count, index) => count + (index === domainIndex ? 1 : 0))
      return Math.max(...next) - Math.min(...next) <= 1
    })
    return { id, node: target === undefined ? null : target }
  }

  const initial: Placement[] = []
  for (let id = 1; id <= replicas; id++) initial.push(place(initial, id, allNodes))
  if (!failureActive) return initial

  const survivors = initial.filter(item => item.node !== null && eligible.includes(item.node))
  const missing = replicas - survivors.length
  const candidates = eligible.filter(node => preferredNode === 'any' || topologyNodes[node].name === preferredNode)
  for (let index = 0; index < missing; index++) survivors.push(place(survivors, replicas + index + 1, candidates))
  return survivors
}
