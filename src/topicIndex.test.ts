import { describe, expect, it } from 'vitest'
import { courseLessonIds, matchesTopic } from './KubernetesCourse'
import { extendedLessons } from './ExtendedLessons'
import { courseChapters, filterTopics, flattenTopics } from './courseCatalog'

describe('topic index', () => {
  const storage = extendedLessons.find(lesson => lesson.id === 'storage')!

  it('finds topics by case-insensitive concepts and keywords', () => {
    expect(matchesTopic('  pvc ', storage.title, storage.body, storage.material, storage.keywords)).toBe(true)
    expect(matchesTopic('RECLAIM POLICY', storage.title, storage.body, storage.material, storage.keywords)).toBe(true)
    expect(matchesTopic('unrelated phrase', storage.title, storage.body, storage.material, storage.keywords)).toBe(false)
  })

  it('shows topics for an empty search', () => {
    expect(matchesTopic('   ', storage.title, storage.body, storage.material, storage.keywords)).toBe(true)
  })

  it('keeps parent topics for nested search results without unrelated siblings', () => {
    const workloads = courseChapters.find(chapter => chapter.id === 'workloads')!
    const filtered = filterTopics(workloads.topics, id => id === 'probes')
    expect(flattenTopics(filtered)).toEqual(['pods', 'probes'])
  })

  it('includes children when their parent matches', () => {
    const workloads = courseChapters.find(chapter => chapter.id === 'workloads')!
    expect(flattenTopics(filterTopics(workloads.topics, id => id === 'pods'))).toEqual(['pods', 'probes', 'resource-requests'])
  })

  it('lists every lesson once in the chapter navigation', () => {
    const ids = courseChapters.flatMap(chapter => flattenTopics(chapter.topics))
    expect(ids[0]).toBe('architecture')
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.slice(1).sort()).toEqual([...courseLessonIds].sort())
  })
})
