import { describe, expect, it } from 'vitest'
import { getReplicaStates } from './deploymentModel'

describe('Deployment replica reconciliation', () => {
  it('shows a replacement being created after a Pod is deleted', () => {
    expect(getReplicaStates(3, 2, true, 'delete')).toEqual(['ready', 'ready', 'creating'])
  })

  it('shows additional replicas being created when scaling up', () => {
    expect(getReplicaStates(5, 3, true, 'scale')).toEqual(['ready', 'ready', 'ready', 'creating', 'creating'])
  })

  it('shows excess replicas terminating when scaling down', () => {
    expect(getReplicaStates(2, 4, true, 'scale')).toEqual(['ready', 'ready', 'terminating', 'terminating'])
  })

  it('shows only the desired replicas after reconciliation', () => {
    expect(getReplicaStates(2, 4, false, 'scale')).toEqual(['ready', 'ready'])
  })
})
