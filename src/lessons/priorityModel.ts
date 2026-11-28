export type PriorityModule = 'queue' | 'preemption' | 'inheritance'
export type PriorityPolicy = 'PreemptLowerPriority' | 'Never'
export type PrioritySettings = {
  tier: 'critical' | 'batch'
  policy: PriorityPolicy
  pdb: boolean
  explicit: boolean
  globalDefault: boolean
}

export const initialPrioritySettings: PrioritySettings = {
  tier: 'critical', policy: 'PreemptLowerPriority', pdb: false, explicit: true, globalDefault: true,
}

export function priorityQueue(tier: PrioritySettings['tier']) {
  return [
    { id: 'incoming', name: 'pod-alpha', value: tier === 'critical' ? 1000 : 50 },
    { id: 'existing', name: 'pod-bravo', value: 500 },
    { id: 'victim', name: 'pod-charlie', value: 100 },
  ].sort((a, b) => b.value - a.value)
}

export function preemptionOutcome(settings: PrioritySettings): 'preempt' | 'never' | 'priority' {
  if (settings.policy === 'Never') return 'never'
  return settings.tier === 'critical' ? 'preempt' : 'priority'
}

export function resolvedPriority(settings: PrioritySettings) {
  if (settings.explicit) return { name: 'critical', value: 1000 }
  if (settings.globalDefault) return { name: 'standard-default', value: 100 }
  return { name: 'none', value: 0 }
}

export function nextPriorityStep(module: PriorityModule, tick: number) {
  if (module === 'preemption') {
    if (tick < 2) return 2
    if (tick < 6) return tick + 1
    return 0
  }
  if (module === 'inheritance') {
    if (tick < 3) return 3
    if (tick < 8) return 8
    return 0
  }
  if (tick < 2) return 2
  if (tick < 6) return 6
  return 0
}
