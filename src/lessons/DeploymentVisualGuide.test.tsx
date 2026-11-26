import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import DeploymentVisualGuide from './DeploymentVisualGuide'
import { deploymentExampleManifest, deploymentManifestSections } from './deploymentManifest'
import { materials } from '../LearningMaterials'

describe('Deployment visual guide', () => {
  it('uses the same complete manifest for the interactive sections and copyable field notes', () => {
    expect(deploymentManifestSections.map(section => section.yaml).join('\n')).toBe(deploymentExampleManifest)
    expect(materials.deployments.example).toBe(deploymentExampleManifest)
    expect(deploymentExampleManifest).toContain('selector:\n    matchLabels:\n      app: web')
    expect(deploymentExampleManifest).toContain('template:\n    metadata:\n      labels:\n        app: web')
  })

  it('renders selectable YAML sections, resource layers, and the Service selector experiment', () => {
    const markup = renderToStaticMarkup(<DeploymentVisualGuide/>)
    for (const section of deploymentManifestSections) expect(markup).toContain(section.title)
    expect(markup).toContain('Deployment resource relationships')
    expect(markup).toContain('ReplicaSet')
    expect(markup).toContain('Try a mismatched selector')
    expect(markup).toContain('3 matching Ready endpoints')
  })
})
