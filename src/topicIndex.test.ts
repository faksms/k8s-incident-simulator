import { describe, expect, it } from 'vitest'
import { matchesTopic } from './KubernetesCourse'
import { extendedLessons } from './ExtendedLessons'

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
})
