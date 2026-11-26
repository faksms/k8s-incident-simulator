import { describe, expect, it } from 'vitest'
import { decodePracticeProgress, recordPracticeRun } from './practiceProgress'

describe('practice progress', () => {
  it('records completed runs without counting unfinished attempts', () => {
    const first = recordPracticeRun({}, 2, { guided: false, hintRevealed: true, wrongDiagnoses: 2 })
    const next = recordPracticeRun(first, 2, { guided: true, hintRevealed: false, wrongDiagnoses: 0 })
    expect(next['2']).toEqual({ completedRuns: 2, guidedRuns: 1, hintsRevealed: 1, wrongDiagnoses: 2 })
    expect(decodePracticeProgress(JSON.stringify(next))).toEqual(next)
  })

  it('rejects invalid and inconsistent saved data', () => {
    expect(decodePracticeProgress(null)).toEqual({})
    expect(() => decodePracticeProgress('[]')).toThrow()
    expect(() => decodePracticeProgress('{"2":{"completedRuns":1,"guidedRuns":2,"hintsRevealed":0,"wrongDiagnoses":0}}')).toThrow()
    expect(() => decodePracticeProgress('{"x":{"completedRuns":1,"guidedRuns":0,"hintsRevealed":0,"wrongDiagnoses":0}}')).toThrow()
  })
})
