export const progressKey = 'kubernetes-visual-course-progress-v1'

export function decodeProgress(value: string | null): Set<string> {
  if (value === null) return new Set()
  const parsed: unknown = JSON.parse(value)
  if (!Array.isArray(parsed) || !parsed.every(item => typeof item === 'string')) {
    throw new Error('Saved course progress has an invalid format')
  }
  return new Set(parsed)
}
