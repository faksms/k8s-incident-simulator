export type RolloutScenario = 'healthy' | 'unready'
export type RolloutStage = 'baseline' | 'starting-new' | 'new-ready' | 'removed-old' | 'stalled' | 'complete' | 'undo-requested' | 'discard-new' | 'starting-old' | 'old-ready' | 'removed-new' | 'restored'
export type RolloutState = { oldReady: number; newReady: number; starting: 'old' | 'new' | null; stage: RolloutStage }

export const initialRollout: RolloutState = { oldReady: 3, newReady: 0, starting: null, stage: 'baseline' }

export function undoRollout(state: RolloutState): RolloutState {
  if (state.stage === 'baseline' || state.stage === 'restored' || ['undo-requested', 'discard-new', 'starting-old', 'old-ready', 'removed-new'].includes(state.stage)) return state
  return { ...state, stage: 'undo-requested' }
}

export function advanceRollout(state: RolloutState, scenario: RolloutScenario): RolloutState {
  switch (state.stage) {
    case 'baseline':
    case 'removed-old':
      return state.oldReady === 0 ? { ...state, stage: 'complete' } : { ...state, starting: 'new', stage: 'starting-new' }
    case 'starting-new':
      return scenario === 'unready' && state.newReady === 1
        ? { ...state, stage: 'stalled' }
        : { ...state, starting: null, newReady: state.newReady + 1, stage: 'new-ready' }
    case 'new-ready':
      return { ...state, oldReady: state.oldReady - 1, stage: 'removed-old' }
    case 'complete':
      return initialRollout
    case 'undo-requested':
    case 'discard-new':
    case 'removed-new':
      if (state.starting === 'new') return { ...state, starting: null, stage: 'discard-new' }
      if (state.oldReady + state.newReady > 3) return { ...state, newReady: state.newReady - 1, stage: 'removed-new' }
      if (state.newReady === 0) return { ...state, stage: 'restored' }
      return { ...state, starting: 'old', stage: 'starting-old' }
    case 'starting-old':
      return { ...state, oldReady: state.oldReady + 1, starting: null, stage: 'old-ready' }
    case 'old-ready':
      return { ...state, newReady: state.newReady - 1, stage: 'removed-new' }
    case 'stalled':
    case 'restored':
      return state
  }
}
