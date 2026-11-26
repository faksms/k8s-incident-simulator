import { describe, expect, it } from 'vitest'
import { courseLessonIds } from './KubernetesCourse'
import { learningPaths, nextPathTopic, weeklyIncidentIndex } from './learningPaths'
import { incidentCount, incidentTopics } from './App'

describe('learning paths', () => {
  it('only links to existing lessons and recommends the first unpassed topic', () => {
    const available = new Set(['architecture', ...courseLessonIds])
    for (const path of learningPaths) {
      expect(path.topics.length).toBeGreaterThan(0)
      expect(path.topics.every(topic => available.has(topic.id))).toBe(true)
      expect(new Set(path.topics.map(topic => topic.id)).size).toBe(path.topics.length)
    }
    expect(incidentTopics).toHaveLength(incidentCount)
    expect(incidentTopics.every(id => available.has(id))).toBe(true)
    const path = learningPaths[0]
    expect(nextPathTopic(path, new Set(['architecture'])).id).toBe('pods')
    expect(nextPathTopic(path, new Set(path.topics.map(topic => topic.id))).id).toBe('architecture')
  })

  it('rotates on UTC Mondays and wraps around the scenario library', () => {
    expect(weeklyIncidentIndex(new Date('2026-11-23T00:00:00Z'), 13)).toBe(weeklyIncidentIndex(new Date('2026-11-29T23:59:59Z'), 13))
    const current = weeklyIncidentIndex(new Date('2026-11-23T00:00:00Z'), 13)
    expect(weeklyIncidentIndex(new Date('2026-11-30T00:00:00Z'), 13)).toBe((current + 1) % 13)
    expect(() => weeklyIncidentIndex(new Date('invalid'), 13)).toThrow()
    expect(() => weeklyIncidentIndex(new Date(), 0)).toThrow()
  })
})
