import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ckaLessons } from './ckaLessons'
import { ExtendedLessonScene } from './ExtendedLessons'
import { courseChapters, flattenTopics } from './courseCatalog'

describe('CKA topic lessons', () => {
  it('connects each lesson to the course index and renders its interactive map', () => {
    const indexed = courseChapters.flatMap(chapter => flattenTopics(chapter.topics))
    for (const lesson of ckaLessons) {
      expect(indexed.filter(id => id === lesson.id)).toHaveLength(1)
      expect(lesson.steps).toHaveLength(lesson.diagram.nodes.length)
      expect(lesson.material.options[lesson.material.answer]).toBeDefined()
      expect(lesson.material.source).toMatch(/^https:\/\//)
      expect(renderToStaticMarkup(<ExtendedLessonScene lesson={lesson}/>)).toContain(lesson.steps[0].title)
    }
  })
})
