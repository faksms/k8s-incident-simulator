import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ServiceVisualGuide from './ServiceVisualGuide'
import { serviceExampleManifest, serviceManifestSections } from './serviceManifest'
import { materials } from '../LearningMaterials'

describe('Service visual guide', () => {
  it('shares the complete illustrated manifest with the field notes', () => {
    expect(serviceManifestSections.map(section => section.yaml).join('\n')).toBe(serviceExampleManifest)
    expect(materials.services.example).toBe(serviceExampleManifest)
    expect(serviceExampleManifest).toContain('app: api\n    tier: frontend')
    expect(serviceExampleManifest).toContain('port: 80\n      targetPort: 8080\n      nodePort: 30080')
  })

  it('presents the initial backend and interactive controls', () => {
    const markup = renderToStaticMarkup(<ServiceVisualGuide/>)
    expect(markup).toContain('10.42.0.11:8080')
    expect(markup).toContain('ready: true')
    expect(markup).toContain('Change tier label')
    expect(markup).toContain('Replace Pod')
    expect(markup).toContain('LoadBalancer')
  })
})
