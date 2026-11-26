import { describe, expect, it } from 'vitest'
import { accessExample, resolveExample, schedulingExample, updateConfigExample, updateRolloutExample, updateStorage } from './ConceptLabs'

describe('access and scheduling examples', () => {
  it('requires a matching binding, namespace and permission', () => {
    expect(accessExample(true, 'shop', 'get')).toBe(true)
    expect(accessExample(false, 'shop', 'get')).toBe(false)
    expect(accessExample(true, 'tools', 'get')).toBe(false)
    expect(accessExample(true, 'shop', 'delete')).toBe(false)
  })
  it('filters nodes by both CPU request and required zone', () => {
    expect(schedulingExample(1, 'any')).toHaveLength(2)
    expect(schedulingExample(2, 'west')).toHaveLength(0)
    expect(schedulingExample(2, 'east').map(node => node.name)).toEqual(['node-east'])
    expect(schedulingExample(3, 'any')).toHaveLength(0)
  })
  it('updates a mounted file separately from a running container environment', () => {
    const changed = updateConfigExample({ source: 1, environment: 1, volume: 1 }, 'edit')
    expect(changed).toEqual({ source: 2, environment: 1, volume: 1 })
    expect(updateConfigExample(changed, 'sync')).toEqual({ source: 2, environment: 1, volume: 2 })
    expect(updateConfigExample(changed, 'restart')).toEqual({ source: 2, environment: 2, volume: 2 })
  })
  it('keeps the old copy until the new one is ready and can roll back', () => {
    const started = updateRolloutExample({ ready: 0, pending: false, failed: false }, 'start')
    const failed = updateRolloutExample(started, 'fail')
    expect(failed).toEqual({ ready: 0, pending: true, failed: true })
    expect(updateRolloutExample(failed, 'ready')).toEqual({ ready: 1, pending: false, failed: false })
    expect(updateRolloutExample(failed, 'rollback')).toEqual({ ready: 0, pending: false, failed: false })
  })
})

describe('DNS discovery example', () => {
  it('distinguishes namespace lookup failure from missing endpoints', () => {
    expect(resolveExample({ namespace: 'tools', query: 'short', ready: true })).toBe('not-found')
    expect(resolveExample({ namespace: 'tools', query: 'qualified', ready: false })).toBe('no-endpoints')
    expect(resolveExample({ namespace: 'tools', query: 'qualified', ready: true })).toBe('reachable')
    expect(resolveExample({ namespace: 'shop', query: 'short', ready: true })).toBe('reachable')
  })
})

describe('storage lifecycle example', () => {
  it('retains both volumes on container restart but clears emptyDir on Pod replacement', () => {
    const state = { pod: 1, restarts: 0, data: { emptyDir: 1, pvc: 2 } }
    const restarted = updateStorage(state, { type: 'restart' })
    expect(restarted).toEqual({ pod: 1, restarts: 1, data: { emptyDir: 1, pvc: 2 } })
    expect(updateStorage(restarted, { type: 'replace' })).toEqual({ pod: 2, restarts: 0, data: { emptyDir: 0, pvc: 2 } })
  })

  it('writes only to the selected volume', () => {
    const state = { pod: 1, restarts: 0, data: { emptyDir: 1, pvc: 0 } }
    expect(updateStorage(state, { type: 'write', volume: 'pvc' }).data).toEqual({ emptyDir: 1, pvc: 1 })
  })
})
