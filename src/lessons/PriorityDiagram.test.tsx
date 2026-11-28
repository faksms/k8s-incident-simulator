import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import PriorityDiagram from './PriorityDiagram'
import { initialPrioritySettings } from './priorityModel'

describe('priority animation diagrams', () => {
  it('moves the queue head to the scheduler while keeping other pending Pods', () => {
    const markup = renderToStaticMarkup(<PriorityDiagram module="queue" settings={initialPrioritySettings} tick={6} playing={false} reducedMotion/>)
    expect(markup).toContain('Next to consider')
    expect(markup).toContain('Being considered')
    expect(markup).toContain('pod-bravo')
    expect(markup).toContain('pod-charlie')
  })

  it('shows a terminating victim before a scheduled replacement and never evicts for Never', () => {
    const props = { module: 'preemption' as const, settings: { ...initialPrioritySettings, pdb: true }, playing: false, reducedMotion: true }
    const terminating = renderToStaticMarkup(<PriorityDiagram {...props} tick={3}/>)
    const scheduled = renderToStaticMarkup(<PriorityDiagram {...props} tick={6}/>)
    const never = renderToStaticMarkup(<PriorityDiagram {...props} settings={{ ...props.settings, policy: 'Never' }} tick={6}/>)
    expect(terminating).toContain('3s remaining')
    expect(terminating).toContain('best effort')
    expect(scheduled).toContain('Scheduled')
    expect(scheduled).not.toContain('Terminating')
    expect(never).toContain('Pending · no preemption')
    expect(never).toContain('pod-charlie')
    expect(never).not.toContain('Scheduled')
  })

  it('shows priority zero when neither an explicit class nor a global default is present', () => {
    const settings = { ...initialPrioritySettings, explicit: false, globalDefault: false }
    const markup = renderToStaticMarkup(<PriorityDiagram module="inheritance" settings={settings} tick={6} playing={false} reducedMotion/>)
    expect(markup).toContain('No default · priority 0')
    expect(markup).toContain('web-1')
    expect(markup).toContain('Priority 0')
  })

  it('shows a Pod moving through admission and replicas receiving the resolved priority', () => {
    const props = { module: 'inheritance' as const, settings: initialPrioritySettings, playing: true, reducedMotion: false }
    const template = renderToStaticMarkup(<PriorityDiagram {...props} tick={0}/>)
    const admission = renderToStaticMarkup(<PriorityDiagram {...props} tick={3}/>)
    const first = renderToStaticMarkup(<PriorityDiagram {...props} tick={6}/>)
    const all = renderToStaticMarkup(<PriorityDiagram {...props} tick={8}/>)
    const manual = renderToStaticMarkup(<PriorityDiagram {...props} playing={false} reducedMotion tick={8}/>)
    expect(template).toContain('Priority not yet resolved')
    expect(admission).toContain('Priority 1000 · Resolved')
    expect(first).toContain('web-1')
    expect(first).not.toContain('web-2')
    expect(all).toContain('web-2')
    expect(all).toContain('web-3')
    expect(manual).toContain('web-3')
  })
})
