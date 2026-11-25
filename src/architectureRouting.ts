export type RoutingRect = { left: number; top: number; right: number; bottom: number }
type Point = { x: number; y: number }
export type RoutingSegment = { from: Point; to: Point }
export type RoutingPort = { side: 'top' | 'right' | 'bottom' | 'left'; offset?: number }

const clearance = 4
const arrowApproach = 14

export function simplifyRoute(points: Point[]): Point[] {
  const corners: Point[] = []
  const same = (a: number, b: number) => Math.abs(a - b) < 0.01
  for (const point of points) {
    const last = corners[corners.length - 1]
    if (last && same(last.x, point.x) && same(last.y, point.y)) {
      corners[corners.length - 1] = point
      continue
    }
    while (corners.length >= 2) {
      const previous = corners[corners.length - 2]
      const current = corners[corners.length - 1]
      if (!((same(previous.x, current.x) && same(current.x, point.x)) || (same(previous.y, current.y) && same(current.y, point.y)))) break
      corners.pop()
    }
    corners.push(point)
  }
  return corners
}

export function routeBetween(from: RoutingRect, to: RoutingRect, cards: RoutingRect[], avoid: RoutingSegment[] = [], selectedPorts: { from?: RoutingPort; to?: RoutingPort } = {}): string {
  const obstacles = cards.map(rect => ({
    left: rect.left - clearance, right: rect.right + clearance,
    top: rect.top - clearance, bottom: rect.bottom + clearance,
  }))
  const ports = (rect: RoutingRect, selected?: RoutingPort, approach = clearance): { edge: Point; outside: Point }[] => {
    const offset = selected?.offset ?? 0.5
    const x = rect.left + (rect.right - rect.left) * offset
    const y = rect.top + (rect.bottom - rect.top) * offset
    const edges = {
      top: { edge: { x, y: rect.top }, dx: 0, dy: -1 },
      right: { edge: { x: rect.right, y }, dx: 1, dy: 0 },
      bottom: { edge: { x, y: rect.bottom }, dx: 0, dy: 1 },
      left: { edge: { x: rect.left, y }, dx: -1, dy: 0 },
    }
    return (selected ? [edges[selected.side]] : Object.values(edges)).flatMap(({ edge, dx, dy }) => {
      let distance = approach
      cards.forEach((card, index) => {
        if (card.left === rect.left && card.right === rect.right && card.top === rect.top && card.bottom === rect.bottom) return
        const obstacle = obstacles[index]
        if (dx === 0 && edge.x > obstacle.left && edge.x < obstacle.right) {
          if (dy < 0 && obstacle.top < edge.y) distance = Math.min(distance, Math.max(0, edge.y - obstacle.bottom))
          if (dy > 0 && obstacle.bottom > edge.y) distance = Math.min(distance, Math.max(0, obstacle.top - edge.y))
        } else if (dy === 0 && edge.y > obstacle.top && edge.y < obstacle.bottom) {
          if (dx < 0 && obstacle.left < edge.x) distance = Math.min(distance, Math.max(0, edge.x - obstacle.right))
          if (dx > 0 && obstacle.right > edge.x) distance = Math.min(distance, Math.max(0, obstacle.left - edge.x))
        }
      })
      if (distance < clearance - 0.001) return []
      return [{ edge, outside: { x: edge.x + dx * distance, y: edge.y + dy * distance } }]
    })
  }
  const starts = ports(from, selectedPorts.from)
  const ends = ports(to, selectedPorts.to, arrowApproach)
  const xs = Array.from(new Set([...obstacles.flatMap(rect => [rect.left, rect.right]), ...starts.map(port => port.outside.x), ...ends.map(port => port.outside.x), ...avoid.flatMap(segment => [segment.from.x - clearance * 2, segment.from.x + clearance * 2, segment.to.x - clearance * 2, segment.to.x + clearance * 2])])).sort((a, b) => a - b)
  const ys = Array.from(new Set([...obstacles.flatMap(rect => [rect.top, rect.bottom]), ...starts.map(port => port.outside.y), ...ends.map(port => port.outside.y), ...avoid.flatMap(segment => [segment.from.y - clearance * 2, segment.from.y + clearance * 2, segment.to.y - clearance * 2, segment.to.y + clearance * 2])])).sort((a, b) => a - b)
  const isClear = (a: Point, b: Point) => obstacles.every(rect =>
    a.x === b.x
      ? a.x <= rect.left || a.x >= rect.right || Math.max(a.y, b.y) <= rect.top || Math.min(a.y, b.y) >= rect.bottom
      : a.y <= rect.top || a.y >= rect.bottom || Math.max(a.x, b.x) <= rect.left || Math.min(a.x, b.x) >= rect.right,
  )
  const crossingCost = (a: Point, b: Point) => avoid.reduce((cost, segment) => {
    const c = segment.from
    const d = segment.to
    const vertical = a.x === b.x
    const otherVertical = Math.abs(c.x - d.x) < 0.01
    if (vertical === otherVertical) {
      const aligned = vertical ? Math.abs(a.x - c.x) < 0.1 : Math.abs(a.y - c.y) < 0.1
      const overlap = vertical
        ? Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y)) - Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y))
        : Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x)) - Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x))
      return cost + (aligned && overlap > 0.1 ? 1000 : 0)
    }
    const v1 = vertical ? a : c
    const v2 = vertical ? b : d
    const h1 = vertical ? c : a
    const h2 = vertical ? d : b
    const crosses = v1.x >= Math.min(h1.x, h2.x) && v1.x <= Math.max(h1.x, h2.x)
      && h1.y >= Math.min(v1.y, v2.y) && h1.y <= Math.max(v1.y, v2.y)
    return cost + (crosses ? 20 : 0)
  }, 0)
  const key = (x: number, y: number) => y * xs.length + x
  const distance = new Map<number, number>()
  const previous = new Map<number, number>()
  const origins = new Map<number, Point>()
  const queue: { id: number; cost: number }[] = []
  for (const port of starts) {
    const id = key(xs.indexOf(port.outside.x), ys.indexOf(port.outside.y))
    const cost = crossingCost(port.edge, port.outside)
    distance.set(id, cost)
    origins.set(id, port.edge)
    queue.push({ id, cost })
  }
  const targets = new Map(ends.map(port => {
    const approach = Math.abs(port.outside.x - port.edge.x) + Math.abs(port.outside.y - port.edge.y)
    const direct = starts.some(start => {
      const aligned = (start.edge.x === port.edge.x && start.outside.x === port.outside.x)
        || (start.edge.y === port.edge.y && start.outside.y === port.outside.y)
      const facing = (start.outside.x - start.edge.x) * (port.edge.x - start.edge.x)
        + (start.outside.y - start.edge.y) * (port.edge.y - start.edge.y) > 0
        && (port.outside.x - port.edge.x) * (start.edge.x - port.edge.x)
        + (port.outside.y - port.edge.y) * (start.edge.y - port.edge.y) > 0
      return aligned && facing && isClear(start.outside, port.outside)
    })
    return [key(xs.indexOf(port.outside.x), ys.indexOf(port.outside.y)), {
      edge: port.edge, cost: crossingCost(port.outside, port.edge) + (direct ? 0 : Math.max(0, 12 - approach) * 20),
    }] as const
  }))
  let destination: number | undefined
  let bestCost = Infinity
  while (queue.length) {
    queue.sort((a, b) => b.cost - a.cost)
    const current = queue.pop()!
    if (current.cost !== distance.get(current.id)) continue
    if (current.cost >= bestCost) break
    const target = targets.get(current.id)
    if (target && current.cost + target.cost < bestCost) {
      destination = current.id
      bestCost = current.cost + target.cost
    }
    const x = current.id % xs.length
    const y = Math.floor(current.id / xs.length)
    for (const [nextX, nextY] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nextX < 0 || nextY < 0 || nextX >= xs.length || nextY >= ys.length) continue
      const a = { x: xs[x], y: ys[y] }
      const b = { x: xs[nextX], y: ys[nextY] }
      if (!isClear(a, b)) continue
      const next = key(nextX, nextY)
      const target = targets.get(next)
      if (target && (a.x - b.x) * (target.edge.x - b.x) + (a.y - b.y) * (target.edge.y - b.y) > 0) continue
      const cost = current.cost + Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + crossingCost(a, b)
      if (cost >= (distance.get(next) ?? Infinity)) continue
      distance.set(next, cost)
      previous.set(next, current.id)
      queue.push({ id: next, cost })
    }
  }
  if (destination === undefined) return ''
  const points: Point[] = [targets.get(destination)!.edge]
  let current = destination
  while (true) {
    points.push({ x: xs[current % xs.length], y: ys[Math.floor(current / xs.length)] })
    const parent = previous.get(current)
    if (parent === undefined) break
    current = parent
  }
  points.push(origins.get(current)!)
  points.reverse()
  return simplifyRoute(points).map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')
}

export function pathSegments(path: string): RoutingSegment[] {
  const points = Array.from(path.matchAll(/[ML] ([\d.-]+) ([\d.-]+)/g), match => ({ x: Number(match[1]), y: Number(match[2]) }))
  return points.slice(1).map((point, index) => ({ from: points[index], to: point }))
}
