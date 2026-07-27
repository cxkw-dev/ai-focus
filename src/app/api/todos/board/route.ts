import { db } from '@/lib/db'
import { validateTodoBoardForResponse } from '@/lib/server/todo-response'
import {
  COMPLETED_TODO_WHERE,
  activeTodoOrderBy,
  todoBoardInclude,
} from '@/lib/todo-queries'
import { internalError, ok } from '@/lib/server/api-responses'

export async function GET() {
  try {
    const [active, deleted, completedProjectRows] = await Promise.all([
      db.todo.findMany({
        where: {
          archived: false,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
        include: todoBoardInclude,
        orderBy: activeTodoOrderBy,
      }),
      db.todo.findMany({
        where: {
          archived: true,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
        include: todoBoardInclude,
        orderBy: activeTodoOrderBy,
      }),
      // Counts only — the badges need a number, not 180KB of finished cards.
      db.todo.findMany({
        where: COMPLETED_TODO_WHERE,
        select: { labels: { select: { id: true } } },
      }),
    ])

    const byProject: Record<string, number> = {}
    for (const todo of completedProjectRows) {
      for (const label of todo.labels) {
        byProject[label.id] = (byProject[label.id] ?? 0) + 1
      }
    }

    return ok(
      validateTodoBoardForResponse({
        active,
        deleted,
        completedCounts: {
          total: completedProjectRows.length,
          byProject,
        },
      }),
    )
  } catch (error) {
    return internalError(
      'Failed to fetch todo board',
      error,
      'Error fetching todo board',
    )
  }
}
