import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import AutoscalingGuide, { AutoscalingDiagram } from './AutoscalingGuide'
import type { AutoscalingSettings } from './AdministrationLabs'

const settings: AutoscalingSettings = { metrics: 'yes', requests: 'yes', usage: 150, min: 1, max: 6 }

describe('autoscaling replay', () => {
  it('updates desired replicas before creating Pods and distinguishes Pending from Ready', () => {
    const before = renderToStaticMarkup(<AutoscalingDiagram settings={settings} capacity={2} phase={2} reducedMotion/>)
    const after = renderToStaticMarkup(<AutoscalingDiagram settings={settings} capacity={2} phase={3} reducedMotion/>)
    expect(before).toContain('Desired replicas: 6')
    expect(before).not.toContain('orders-3')
    expect(after).toContain('2 Ready · 4 Pending')
    expect(after).toContain('orders-6')
    expect(after).toContain('Pending · no room')
  })

  it('keeps the existing Pods when the signal is unavailable and shows scale-down', () => {
    const missing = renderToStaticMarkup(<AutoscalingDiagram settings={{ ...settings, metrics: 'no' }} capacity={6} phase={3} reducedMotion/>)
    const down = renderToStaticMarkup(<AutoscalingDiagram settings={{ ...settings, usage: 25 }} capacity={6} phase={3} reducedMotion/>)
    expect(missing).toContain('CPU recommendation unavailable')
    expect(missing).toContain('Desired replicas: 2')
    expect(missing).toContain('orders-2')
    expect(down).toContain('Desired replicas: 1')
    expect(down).not.toContain('orders-2')
  })

  it('exposes replay and scenario controls', () => {
    const markup = renderToStaticMarkup(<AutoscalingGuide/>)
    expect(markup).toContain('aria-label="Average CPU per Pod"')
    expect(markup).toContain('aria-valuetext="150m"')
    expect(markup).toContain('type="range"')
    expect(markup).toContain('Resource metrics')
    expect(markup).toContain('Example node capacity')
    expect(markup).toContain('Next step')
  })

  it('shows intermediate capacity when a slider value is between its endpoints', () => {
    const markup = renderToStaticMarkup(<AutoscalingDiagram settings={settings} capacity={4} phase={3} reducedMotion/>)
    expect(markup).toContain('4 Ready · 2 Pending')
  })
})
