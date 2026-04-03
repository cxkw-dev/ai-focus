import { describe, expect, it } from 'vitest'
import {
  isRapidDuplicateSubtaskCommit,
  normalizeSubtaskCommitValue,
} from './subtask-commit'

describe('normalizeSubtaskCommitValue', () => {
  it('normalizes rich text to comparable plain text', () => {
    expect(normalizeSubtaskCommitValue('<p>Follow up</p>')).toBe('Follow up')
    expect(normalizeSubtaskCommitValue('<p>Follow up</p><p></p>')).toBe(
      'Follow up',
    )
  })

  it('collapses whitespace for duplicate detection', () => {
    expect(normalizeSubtaskCommitValue('  Follow   up  ')).toBe('Follow up')
  })
})

describe('isRapidDuplicateSubtaskCommit', () => {
  it('treats equivalent rich-text values as duplicate commits', () => {
    expect(
      isRapidDuplicateSubtaskCommit(
        { value: 'Follow up', at: 1_000 },
        '<p>Follow up</p><p></p>',
        1_120,
      ),
    ).toBe(true)
  })

  it('allows the same value again after the guard window', () => {
    expect(
      isRapidDuplicateSubtaskCommit(
        { value: 'Follow up', at: 1_000 },
        '<p>Follow up</p>',
        1_400,
      ),
    ).toBe(false)
  })

  it('allows different values inside the guard window', () => {
    expect(
      isRapidDuplicateSubtaskCommit(
        { value: 'Follow up', at: 1_000 },
        '<p>Follow up tomorrow</p>',
        1_120,
      ),
    ).toBe(false)
  })
})
