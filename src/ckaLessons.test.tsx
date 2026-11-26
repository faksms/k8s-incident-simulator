import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ckaLessons } from './ckaLessons'
import { extendedLessons } from './ExtendedLessons'
import { specializedLessonScenes } from './KubernetesCourse'
import { courseChapters, flattenTopics } from './courseCatalog'

describe('CKA topic lessons', () => {
  it('connects each lesson to the course index and a topic-specific interactive scene', () => {
    const indexed = courseChapters.flatMap(chapter => flattenTopics(chapter.topics))
    for (const lesson of ckaLessons) {
      expect(indexed.filter(id => id === lesson.id)).toHaveLength(1)
      expect(lesson.steps).toHaveLength(lesson.diagram.nodes.length)
      expect(lesson.material.options[lesson.material.answer]).toBeDefined()
      expect(lesson.material.source).toMatch(/^https:\/\//)
    }
    for (const lesson of [...extendedLessons, ...ckaLessons]) {
      const Scene = specializedLessonScenes[lesson.id]
      expect(Scene, `Missing scene for ${lesson.id}`).toBeDefined()
      const markup = renderToStaticMarkup(<Scene/>)
      expect(markup).toContain('<button')
      expect(markup).not.toContain('INTERACTIVE CONCEPT MAP')
    }
  })
})
