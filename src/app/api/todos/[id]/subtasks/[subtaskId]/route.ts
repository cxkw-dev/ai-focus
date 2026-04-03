import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import { todoInclude, todoWhere } from '@/lib/todo-queries'
import {
  internalError,
  notFound,
  ok,
  parseJsonBody,
  validationError,
} from '@/lib/server/api-responses'
import { isPrismaErrorCode } from '@/lib/server/prisma-errors'
import { toggleSubtaskSchema } from '@/lib/validation/todo'
import { ZodError } from 'zod'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; subtaskId: string }> },
) {
  try {
    const { id, subtaskId } = await params
    const { completed } = await parseJsonBody(request, toggleSubtaskSchema)

    const todo = await db.todo.findUnique({
      where: todoWhere(id),
      select: { id: true },
    })

    if (!todo) {
      return notFound('Todo not found')
    }

    const updated = await db.subtask.updateMany({
      where: {
        id: subtaskId,
        todoId: todo.id,
      },
      data: { completed },
    })

    if (updated.count === 0) {
      return notFound('Subtask not found for this todo')
    }

    const updatedTodo = await db.todo.findUniqueOrThrow({
      where: { id: todo.id },
      include: todoInclude,
    })

    emit('todos')
    return ok(updatedTodo)
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error)
    }

    if (isPrismaErrorCode(error, 'P2025')) {
      return notFound('Todo not found')
    }

    return internalError(
      'Failed to toggle subtask',
      error,
      'Error toggling subtask',
    )
  }
}
