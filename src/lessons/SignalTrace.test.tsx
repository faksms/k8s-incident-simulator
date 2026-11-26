import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import SignalTrace from './SignalTrace'

describe('animated path narration', () => {
  it('explains the highlighted step using the supplied simulation state', () => {
    const render = (detail: string) => renderToStaticMarkup(<SignalTrace title="TEST PATH" steps={[
      { label: 'Placement', detail },
      { label: 'Running', detail: 'The workload is running.' },
    ]}/>)

    const pending = render('The Pod is Pending.')
    const admitted = render('The Pod fits on the node.')
    expect(pending).toContain('WHAT THE HIGHLIGHT SHOWS · Placement')
    expect(pending).toContain('The Pod is Pending.')
    expect(pending).not.toContain('The workload is running.')
    expect(admitted).toContain('The Pod fits on the node.')
    expect(admitted).not.toContain('The Pod is Pending.')
  })
})
