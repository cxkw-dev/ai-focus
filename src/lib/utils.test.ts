import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cn,
  formatDate,
  formatRelativeDate,
  formatRelativeTime,
} from '@/lib/utils'

describe('cn', () => {
  it('merges class strings', () => {
    expect(cn('a', 'b')).toBe('a b')
  })
  it('dedupes conflicting tailwind classes with later winning', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })
})

describe('formatDate', () => {
  it('formats a Date object', () => {
    expect(formatDate(new Date('2026-04-20T12:00:00Z'))).toBe('Apr 20, 2026')
  })
  it('accepts an ISO string', () => {
    expect(formatDate('2026-04-20T12:00:00Z')).toBe('Apr 20, 2026')
  })
})

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-20T12:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "just now" for < 60s ago', () => {
    expect(formatRelativeTime(new Date('2026-04-20T11:59:30Z'))).toBe(
      'just now',
    )
  })
  it('returns minutes for < 1h ago', () => {
    expect(formatRelativeTime(new Date('2026-04-20T11:45:00Z'))).toBe('15m ago')
  })
  it('returns hours for < 24h ago', () => {
    expect(formatRelativeTime(new Date('2026-04-20T09:00:00Z'))).toBe('3h ago')
  })
  it('returns days for < 7d ago', () => {
    expect(formatRelativeTime(new Date('2026-04-18T12:00:00Z'))).toBe('2d ago')
  })
  it('falls back to absolute date for > 7d ago', () => {
    expect(formatRelativeTime(new Date('2026-04-01T12:00:00Z'))).toBe(
      'Apr 1, 2026',
    )
  })
  it('falls back to absolute date for future dates', () => {
    expect(formatRelativeTime(new Date('2026-04-21T12:00:00Z'))).toBe(
      'Apr 21, 2026',
    )
  })
})

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-20T12:00:00'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "Today" for today', () => {
    expect(formatRelativeDate(new Date('2026-04-20T23:59:00'))).toBe('Today')
  })
  it('returns "Tomorrow" for next day', () => {
    expect(formatRelativeDate(new Date('2026-04-21T05:00:00'))).toBe('Tomorrow')
  })
  it('returns "Yesterday" for previous day', () => {
    expect(formatRelativeDate(new Date('2026-04-19T05:00:00'))).toBe(
      'Yesterday',
    )
  })
  it('returns "In N days" for 2-7 days out', () => {
    expect(formatRelativeDate(new Date('2026-04-25T05:00:00'))).toBe(
      'In 5 days',
    )
  })
  it('returns "N days overdue" for 2-7 days past', () => {
    expect(formatRelativeDate(new Date('2026-04-17T05:00:00'))).toBe(
      '3 days overdue',
    )
  })
  it('returns "Overdue" for > 7 days past', () => {
    expect(formatRelativeDate(new Date('2026-04-01T05:00:00'))).toBe('Overdue')
  })
  it('returns absolute date for > 7 days out', () => {
    expect(formatRelativeDate(new Date('2026-05-15T05:00:00'))).toBe(
      'May 15, 2026',
    )
  })
})
