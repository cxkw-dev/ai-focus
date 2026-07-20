import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import {
  badRequest,
  handleApiError,
  ok,
  parseJsonBody,
} from '@/lib/server/api-responses'
import { reorderTodosSchema } from '@/lib/validation/todo'

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
    return handleApiError(
      error,
      'Failed to reorder todos',
      'Error reordering todos',
    )
  }
}
