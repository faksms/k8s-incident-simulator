import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ArchitectureExperiment, { architectureOutcome } from './ArchitectureExperiment'

describe('architecture experiment', () => {
  it('keeps API reachability separate from the example Service traffic', () => {
    expect(architectureOutcome(false, true)).toEqual({ changesPossible: false, trafficPossible: true })
    expect(architectureOutcome(true, false)).toEqual({ changesPossible: true, trafficPossible: false })
    expect(architectureOutcome(false, false)).toEqual({ changesPossible: false, trafficPossible: false })
  })

  it('offers component inspection and a rotatable diagram without a cluster', () => {
    const markup = renderToStaticMarkup(<ArchitectureExperiment/>)
    expect(markup).toContain('View angle')
    expect(markup).toContain('API: reachable')
    expect(markup).toContain('Inspect a component')
    expect(markup).toContain('does not connect to a cluster')
  })
})
