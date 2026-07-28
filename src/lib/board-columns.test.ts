import { describe, expect, it } from 'vitest'
import {
  BOARD_COLUMNS,
  TERMINAL_BOARD_COLUMNS,
  boardColumnConfig,
  boardColumnForStatus,
  groupTodosByBoardColumn,
  isBoardColumnKey,
  statusForBoardColumn,
  terminalStatusForBoardColumn,
} from '@/lib/board-columns'
import { TODO_STATUS_VALUES, type Status, type Todo } from '@/types/todo'

function makeTodo(id: string, status: Status): Todo {
  return {
    id,
    taskNumber: 1,
    title: id,
    description: null,
    status,
    archived: false,
    priority: 'MEDIUM',
    dueDate: null,
    order: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    completedAt: null,
    statusChangedAt: '2026-01-01T00:00:00.000Z',
    labels: [],
    subtasks: [],
    myPrUrls: [],
    githubPrUrls: [],
    azureWorkItemUrl: null,
    azureDepUrls: [],
    myIssueUrls: [],
    githubIssueUrls: [],
    notebookNoteId: null,
    sessions: [],
  }
}

describe('board columns', () => {
  it('covers every status exactly once', () => {
    const mapped = BOARD_COLUMNS.flatMap((column) => column.statuses)
    expect([...mapped].sort()).toEqual([...TODO_STATUS_VALUES].sort())
    expect(new Set(mapped).size).toBe(mapped.length)
  })

  it('maps statuses to their lane', () => {
    expect(boardColumnForStatus('TODO')).toBe('BACKLOG')
    expect(boardColumnForStatus('IN_PROGRESS')).toBe('IN_PROGRESS')
    // Cancellation is a stage of its own, not a footnote on Done.
    expect(boardColumnForStatus('CANCELLED')).toBe('CANCELLED')
  })

  it('keeps Backlog to not-started work, stalled work in its own lane', () => {
    expect(boardColumnForStatus('BLOCKED')).toBe('BLOCKED')
    expect(boardColumnForStatus('WAITING')).toBe('BLOCKED')
    expect(boardColumnForStatus('ON_HOLD')).toBe('BLOCKED')
    // Review is waiting on a reviewer, so it shares the stalled lane.
    expect(boardColumnForStatus('UNDER_REVIEW')).toBe('BLOCKED')
    expect(boardColumnConfig('BACKLOG').statuses).toEqual(['TODO'])
  })

  it('recognises lane keys', () => {
    expect(isBoardColumnKey('DONE')).toBe(true)
    expect(isBoardColumnKey('CANCELLED')).toBe(true)
    expect(isBoardColumnKey('WAITING')).toBe(false)
  })

  it('marks exactly the finished lanes as terminal', () => {
    expect(TERMINAL_BOARD_COLUMNS.map((column) => column.key)).toEqual([
      'DONE',
      'CANCELLED',
    ])
    expect(terminalStatusForBoardColumn(boardColumnConfig('DONE'))).toBe(
      'COMPLETED',
    )
    expect(terminalStatusForBoardColumn(boardColumnConfig('CANCELLED'))).toBe(
      'CANCELLED',
    )
    expect(() =>
      terminalStatusForBoardColumn(boardColumnConfig('BACKLOG')),
    ).toThrow(/not terminal/)
  })

  it('keeps nuanced statuses when the card stays in its lane', () => {
    expect(statusForBoardColumn('BLOCKED', 'WAITING')).toBe('WAITING')
    expect(statusForBoardColumn('BLOCKED', 'ON_HOLD')).toBe('ON_HOLD')
    expect(statusForBoardColumn('BLOCKED', 'UNDER_REVIEW')).toBe('UNDER_REVIEW')
  })

  it('applies the lane drop status when the card moves lanes', () => {
    expect(statusForBoardColumn('IN_PROGRESS', 'BLOCKED')).toBe('IN_PROGRESS')
    expect(statusForBoardColumn('IN_PROGRESS', 'UNDER_REVIEW')).toBe(
      'IN_PROGRESS',
    )
    expect(statusForBoardColumn('DONE', 'TODO')).toBe('COMPLETED')
    expect(statusForBoardColumn('DONE', 'CANCELLED')).toBe('COMPLETED')
    expect(statusForBoardColumn('CANCELLED', 'COMPLETED')).toBe('CANCELLED')
    expect(statusForBoardColumn('BACKLOG', 'COMPLETED')).toBe('TODO')
    // A card dragged out of Backlog into Blocked lands on BLOCKED, not WAITING.
    expect(statusForBoardColumn('BLOCKED', 'TODO')).toBe('BLOCKED')
  })

  it('throws on an unknown lane', () => {
    // @ts-expect-error -- guarding the runtime path callers can hit via drag ids
    expect(() => boardColumnConfig('NOPE')).toThrow(/Unknown board column/)
  })

  it('groups todos into their lanes', () => {
    const groups = groupTodosByBoardColumn([
      makeTodo('a', 'TODO'),
      makeTodo('b', 'ON_HOLD'),
      makeTodo('c', 'IN_PROGRESS'),
      makeTodo('d', 'COMPLETED'),
      makeTodo('e', 'WAITING'),
      makeTodo('f', 'UNDER_REVIEW'),
      makeTodo('g', 'CANCELLED'),
    ])

    expect(groups.BACKLOG.map((t) => t.id)).toEqual(['a'])
    expect(groups.IN_PROGRESS.map((t) => t.id)).toEqual(['c'])
    expect(groups.BLOCKED.map((t) => t.id)).toEqual(['b', 'e', 'f'])
    expect(groups.DONE.map((t) => t.id)).toEqual(['d'])
    expect(groups.CANCELLED.map((t) => t.id)).toEqual(['g'])
  })
})
