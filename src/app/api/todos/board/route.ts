import { db } from '@/lib/db'
import { validateTodoBoardForResponse } from '@/lib/server/todo-response'
import { activeTodoOrderBy, todoInclude } from '@/lib/todo-queries'
import { internalError, ok } from '@/lib/server/api-responses'

export async function GET() {
  try {
    const [active, completed, deleted] = await Promise.all([
      db.todo.findMany({
        where: {
          archived: false,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
        include: todoInclude,
        orderBy: activeTodoOrderBy,
      }),
      db.todo.findMany({
        where: {
          archived: true,
          status: { in: ['COMPLETED', 'CANCELLED'] },
        },
        include: todoInclude,
        orderBy: activeTodoOrderBy,
      }),
      db.todo.findMany({
        where: {
          archived: true,
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
        include: todoInclude,
        orderBy: activeTodoOrderBy,
      }),
    ])

    return ok(validateTodoBoardForResponse({ active, completed, deleted }))
  } catch (error) {
    return internalError(
      'Failed to fetch todo board',
      error,
      'Error fetching todo board',
    )
  }
}
