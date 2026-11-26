import { describe, expect, it } from 'vitest'
import { estimateServiceTraffic } from './serviceExperiment'

const pods = [
  { name: 'one', ready: true, labels: true },
  { name: 'two', ready: true, labels: true },
  { name: 'three', ready: false, labels: true },
]

describe('Service traffic experiment', () => {
  it('uses only matching and ready Pods and estimates overload', () => {
    expect(estimateServiceTraffic(pods, 900, 200)).toEqual({
      readyEndpoints: 2, capacity: 400, offeredPerPod: 450, served: 400, unserved: 500,
    })
    expect(estimateServiceTraffic([{ ...pods[0], labels: false }, ...pods.slice(1)], 300, 200))
      .toEqual({ readyEndpoints: 1, capacity: 200, offeredPerPod: 300, served: 200, unserved: 100 })
  })

  it('handles no ready endpoints and zero traffic without dividing by zero', () => {
    expect(estimateServiceTraffic(pods.map(pod => ({ ...pod, ready: false })), 300, 200))
      .toEqual({ readyEndpoints: 0, capacity: 0, offeredPerPod: 0, served: 0, unserved: 300 })
    expect(estimateServiceTraffic(pods, 0, 200))
      .toEqual({ readyEndpoints: 2, capacity: 400, offeredPerPod: 0, served: 0, unserved: 0 })
  })
})
