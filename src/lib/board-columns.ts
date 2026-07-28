import { TERMINAL_STATUS_VALUES, type Status, type Todo } from '@/types/todo'

/**
 * The project board is a Trello board with one lane per stage of work. Every
 * todo status folds into exactly one lane so a card is always somewhere, and
 * dropping a card into a lane maps back to a canonical status. Backlog is
 * strictly "not started yet" — anything stalled on someone or something gets
 * its own lane rather than hiding among the work you could actually pick up,
 * and Blocked is the generic label for that: waiting, on-hold and under-review
 * all live there without losing their own status. They share a lane because
 * they share a question — who am I waiting on? — and splitting them just made
 * the board wider without making it clearer.
 */
export const BOARD_COLUMN_KEYS = [
  'BACKLOG',
  'IN_PROGRESS',
  'BLOCKED',
  'DONE',
  'CANCELLED',
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
  /**
   * A finished lane. Its cards are archived server-side and only fetched once
   * the lane is opened, so it renders as a collapsed rail, takes its badge from
   * the board's tally rather than from its cards, and never reorders in-lane.
   */
  terminal?: boolean
  /** Shown on a collapsed rail mid-drag: what dropping here would do. */
  dropHint?: string
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
    statuses: ['IN_PROGRESS'],
    dropStatus: 'IN_PROGRESS',
  },
  {
    key: 'BLOCKED',
    title: 'Blocked',
    color: 'var(--status-blocked)',
    statuses: ['BLOCKED', 'WAITING', 'ON_HOLD', 'UNDER_REVIEW'],
    dropStatus: 'BLOCKED',
  },
  {
    key: 'DONE',
    title: 'Done',
    color: 'var(--status-done)',
    statuses: ['COMPLETED'],
    dropStatus: 'COMPLETED',
    terminal: true,
    dropHint: 'Drop to finish',
  },
  {
    key: 'CANCELLED',
    // Dropped work, kept out of the way: a rail you have to open on purpose.
    title: 'Cancelled',
    color: 'var(--text-muted)',
    statuses: ['CANCELLED'],
    dropStatus: 'CANCELLED',
    terminal: true,
    dropHint: 'Drop to cancel',
  },
]

export const TERMINAL_BOARD_COLUMNS = BOARD_COLUMNS.filter(
  (column) => column.terminal,
)

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
  return Object.fromEntries(
    BOARD_COLUMN_KEYS.map((key) => [key, [] as Todo[]]),
  ) as Record<BoardColumnKey, Todo[]>
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

/**
 * Every terminal status gets a lane of its own, so a finished lane's badge can
 * be read straight off the board's tally without re-deriving the mapping.
 */
export function terminalStatusForBoardColumn(column: BoardColumnConfig) {
  const status = TERMINAL_STATUS_VALUES.find((candidate) =>
    column.statuses.includes(candidate),
  )
  if (!status) {
    throw new Error(`Board column is not terminal: ${column.key}`)
  }
  return status
}
