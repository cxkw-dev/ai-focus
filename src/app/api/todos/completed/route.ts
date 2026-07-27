import { db } from '@/lib/db'
import { validateTodosForResponse } from '@/lib/server/todo-response'
import {
  COMPLETED_TODO_WHERE,
  activeTodoOrderBy,
  todoBoardInclude,
} from '@/lib/todo-queries'
import { internalError, ok } from '@/lib/server/api-responses'

/**
 * The finished pile, fetched only when a Done lane is opened or the overview
 * switches to its Done filter. Splitting it out of /api/todos/board is what
 * keeps the board payload proportional to the work still in front of you.
 */
export async function GET() {
  try {
    const completed = await db.todo.findMany({
      where: COMPLETED_TODO_WHERE,
      include: todoBoardInclude,
      orderBy: activeTodoOrderBy,
    })

    return ok(validateTodosForResponse(completed))
  } catch (error) {
    return internalError(
      'Failed to fetch completed todos',
      error,
      'Error fetching completed todos',
    )
  }
}
