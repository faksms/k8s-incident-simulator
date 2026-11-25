import { describe, expect, it } from 'vitest'
import { pathSegments, routeBetween, simplifyRoute } from './architectureRouting'
import type { RoutingRect } from './architectureRouting'

function points(path: string) {
  return Array.from(path.matchAll(/[ML] ([\d.-]+) ([\d.-]+)/g), match => ({ x: Number(match[1]), y: Number(match[2]) }))
}

function onEdge(point: { x: number; y: number }, rect: RoutingRect) {
  return ((point.x === rect.left || point.x === rect.right) && point.y >= rect.top && point.y <= rect.bottom)
    || ((point.y === rect.top || point.y === rect.bottom) && point.x >= rect.left && point.x <= rect.right)
}

describe('architecture connection routing', () => {
  it('connects card edges without crossing other cards, in either direction', () => {
    const left = { left: 10, top: 40, right: 40, bottom: 80 }
    const right = { left: 150, top: 40, right: 180, bottom: 80 }
    const blockers = [
      { left: 60, top: 0, right: 90, bottom: 90 },
      { left: 100, top: 30, right: 130, bottom: 120 },
    ]
    for (const [from, to] of [[left, right], [right, left]]) {
      const path = points(routeBetween(from, to, [left, right, ...blockers]))
      expect(path.length).toBeGreaterThan(2)
      expect(onEdge(path[0], from)).toBe(true)
      expect(onEdge(path[path.length - 1], to)).toBe(true)
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1]
        const b = path[i]
        expect(a.x === b.x || a.y === b.y).toBe(true)
        for (const rect of [left, right, ...blockers]) {
          const crosses = a.x === b.x
            ? a.x > rect.left && a.x < rect.right && Math.max(a.y, b.y) > rect.top && Math.min(a.y, b.y) < rect.bottom
            : a.y > rect.top && a.y < rect.bottom && Math.max(a.x, b.x) > rect.left && Math.min(a.x, b.x) < rect.right
          expect(crosses).toBe(false)
        }
      }
    }
  })

  it('keeps traffic routes from overlapping an existing control route', () => {
    const left = { left: 0, top: 20, right: 20, bottom: 40 }
    const right = { left: 120, top: 20, right: 140, bottom: 40 }
    const control = { from: { x: 20, y: 30 }, to: { x: 120, y: 30 } }
    const segments = pathSegments(routeBetween(left, right, [left, right], [control]))

    expect(segments.length).toBeGreaterThan(0)
    for (const segment of segments) {
      const { from, to } = segment
      const overlaps = from.y === control.from.y && to.y === control.to.y
        && Math.min(Math.max(from.x, to.x), control.to.x) > Math.max(Math.min(from.x, to.x), control.from.x)
      const crosses = from.x === to.x && from.x >= control.from.x && from.x <= control.to.x
        && Math.min(from.y, to.y) <= control.from.y && Math.max(from.y, to.y) >= control.from.y
      expect(overlaps || crosses).toBe(false)
    }
  })

  it('connects to the requested sides and distinct positions on a shared component', () => {
    const first = { left: 0, top: 0, right: 30, bottom: 30 }
    const second = { left: 0, top: 70, right: 30, bottom: 100 }
    const api = { left: 60, top: 0, right: 90, bottom: 100 }
    const cards = [first, second, api]
    const top = points(routeBetween(first, api, cards, [], { from: { side: 'right' }, to: { side: 'left', offset: 0.15 } }))
    const bottom = points(routeBetween(second, api, cards, [], { from: { side: 'right' }, to: { side: 'left', offset: 0.85 } }))

    expect(top[0]).toEqual({ x: first.right, y: 15 })
    expect(top[top.length - 1]).toEqual({ x: api.left, y: 15 })
    expect(bottom[0]).toEqual({ x: second.right, y: 85 })
    expect(bottom[bottom.length - 1]).toEqual({ x: api.left, y: 85 })
    expect(top).toHaveLength(2)
    expect(bottom).toHaveLength(2)
  })

  it('approaches a destination in a straight line with room for its arrowhead', () => {
    const source = { left: 100, top: 40, right: 130, bottom: 60 }
    const target = { left: 0, top: 0, right: 60, bottom: 50 }
    const route = points(routeBetween(source, target, [source, target], [], { to: { side: 'bottom' } }))
    const before = route[route.length - 2]
    const end = route[route.length - 1]

    expect(end).toEqual({ x: 30, y: 50 })
    expect(before.x).toBe(end.x)
    expect(before.y - end.y).toBeGreaterThanOrEqual(14)
  })

  it('connects directly when adjacent cards leave less room than the preferred approach', () => {
    const source = { left: 0, top: 0, right: 30, bottom: 30 }
    const target = { left: 42, top: 0, right: 72, bottom: 30 }
    const route = points(routeBetween(source, target, [source, target], [], { from: { side: 'right' }, to: { side: 'left' } }))

    expect(route).toEqual([{ x: 30, y: 15 }, { x: 42, y: 15 }])
  })

  it('prefers a clearer destination side over a turn immediately beside another card', () => {
    const source = { left: 0, top: 0, right: 30, bottom: 30 }
    const blocker = { left: 46, top: 0, right: 50, bottom: 30 }
    const target = { left: 60, top: 0, right: 100, bottom: 30 }
    const route = points(routeBetween(source, target, [source, blocker, target]))
    const before = route[route.length - 2]
    const end = route[route.length - 1]

    expect(Math.abs(before.x - end.x) + Math.abs(before.y - end.y)).toBeGreaterThanOrEqual(12)
  })

  it('preserves corners when nearly identical coordinates occur at adjacent bends', () => {
    const path = simplifyRoute([
      { x: 10, y: 0 }, { x: 10, y: 4 }, { x: 10.000007, y: 4 },
      { x: 10.000007, y: 20 }, { x: 30, y: 20 }, { x: 30, y: 40 },
    ])
    expect(path).toHaveLength(4)
    for (let i = 1; i < path.length; i++) {
      expect(Math.abs(path[i].x - path[i - 1].x) < 0.01 || Math.abs(path[i].y - path[i - 1].y) < 0.01).toBe(true)
    }
  })

  it('recognizes a near-vertical control line when routing traffic around it', () => {
    const left = { left: 0, top: 0, right: 20, bottom: 20 }
    const right = { left: 100, top: 0, right: 120, bottom: 20 }
    const control = { from: { x: 60, y: 0 }, to: { x: 60.000001, y: 20 } }
    const segments = pathSegments(routeBetween(left, right, [left, right], [control, control, control]))

    expect(segments.length).toBeGreaterThan(0)
    for (const { from, to } of segments) {
      const crosses = Math.abs(from.y - to.y) < 0.01 && from.y >= 0 && from.y <= 20
        && Math.min(from.x, to.x) <= 60 && Math.max(from.x, to.x) >= 60
      expect(crosses).toBe(false)
    }
  })
})
