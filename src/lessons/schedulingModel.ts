export type SchedulingSettings = {
  cpu: 1 | 3
  disk: 'any' | 'ssd' | 'hdd'
  requiredZone: 'any' | 'east' | 'west'
  preferWest: boolean
  tolerateGpu: boolean
}

export const initialSchedulingSettings: SchedulingSettings = {
  cpu: 1, disk: 'any', requiredZone: 'any', preferWest: false, tolerateGpu: false,
}

export const schedulingNodes = [
  { name: 'worker-east', zone: 'east', disk: 'ssd', availableCpu: 2, gpuTaint: false },
  { name: 'worker-west', zone: 'west', disk: 'ssd', availableCpu: 2, gpuTaint: true },
  { name: 'worker-north', zone: 'east', disk: 'hdd', availableCpu: 1, gpuTaint: false },
] as const

export function evaluateScheduling(settings: SchedulingSettings) {
  const nodes = schedulingNodes.map(node => {
    const reasons: string[] = []
    if (node.availableCpu < settings.cpu) reasons.push('Not enough CPU available')
    if (settings.disk !== 'any' && settings.disk !== node.disk) reasons.push('Disk label does not match')
    if (settings.requiredZone !== 'any' && settings.requiredZone !== node.zone) reasons.push('Required zone does not match')
    if (node.gpuTaint && !settings.tolerateGpu) reasons.push('Untolerated gpu NoSchedule taint')
    return { ...node, reasons, score: settings.preferWest && node.zone === 'west' ? 1 : 0 }
  })
  const candidates = nodes.filter(node => node.reasons.length === 0)
  const selected = candidates.reduce<(typeof nodes)[number] | null>(
    (best, node) => !best || node.score > best.score ? node : best, null,
  )
  return { nodes, selected }
}
