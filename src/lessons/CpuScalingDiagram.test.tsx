import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import CpuScalingDiagram from './CpuScalingDiagram'
import { autoscalingExample } from './AdministrationLabs'
import type { AutoscalingSettings } from './AdministrationLabs'

const settings: AutoscalingSettings = { metrics: 'yes', requests: 'yes', usage: 150, min: 1, max: 3 }

describe('CPU scaling animation', () => {
  it('shows the sample, calculation and bounded desired replicas at their respective steps', () => {
    const result = autoscalingExample(settings)
    const render = (phase: number) => renderToStaticMarkup(<CpuScalingDiagram settings={settings} result={result} phase={phase} reducedMotion/>)
    expect(render(0)).toContain('150m average')
    expect(render(1)).toContain('ceil(2 Pods × 150% ÷ 50%) = 6')
    expect(render(2)).toContain('3 desired replicas')
    expect(render(2)).toContain('Adjusted to the configured bounds')
    expect(render(2)).toContain('not running Pods')
  })

  it('explains unavailable metrics or requests without inventing a recommendation', () => {
    for (const [next, message] of [
      [{ ...settings, metrics: 'no' }, 'Metrics unavailable'],
      [{ ...settings, requests: 'no' }, 'CPU request missing'],
    ] as const) {
      const markup = renderToStaticMarkup(<CpuScalingDiagram settings={next} result={autoscalingExample(next)} phase={2} reducedMotion/>)
      expect(markup).toContain(message)
      expect(markup).toContain('No replica recommendation from this CPU signal')
      expect(markup).not.toContain('desired replicas, not running Pods')
    }
  })

  it('reconciles Pods on workers after the bounded scale-up or scale-down decision', () => {
    const render = (next: AutoscalingSettings, phase: number) => renderToStaticMarkup(<CpuScalingDiagram settings={next} result={autoscalingExample(next)} phase={phase} reducedMotion/>)
    expect(render(settings, 2)).toContain('Starting with 2 Pods')
    const up = render({ ...settings, max: 6 }, 3)
    expect(up).toContain('Scale up: add 4 Pods')
    expect(up).toContain('orders-6')
    const down = render({ ...settings, usage: 25 }, 3)
    expect(down).toContain('Scale down: remove 1 Pod')
    expect(down).not.toContain('orders-2</b><small>Existing Pod')
    expect(render({ ...settings, usage: 25, min: 2 }, 3)).toContain('No change: keep 2 Pods')
    expect(render({ ...settings, metrics: 'no' }, 3)).toContain('No CPU recommendation: keep the two example Pods')
  })

  it('shows the illustrative below-target load before the decision without assuming scale-down', () => {
    const render = (next: AutoscalingSettings, phase: number) => renderToStaticMarkup(<CpuScalingDiagram settings={next} result={autoscalingExample(next)} phase={phase} reducedMotion/>)
    const low = { ...settings, usage: 25 }
    expect(render(low, 0)).toContain('50m target → 25m per Pod (25% utilization)')
    expect(render(low, 0)).toContain('Starting with 2 Pods')
    expect(render(low, 3)).toContain('Scale down: remove 1 Pod')
    expect(render({ ...settings, usage: 40 }, 3)).toContain('No change: keep 2 Pods')
    expect(render({ ...settings, usage: 50 }, 0)).not.toContain('Load drops below the target')
    expect(render({ ...low, metrics: 'no' }, 0)).not.toContain('Load drops below the target')
    expect(render({ ...low, requests: 'no' }, 0)).not.toContain('Load drops below the target')
  })
})
