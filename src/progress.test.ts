import { describe, expect, it } from 'vitest'
import { decodeProgress } from './progress'

describe('saved progress', () => {
  it('restores passed lesson IDs and handles a first visit', () => {
    expect([...decodeProgress(null)]).toEqual([])
    expect([...decodeProgress('["pods","dns","pods"]')]).toEqual(['pods', 'dns'])
  })

  it('rejects malformed or invalid saved progress', () => {
    expect(() => decodeProgress('{')).toThrow()
    expect(() => decodeProgress('["pods",2]')).toThrow()
    expect(() => decodeProgress('{}')).toThrow()
  })
})
