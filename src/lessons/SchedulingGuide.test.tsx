import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import SchedulingGuide from './SchedulingGuide'

describe('scheduling guide', () => {
  it('provides separate rule explanations and an interactive scheduler', () => {
    const markup = renderToStaticMarkup(<SchedulingGuide/>)
    expect(markup).toContain('Filter, score, then bind')
    expect(markup).toContain('nodeSelector: a simple hard match')
    expect(markup).toContain('Node affinity: required or preferred')
    expect(markup).toContain('Taints and tolerations: permission, not selection')
    expect(markup).toContain('Pod affinity and anti-affinity')
    expect(markup).toContain('Topology spread constraints')
    expect(markup).toContain('checkout-pod')
    expect(markup).toContain('worker-west')
    expect(markup).toContain('Next step')
  })
})
