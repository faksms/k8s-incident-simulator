import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { courseChapters, flattenTopics } from '../courseCatalog'
import TerminologyGuide, { filterGlossary, glossary } from './TerminologyGuide'

describe('terminology guide', () => {
  it('searches names and explanations without case or surrounding-space sensitivity', () => {
    expect(filterGlossary('  rEpLiCaSeT  ').flatMap(group => group.terms.map(term => term.name))).toContain('Deployment')
    expect(filterGlossary('DNS').flatMap(group => group.terms.map(term => term.name))).toContain('ExternalName')
    expect(filterGlossary('not-a-kubernetes-term')).toEqual([])
    expect(filterGlossary(' ').flatMap(group => group.terms)).toHaveLength(glossary.flatMap(group => group.terms).length)
  })

  it('connects each glossary topic to a real course lesson and renders the guide', () => {
    const topics = courseChapters.flatMap(chapter => flattenTopics(chapter.topics))
    for (const term of glossary.flatMap(group => group.terms)) {
      if (term.topic) expect(topics, term.name).toContain(term.topic)
    }
    const markup = renderToStaticMarkup(<TerminologyGuide onTopic={() => {}}/>)
    expect(markup).toContain('Deployment manifest')
    expect(markup).toContain('ClusterIP Service manifest')
    expect(markup).toContain('NodePort')
    expect(markup).toContain('LoadBalancer')
  })
})
