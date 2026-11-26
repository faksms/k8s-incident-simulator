import { describe, expect, it } from 'vitest'
import { nextProbeStage } from './ProbesLesson'

describe('probe sequence', () => {
  it('does not advance through failed startup or readiness gates', () => {
    expect(nextProbeStage(1, true, false, false)).toBe(1)
    expect(nextProbeStage(1, false, false, false)).toBe(2)
    expect(nextProbeStage(3, false, true, false)).toBe(3)
    expect(nextProbeStage(3, false, false, false)).toBe(4)
  })

  it('only enters the restart branch on liveness failure', () => {
    expect(nextProbeStage(7, false, false, false)).toBe(6)
    expect(nextProbeStage(7, false, false, true)).toBe(8)
    expect(nextProbeStage(10, false, false, true)).toBe(0)
  })
})
