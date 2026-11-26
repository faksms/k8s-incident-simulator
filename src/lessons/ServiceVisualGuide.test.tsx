import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ServiceVisualGuide from './ServiceVisualGuide'
import ServiceAccessDiagram from './ServiceAccessDiagram'
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

  it('shows three Pod replicas and the appropriate entry points for each architecture', () => {
    const cluster = renderToStaticMarkup(<ServiceAccessDiagram exposure="ClusterIP"/>)
    const nodePort = renderToStaticMarkup(<ServiceAccessDiagram exposure="NodePort"/>)
    const loadBalancer = renderToStaticMarkup(<ServiceAccessDiagram exposure="LoadBalancer"/>)
    for (const diagram of [cluster, nodePort, loadBalancer]) {
      expect(diagram).toContain('ReplicaSet · api')
      expect(diagram).toContain('Service selects the Pods, not the ReplicaSet')
      for (const node of [1, 2, 3]) {
        expect(diagram).toContain(`Node ${node}`)
        expect(diagram).toContain(`Pod · api-${node}`)
      }
    }
    expect(cluster).toContain('In-cluster client')
    expect(cluster).not.toContain('External client')
    expect(nodePort).toContain('NodePort entry on each node')
    expect(nodePort).toContain('Service forwarding')
    expect(loadBalancer).toContain('Provider load balancer')
    expect(loadBalancer).toContain('provider-specific')
    expect(loadBalancer).not.toContain('NodePort entry on each node')
  })
})
