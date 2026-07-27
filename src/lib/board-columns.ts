import type { Status, Todo } from '@/types/todo'

/**
 * The project board is a four-lane Trello board. Every todo status folds into
 * exactly one lane so a card is always somewhere, and dropping a card into a
 * lane maps back to a canonical status. Backlog is strictly "not started yet" —
 * anything stalled on someone or something gets its own lane rather than
 * hiding among the work you could actually pick up.
 */
export const BOARD_COLUMN_KEYS = [
  'BACKLOG',
  'IN_PROGRESS',
  'BLOCKED',
  'DONE',
] as const
export type BoardColumnKey = (typeof BOARD_COLUMN_KEYS)[number]

export interface BoardColumnConfig {
  key: BoardColumnKey
  title: string
  color: string
  /** Statuses that live in this lane. */
  statuses: readonly Status[]
  /** Status applied when a card is dropped in from another lane. */
  dropStatus: Status
}

export const BOARD_COLUMNS: readonly BoardColumnConfig[] = [
  {
    key: 'BACKLOG',
    title: 'Backlog',
    color: 'var(--status-todo)',
    statuses: ['TODO'],
    dropStatus: 'TODO',
  },
  {
    key: 'IN_PROGRESS',
    title: 'In Progress',
    color: 'var(--status-in-progress)',
    statuses: ['IN_PROGRESS', 'UNDER_REVIEW'],
    dropStatus: 'IN_PROGRESS',
  },
  {
    key: 'BLOCKED',
    title: 'Blocked',
    color: 'var(--status-blocked)',
    statuses: ['BLOCKED', 'WAITING', 'ON_HOLD'],
    dropStatus: 'BLOCKED',
  },
  {
    key: 'DONE',
    title: 'Done',
    color: 'var(--status-done)',
    statuses: ['COMPLETED', 'CANCELLED'],
    dropStatus: 'COMPLETED',
  },
]

const COLUMN_BY_KEY = new Map<BoardColumnKey, BoardColumnConfig>(
  BOARD_COLUMNS.map((column) => [column.key, column]),
)

const COLUMN_KEY_BY_STATUS = new Map<Status, BoardColumnKey>(
  BOARD_COLUMNS.flatMap((column) =>
    column.statuses.map((status) => [status, column.key] as const),
  ),
)

export function isBoardColumnKey(value: string): value is BoardColumnKey {
  return COLUMN_BY_KEY.has(value as BoardColumnKey)
}

export function boardColumnConfig(key: BoardColumnKey): BoardColumnConfig {
  const column = COLUMN_BY_KEY.get(key)
  if (!column) {
    throw new Error(`Unknown board column: ${key}`)
  }
  return column
}

export function boardColumnForStatus(status: Status): BoardColumnKey {
  return COLUMN_KEY_BY_STATUS.get(status) ?? 'BACKLOG'
}

/**
 * Status a todo should take when dropped into `key`. Cards already in the lane
 * keep their nuance (e.g. WAITING stays WAITING inside Blocked) so a same-lane
 * reorder never flattens status.
 */
export function statusForBoardColumn(
  key: BoardColumnKey,
  currentStatus: Status,
): Status {
  const column = boardColumnConfig(key)
  return column.statuses.includes(currentStatus)
    ? currentStatus
    : column.dropStatus
}

export function createEmptyBoardGroups(): Record<BoardColumnKey, Todo[]> {
  return { BACKLOG: [], IN_PROGRESS: [], BLOCKED: [], DONE: [] }
}

export function groupTodosByBoardColumn(
  todos: Todo[],
): Record<BoardColumnKey, Todo[]> {
  const groups = createEmptyBoardGroups()
  for (const todo of todos) {
    groups[boardColumnForStatus(todo.status)].push(todo)
  }
  return groups
}
