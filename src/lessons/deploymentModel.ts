export type ReplicaState = 'ready' | 'creating' | 'terminating'

function replicas(count: number, state: ReplicaState): ReplicaState[] {
  return Array.from({ length: count }, () => state)
}

export function getReplicaStates(
  desired: number,
  ready: number,
  reconciling: boolean,
  operation: 'scale' | 'delete' | null,
): ReplicaState[] {
  if (!reconciling) return replicas(desired, 'ready')

  if (operation === 'delete') {
    return [...replicas(ready, 'ready'), 'creating']
  }

  if (desired > ready) {
    return [...replicas(ready, 'ready'), ...replicas(desired - ready, 'creating')]
  }

  if (desired < ready) {
    return [...replicas(desired, 'ready'), ...replicas(ready - desired, 'terminating')]
  }

  return replicas(desired, 'ready')
}
