import { describe, expect, it } from 'vitest'
import { parseRoute, routeHash } from './routes'
import type { Route } from './routes'

describe('shareable routes', () => {
  const lessons = ['pods', 'dns']
  it('round-trips lessons, labs, incidents, and their return destinations', () => {
    const routes: Exclude<Route, { page: 'not-found' }>[] = [
      { page: 'architecture' }, { page: 'dashboard' }, { page: 'lesson', id: 'pods' },
      { page: 'architecture', track: 'beginner' }, { page: 'lesson', id: 'pods', track: 'beginner' },
      { page: 'lab', from: { page: 'lesson', id: 'dns' } },
      { page: 'lab', from: { page: 'lesson', id: 'pods', track: 'beginner' } },
      { page: 'incidents', index: 2, guided: false, from: { page: 'dashboard' } },
      { page: 'incidents', index: 2, guided: true, from: { page: 'lesson', id: 'pods', track: 'beginner' } },
    ]
    for (const route of routes) expect(parseRoute(routeHash(route), lessons, 13)).toEqual(route)
  })

  it('rejects unknown lessons, return destinations, and incident numbers', () => {
    expect(parseRoute('#/learn/missing', lessons, 13)).toEqual({ page: 'not-found' })
    expect(parseRoute('#/incidents/13', lessons, 13)).toEqual({ page: 'not-found' })
    expect(parseRoute('#/lab?from=lesson%2Fmissing', lessons, 13)).toEqual({ page: 'not-found' })
    expect(parseRoute('#/learn/pods?track=operator', lessons, 13)).toEqual({ page: 'not-found' })
    expect(parseRoute('#/lab?from=lesson%2Fpods&track=operator', lessons, 13)).toEqual({ page: 'not-found' })
    expect(parseRoute('', lessons, 13)).toEqual({ page: 'architecture' })
  })
})
