import { describe, expect, it } from 'vitest'
import { nodePodCapacity, topologyNodes, topologyPlacements } from './topologyExperiment'

const base = {
  replicas: 8,
  spreadKey: 'node' as const,
  policy: 'strict' as const,
  failureActive: false,
  failureScope: 'node' as const,
  failedTarget: 'node-02',
  preferredNode: 'any',
}

describe('topology placement experiment', () => {
  it('respects node slots even with zone spread and many replicas', () => {
    const placements = topologyPlacements({ ...base, replicas: 12, spreadKey: 'zone', policy: 'best-effort' })
    expect(placements).toHaveLength(12)
    for (const index of topologyNodes.keys()) {
      expect(placements.filter(pod => pod.node === index).length).toBeLessThanOrEqual(nodePodCapacity)
    }
  })

  it('retains surviving Pods and replaces lost Pods only where they fit', () => {
    const placements = topologyPlacements({ ...base, failureActive: true, policy: 'best-effort' })
    expect(placements.filter(pod => pod.node === 1)).toHaveLength(0)
    expect(placements.filter(pod => pod.node === null)).toHaveLength(0)
    expect(placements.filter(pod => pod.id > 8)).toHaveLength(2)
    expect(placements.filter(pod => pod.id <= 8)).toHaveLength(6)
  })

  it('leaves replacements pending when strict skew or capacity prevents placement', () => {
    const strict = topologyPlacements({ ...base, failureActive: true })
    expect(strict.filter(pod => pod.node === null)).toHaveLength(2)
    const full = topologyPlacements({ ...base, replicas: 12, failureActive: true, policy: 'best-effort' })
    expect(full.filter(pod => pod.node === null)).toHaveLength(3)
  })
})
