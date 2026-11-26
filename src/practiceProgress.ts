export const practiceProgressKey = 'kubernetes-practice-progress-v1'

export type PracticeRun = { guided: boolean; hintRevealed: boolean; wrongDiagnoses: number }
export type PracticeStats = { completedRuns: number; guidedRuns: number; hintsRevealed: number; wrongDiagnoses: number }
export type PracticeProgress = Record<string, PracticeStats>

export function decodePracticeProgress(value: string | null): PracticeProgress {
  if (value === null) return {}
  const parsed: unknown = JSON.parse(value)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Saved practice progress has an invalid format')
  const result: PracticeProgress = {}
  for (const [id, stats] of Object.entries(parsed)) {
    if (!/^(0|[1-9]\d*)$/.test(id) || !stats || typeof stats !== 'object' || Array.isArray(stats)) throw new Error('Saved practice progress has an invalid entry')
    const value: Record<string, unknown> = Object.fromEntries(Object.entries(stats))
    const { completedRuns, guidedRuns, hintsRevealed, wrongDiagnoses } = value
    const validCount = (count: unknown): count is number => typeof count === 'number' && Number.isSafeInteger(count) && count >= 0
    if (!validCount(completedRuns) || !validCount(guidedRuns) || !validCount(hintsRevealed) || !validCount(wrongDiagnoses)) throw new Error('Saved practice progress has invalid counts')
    if (guidedRuns > completedRuns || hintsRevealed > completedRuns) throw new Error('Saved practice progress has inconsistent counts')
    result[id] = { completedRuns, guidedRuns, hintsRevealed, wrongDiagnoses }
  }
  return result
}

export function recordPracticeRun(progress: PracticeProgress, index: number, run: PracticeRun): PracticeProgress {
  const previous = progress[index] ?? { completedRuns: 0, guidedRuns: 0, hintsRevealed: 0, wrongDiagnoses: 0 }
  return { ...progress, [index]: {
    completedRuns: previous.completedRuns + 1,
    guidedRuns: previous.guidedRuns + Number(run.guided),
    hintsRevealed: previous.hintsRevealed + Number(run.hintRevealed),
    wrongDiagnoses: previous.wrongDiagnoses + run.wrongDiagnoses,
  } }
}
