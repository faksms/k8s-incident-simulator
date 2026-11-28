import { describe, expect, it } from 'vitest'
import { evaluateScheduling, initialSchedulingSettings } from './schedulingModel'

describe('scheduler example', () => {
  it('filters node selectors and required affinity together', () => {
    const result = evaluateScheduling({ ...initialSchedulingSettings, disk: 'hdd', requiredZone: 'west', tolerateGpu: true })
    expect(result.selected).toBeNull()
    expect(result.nodes.find(node => node.name === 'worker-north')?.reasons).toContain('Required zone does not match')
    expect(result.nodes.find(node => node.name === 'worker-west')?.reasons).toContain('Disk label does not match')
  })

  it('does not let a preference override a taint, but scores a tolerated node', () => {
    const settings = { ...initialSchedulingSettings, preferWest: true }
    expect(evaluateScheduling(settings).selected?.name).toBe('worker-east')
    expect(evaluateScheduling(settings).nodes.find(node => node.name === 'worker-west')?.reasons).toContain('Untolerated gpu NoSchedule taint')
    expect(evaluateScheduling({ ...settings, tolerateGpu: true }).selected?.name).toBe('worker-west')
  })

  it('keeps the Pod pending if no node has enough CPU', () => {
    const result = evaluateScheduling({ ...initialSchedulingSettings, cpu: 3, tolerateGpu: true })
    expect(result.selected).toBeNull()
    expect(result.nodes.every(node => node.reasons.includes('Not enough CPU available'))).toBe(true)
  })
})
