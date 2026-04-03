import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import {
  badRequest,
  internalError,
  ok,
  parseJsonBody,
  validationError,
} from '@/lib/server/api-responses'
import { reorderTodosSchema } from '@/lib/validation/todo'
import { ZodError } from 'zod'

export async function POST(request: Request) {
  try {
    const { orderedIds } = await parseJsonBody(request, reorderTodosSchema)

    const matchedTodoCount = await db.todo.count({
      where: {
        id: { in: orderedIds },
        archived: false,
      },
    })

    if (matchedTodoCount !== orderedIds.length) {
      return badRequest('One or more todos are invalid or archived')
    }

    await db.$transaction(
      orderedIds.map((id, index) =>
        db.todo.update({
          where: { id },
          data: { order: index },
        }),
      ),
    )

    emit('todos')
    return ok({ success: true })
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error)
    }

    return internalError(
      'Failed to reorder todos',
      error,
      'Error reordering todos',
    )
  }
}
