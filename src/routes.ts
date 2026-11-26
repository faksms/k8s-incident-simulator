import { learningPaths } from './learningPaths'

export type ReturnRoute = { page: 'architecture'; track?: string } | { page: 'dashboard' } | { page: 'lesson'; id: string; track?: string }
export type Route = ReturnRoute
  | { page: 'lab'; from: ReturnRoute }
  | { page: 'incidents'; index: number; guided: boolean; from: ReturnRoute }
  | { page: 'not-found' }

const home: ReturnRoute = { page: 'architecture' }

function trackMatches(track: string | null, topic: string): boolean {
  return track === null || learningPaths.some(path => path.id === track && path.topics.some(item => item.id === topic))
}

function readReturn(value: string | null, track: string | null, lessonIds: string[]): ReturnRoute | null {
  if ((value === 'architecture' || value === null) && trackMatches(track, 'architecture')) return track ? { page: 'architecture', track } : home
  if (value === 'dashboard' && track === null) return { page: 'dashboard' }
  if (value?.startsWith('lesson/') && lessonIds.includes(value.slice(7)) && trackMatches(track, value.slice(7))) return track ? { page: 'lesson', id: value.slice(7), track } : { page: 'lesson', id: value.slice(7) }
  return null
}

function writeReturn(route: ReturnRoute): string {
  return route.page === 'lesson' ? `lesson/${route.id}` : route.page
}

export function parseRoute(hash: string, lessonIds: string[], incidentCount: number): Route {
  if (!hash || hash === '#' || hash === '#/' || hash === '#home') return home
  const [path, query = ''] = hash.slice(1).split('?', 2)
  const params = new URLSearchParams(query)
  const track = params.get('track')
  if (path === '/') return readReturn('architecture', track, lessonIds) ?? { page: 'not-found' }
  if (path === '/dashboard') return { page: 'dashboard' }
  if (path.startsWith('/learn/')) {
    const id = path.slice('/learn/'.length)
    if (lessonIds.includes(id) && trackMatches(track, id)) return track ? { page: 'lesson', id, track } : { page: 'lesson', id }
  }
  if (path === '/lab') {
    const from = readReturn(params.get('from'), track, lessonIds)
    if (from) return { page: 'lab', from }
  }
  const match = /^\/incidents\/(\d+)$/.exec(path)
  if (match) {
    const index = Number(match[1])
    const mode = params.get('mode')
    const from = readReturn(params.get('from'), track, lessonIds)
    if (Number.isSafeInteger(index) && index >= 0 && index < incidentCount && (mode === null || mode === 'guided' || mode === 'independent') && from) {
      return { page: 'incidents', index, guided: mode !== 'independent', from }
    }
  }
  return { page: 'not-found' }
}

export function routeHash(route: Exclude<Route, { page: 'not-found' }>): string {
  if (route.page === 'architecture') return route.track ? `#/?${new URLSearchParams({ track: route.track })}` : '#/'
  if (route.page === 'dashboard') return '#/dashboard'
  if (route.page === 'lesson') return `#/learn/${route.id}${route.track ? `?${new URLSearchParams({ track: route.track })}` : ''}`
  const params = new URLSearchParams({ from: writeReturn(route.from) })
  if (route.from.page !== 'dashboard' && route.from.track) params.set('track', route.from.track)
  if (route.page === 'lab') return `#/lab?${params}`
  params.set('mode', route.guided ? 'guided' : 'independent')
  return `#/incidents/${route.index}?${params}`
}
