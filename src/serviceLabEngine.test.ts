import { describe, expect, it } from 'vitest'
import { initialLabState, runLabCommand } from './serviceLabEngine'

describe('Service troubleshooting lab', () => {
  it('reveals the mismatch, applies the fix, and requires verification', () => {
    expect(runLabCommand(initialLabState, 'kubectl get pods --show-labels').output).toContain('app=web-frontend')
    expect(runLabCommand(initialLabState, 'kubectl describe service frontend').output).toContain('Endpoints:         <none>')
    const fixed = runLabCommand(initialLabState, '  kubectl set selector service frontend app=web-frontend  ')
    expect(fixed.state).toEqual({ selectorFixed: true, verified: false })
    const verified = runLabCommand(fixed.state, 'kubectl describe service frontend')
    expect(verified.output).toContain('Endpoints:         10.244.1.5:8080')
    expect(verified.state.verified).toBe(true)
  })

  it('does not change state for unsupported commands or mark an unfixed Service verified', () => {
    const unsupported = runLabCommand(initialLabState, 'kubectl delete service frontend')
    expect(unsupported.state).toEqual(initialLabState)
    expect(unsupported.output).toContain('not supported')
    expect(runLabCommand(initialLabState, 'kubectl describe service frontend').state.verified).toBe(false)
  })
})
