import { describe, expect, it } from 'vitest'
import { initialPrioritySettings, nextPriorityStep, preemptionOutcome, priorityQueue, resolvedPriority } from './priorityModel'

describe('priority teaching examples', () => {
  it('orders incoming Pods according to their numeric priority', () => {
    expect(priorityQueue('critical').map(pod => pod.name)).toEqual(['pod-alpha', 'pod-bravo', 'pod-charlie'])
    expect(priorityQueue('batch').map(pod => pod.name)).toEqual(['pod-bravo', 'pod-charlie', 'pod-alpha'])
  })

  it('preempts only when policy and relative priority allow it, even with a PDB violation', () => {
    expect(preemptionOutcome(initialPrioritySettings)).toBe('preempt')
    expect(preemptionOutcome({ ...initialPrioritySettings, pdb: true })).toBe('preempt')
    expect(preemptionOutcome({ ...initialPrioritySettings, policy: 'Never' })).toBe('never')
    expect(preemptionOutcome({ ...initialPrioritySettings, tier: 'batch' })).toBe('priority')
  })

  it('resolves an explicit class ahead of the default and falls back to zero', () => {
    expect(resolvedPriority(initialPrioritySettings)).toEqual({ name: 'critical', value: 1000 })
    expect(resolvedPriority({ ...initialPrioritySettings, explicit: false })).toEqual({ name: 'standard-default', value: 100 })
    expect(resolvedPriority({ ...initialPrioritySettings, explicit: false, globalDefault: false })).toEqual({ name: 'none', value: 0 })
  })

  it('steps through visible phases and each second of termination before replaying', () => {
    expect([nextPriorityStep('queue', 0), nextPriorityStep('queue', 2), nextPriorityStep('queue', 6)]).toEqual([2, 6, 0])
    expect([nextPriorityStep('preemption', 0), nextPriorityStep('preemption', 2), nextPriorityStep('preemption', 3), nextPriorityStep('preemption', 4), nextPriorityStep('preemption', 5), nextPriorityStep('preemption', 6)]).toEqual([2, 3, 4, 5, 6, 0])
    expect([nextPriorityStep('inheritance', 0), nextPriorityStep('inheritance', 3), nextPriorityStep('inheritance', 6), nextPriorityStep('inheritance', 8)]).toEqual([3, 8, 8, 0])
  })
})
