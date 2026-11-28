import { describe, expect, it } from 'vitest'
import { autoscalingExample, bootstrapExample, extensionExample, lifecycleExample, operatorExample, packagingExample } from './AdministrationLabs'

describe('administration simulations', () => {
  it('distinguishes joining a worker from installing Pod networking', () => {
    const settings = { prepared: 'yes', initialized: 'yes', cni: 'no', joined: 'yes' } as const
    expect(bootstrapExample(settings)).toEqual({ controlPlane: true, workerJoined: true, networkConfigured: false })
    expect(bootstrapExample({ ...settings, cni: 'yes' }).networkConfigured).toBe(true)
    expect(bootstrapExample({ ...settings, prepared: 'no' })).toEqual({ controlPlane: false, workerJoined: false, networkConfigured: false })
  })

  it('separates etcd quorum, tested backup, and drain safeguards', () => {
    const settings = { healthy: 3, maintenance: 'yes', backup: 'no', pdb: 'yes' } as const
    expect(lifecycleExample(settings)).toEqual({ remaining: 2, quorum: true, drainAllowed: true, backupReady: false })
    expect(lifecycleExample({ ...settings, healthy: 2, backup: 'yes', pdb: 'no' })).toEqual({ remaining: 1, quorum: false, drainAllowed: false, backupReady: true })
    expect(lifecycleExample({ ...settings, healthy: 2, maintenance: 'no' }).quorum).toBe(true)
  })

  it('distinguishes runtime, networking and storage failures', () => {
    const settings = { cri: 'yes', cni: 'yes', csi: 'yes' } as const
    expect(extensionExample({ ...settings, cni: 'no' })).toEqual({ runtime: true, network: false, storage: true })
    expect(extensionExample({ ...settings, cri: 'no' })).toEqual({ runtime: false, network: false, storage: true })
    expect(extensionExample({ ...settings, csi: 'no' })).toEqual({ runtime: true, network: true, storage: false })
  })

  it('renders environment settings while distinguishing release history', () => {
    expect(packagingExample({ tool: 'helm', environment: 'development' })).toEqual({ replicas: 1, source: 'Chart + values', history: 'Helm release revisions' })
    expect(packagingExample({ tool: 'kustomize', environment: 'production' })).toEqual({ replicas: 3, source: 'Base + overlay', history: 'No Kustomize release history' })
  })

  it('requires both a registered type and a controller for reconciliation', () => {
    const settings = { crd: 'yes', controller: 'no', desired: 3 } as const
    expect(operatorExample(settings)).toEqual({ accepted: true, reconciles: false, observed: 1 })
    expect(operatorExample({ ...settings, controller: 'yes' })).toEqual({ accepted: true, reconciles: true, observed: 3 })
    expect(operatorExample({ ...settings, crd: 'no', controller: 'yes' })).toEqual({ accepted: false, reconciles: false, observed: 1 })
    expect(operatorExample({ ...settings, controller: 'yes', desired: 1 }).observed).toBe(1)
  })

  it('calculates CPU replicas, applies limits, and requires a CPU signal', () => {
    const settings = { metrics: 'yes', requests: 'yes', usage: 150, min: 1, max: 3 } as const
    expect(autoscalingExample(settings)).toEqual({ raw: 6, desired: 3 })
    expect(autoscalingExample({ ...settings, max: 6 })).toEqual({ raw: 6, desired: 6 })
    expect(autoscalingExample({ ...settings, usage: 25, min: 2 })).toEqual({ raw: 1, desired: 2 })
    expect(autoscalingExample({ ...settings, usage: 50 })).toEqual({ raw: 2, desired: 2 })
    expect(autoscalingExample({ ...settings, usage: 65, max: 5 })).toEqual({ raw: 3, desired: 3 })
    expect(autoscalingExample({ ...settings, usage: 0, min: 2 })).toEqual({ raw: 0, desired: 2 })
    expect(autoscalingExample({ ...settings, usage: 200, max: 5 })).toEqual({ raw: 8, desired: 5 })
    expect(autoscalingExample({ ...settings, metrics: 'no' })).toEqual({ raw: null, desired: null })
    expect(autoscalingExample({ ...settings, requests: 'no' })).toEqual({ raw: null, desired: null })
  })
})
