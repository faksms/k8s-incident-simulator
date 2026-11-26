import { describe, expect, it } from 'vitest'
import { updateApiExample, updateStatefulExample } from './FoundationLabs'

describe('foundation examples', () => {
  it('keeps the same claim data when a StatefulSet Pod is replaced', () => {
    const written = updateStatefulExample({ generation: 1, records: 0 }, 'write')
    expect(updateStatefulExample(written, 'replace')).toEqual({ generation: 2, records: 1 })
  })
  it('keeps API acceptance separate from readiness', () => {
    const initial = { desired: 3, ready: 0, accepted: false }
    expect(updateApiExample(initial, 'reconcile')).toEqual(initial)
    const accepted = updateApiExample(initial, 'apply')
    expect(accepted.ready).toBe(0)
    expect(updateApiExample(accepted, 'reconcile').ready).toBe(1)
  })
})
