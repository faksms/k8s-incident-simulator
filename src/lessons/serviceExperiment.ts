export type ServicePod = { name: string; ready: boolean; labels: boolean }

export function estimateServiceTraffic(pods: ServicePod[], incoming: number, capacityPerPod: number) {
  const readyEndpoints = pods.filter(pod => pod.ready && pod.labels).length
  const capacity = readyEndpoints * capacityPerPod
  const served = Math.min(incoming, capacity)
  return {
    readyEndpoints,
    capacity,
    offeredPerPod: readyEndpoints ? incoming / readyEndpoints : 0,
    served,
    unserved: incoming - served,
  }
}
