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

    const didReorder = await db.$transaction(async (tx) => {
      const matchedTodoCount = await tx.todo.count({
        where: {
          id: { in: orderedIds },
          archived: false,
        },
      })

      if (matchedTodoCount !== orderedIds.length) {
        return false
      }

      await Promise.all(
        orderedIds.map((id, index) =>
          tx.todo.update({
            where: { id },
            data: { order: index },
          }),
        ),
      )

      return true
    })

    if (!didReorder) {
      return badRequest('One or more todos are invalid or archived')
    }

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
