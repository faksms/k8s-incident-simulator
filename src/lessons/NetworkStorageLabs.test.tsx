import { describe, expect, it } from 'vitest'
import {
  networkStorageLessonLabs,
  resolveGatewayExample,
  resolvePolicyExample,
  resolveProvisioningExample,
  resolveServiceExample,
} from './NetworkStorageLabs'

describe('topic-specific network and storage lab decisions', () => {
  it('distinguishes internal Service reachability from externally provisioned exposure', () => {
    const healthyLoadBalancer = {
      type: 'LoadBalancer' as const,
      client: 'outside' as const,
      selectorMatches: true,
      endpointReady: true,
      externalPathReady: false,
    }

    expect(resolveServiceExample(healthyLoadBalancer)).toEqual({ status: 'blocked', reason: 'external-path' })
    expect(resolveServiceExample({ ...healthyLoadBalancer, externalPathReady: true })).toEqual({ status: 'reachable', reason: 'ready' })
    expect(resolveServiceExample({ ...healthyLoadBalancer, type: 'ClusterIP', externalPathReady: true })).toEqual({ status: 'blocked', reason: 'cluster-ip' })
    expect(resolveServiceExample({ ...healthyLoadBalancer, client: 'inside', selectorMatches: false })).toEqual({ status: 'blocked', reason: 'selector' })
  })

  it('requires both isolated directions to allow a connection and reports missing enforcement', () => {
    const base = { ingressIsolated: true, ingressAllows: true, egressIsolated: true, egressAllows: true, pluginEnforces: true }
    expect(resolvePolicyExample(base)).toEqual({ status: 'allowed', reason: 'allowed' })
    expect(resolvePolicyExample({ ...base, ingressAllows: false })).toEqual({ status: 'blocked', reason: 'ingress' })
    expect(resolvePolicyExample({ ...base, ingressAllows: false, egressAllows: false })).toEqual({ status: 'blocked', reason: 'both' })
    expect(resolvePolicyExample({ ...base, ingressAllows: false, pluginEnforces: false })).toEqual({ status: 'not-enforced', reason: 'plugin' })
  })

  it('routes only after the Gateway, parent, listener, backend, and endpoints are ready', () => {
    const ready = { controllerReady: true, routeAttached: true, listenerMatches: true, backendConfigured: true, endpointsReady: true }
    expect(resolveGatewayExample(ready)).toEqual({ status: 'routed', reason: 'ready' })
    expect(resolveGatewayExample({ ...ready, controllerReady: false })).toEqual({ status: 'waiting', reason: 'controller' })
    expect(resolveGatewayExample({ ...ready, listenerMatches: false })).toEqual({ status: 'waiting', reason: 'listener' })
    expect(resolveGatewayExample({ ...ready, endpointsReady: false })).toEqual({ status: 'waiting', reason: 'endpoints' })
  })

  it('accounts for claim fit, delayed binding, reclaim policy, and backup separately', () => {
    const waiting = {
      classMatches: true,
      provisionerReady: true,
      accessMatches: true,
      waitForConsumer: true,
      consumerScheduled: false,
      reclaimPolicy: 'Delete' as const,
      backupExists: false,
    }
    expect(resolveProvisioningExample(waiting)).toMatchObject({
      status: 'pending', reason: 'consumer', deletion: 'backing-storage-may-be-removed', backup: 'no-backup',
    })
    expect(resolveProvisioningExample({ ...waiting, consumerScheduled: true })).toMatchObject({ status: 'bound', reason: 'ready' })
    expect(resolveProvisioningExample({ ...waiting, classMatches: false, reclaimPolicy: 'Retain', backupExists: true })).toMatchObject({
      status: 'pending', reason: 'class', deletion: 'kept-for-manual-handling', backup: 'separate-backup-exists',
    })
  })

  it('exports a component for each requested lesson ID', () => {
    expect(Object.keys(networkStorageLessonLabs).sort()).toEqual(['gateway', 'network-policy', 'provisioning', 'service-types'])
  })
})
