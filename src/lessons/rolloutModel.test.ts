import { describe, expect, it } from 'vitest'
import { advanceRollout, initialRollout, undoRollout } from './rolloutModel'
import type { RolloutState } from './rolloutModel'

function expectCapacity(state: RolloutState) {
  expect(state.oldReady + state.newReady).toBeGreaterThanOrEqual(3)
  expect(state.oldReady + state.newReady + (state.starting ? 1 : 0)).toBeLessThanOrEqual(4)
}

describe('rolling update and rollback example', () => {
  it('creates a surge Pod, waits for readiness, then retires old Pods until complete', () => {
    let state = initialRollout
    const stages: string[] = []
    for (let i = 0; i < 10; i++) {
      state = advanceRollout(state, 'healthy')
      stages.push(state.stage)
      expectCapacity(state)
    }
    expect(stages).toEqual(['starting-new', 'new-ready', 'removed-old', 'starting-new', 'new-ready', 'removed-old', 'starting-new', 'new-ready', 'removed-old', 'complete'])
    expect(state).toEqual({ oldReady: 0, newReady: 3, starting: null, stage: 'complete' })
    expect(advanceRollout(state, 'healthy')).toEqual(initialRollout)
  })

  it('stalls on an unready Pod and restores the previous template gradually', () => {
    let state = initialRollout
    for (let i = 0; i < 5; i++) state = advanceRollout(state, 'unready')
    expect(state).toEqual({ oldReady: 2, newReady: 1, starting: 'new', stage: 'stalled' })
    expect(advanceRollout(state, 'unready')).toEqual(state)
    state = undoRollout(state)
    const stages: string[] = []
    for (let i = 0; i < 5; i++) {
      state = advanceRollout(state, 'unready')
      stages.push(state.stage)
      expectCapacity(state)
    }
    expect(stages).toEqual(['discard-new', 'starting-old', 'old-ready', 'removed-new', 'restored'])
    expect(state).toEqual({ oldReady: 3, newReady: 0, starting: null, stage: 'restored' })
  })

  it('can roll back safely from every in-progress or complete healthy step', () => {
    let forward = initialRollout
    for (let i = 0; i < 10; i++) {
      forward = advanceRollout(forward, 'healthy')
      let rollback = undoRollout(forward)
      for (let step = 0; step < 15 && rollback.stage !== 'restored'; step++) {
        expectCapacity(rollback)
        rollback = advanceRollout(rollback, 'healthy')
      }
      expect(rollback).toEqual({ oldReady: 3, newReady: 0, starting: null, stage: 'restored' })
    }
  })
})
