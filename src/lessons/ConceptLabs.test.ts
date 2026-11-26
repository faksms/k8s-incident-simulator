import { describe, expect, it } from 'vitest'
import { resolveExample, updateStorage } from './ConceptLabs'

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
