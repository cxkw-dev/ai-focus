import { db } from '@/lib/db'
import { validateTodoBoardForResponse } from '@/lib/server/todo-response'
import { createEmptyCompletedCounts, isTerminalStatus } from '@/lib/todo-board'
import {
  COMPLETED_TODO_WHERE,
  activeTodoOrderBy,
  todoBoardInclude,
} from '@/lib/todo-queries'
import { internalError, ok } from '@/lib/server/api-responses'
import { TERMINAL_STATUS_VALUES } from '@/types/todo'

export async function GET() {
  try {
    const [active, deleted, completedProjectRows] = await Promise.all([
      db.todo.findMany({
        where: {
          archived: false,
          status: { notIn: [...TERMINAL_STATUS_VALUES] },
        },
        include: todoBoardInclude,
        orderBy: activeTodoOrderBy,
      }),
      db.todo.findMany({
        where: {
          archived: true,
          status: { notIn: [...TERMINAL_STATUS_VALUES] },
        },
        include: todoBoardInclude,
        orderBy: activeTodoOrderBy,
      }),
      // Counts only — the badges need a number, not 180KB of finished cards.
      db.todo.findMany({
        where: COMPLETED_TODO_WHERE,
        select: { status: true, labels: { select: { id: true } } },
      }),
    ])

    // Done and Cancelled are separate rails, so each needs its own tally.
    const completedCounts = createEmptyCompletedCounts()
    for (const todo of completedProjectRows) {
      if (!isTerminalStatus(todo.status)) continue
      const counts = completedCounts[todo.status]
      counts.total += 1
      for (const label of todo.labels) {
        counts.byProject[label.id] = (counts.byProject[label.id] ?? 0) + 1
      }
    }

    return ok(
      validateTodoBoardForResponse({ active, deleted, completedCounts }),
    )
  } catch (error) {
    return internalError(
      'Failed to fetch todo board',
      error,
      'Error fetching todo board',
    )
  }
}
