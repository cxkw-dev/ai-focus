import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import { internalError, notFound, ok } from '@/lib/server/api-responses'
import { findResolvedTodo } from '@/lib/server/todo-lookup'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; updateId: string }> },
) {
  try {
    const { id, updateId } = await params
    const todo = await findResolvedTodo(id)

    if (!todo) {
      return notFound('Todo not found')
    }

    const deleted = await db.statusUpdate.deleteMany({
      where: { id: updateId, todoId: todo.id },
    })

    if (deleted.count === 0) {
      return notFound('Update not found')
    }

    emit('todoUpdates', { todoId: todo.id })
    return ok({ success: true })
  } catch (error) {
    return internalError(
      'Failed to delete update',
      error,
      'Error deleting todo update',
    )
  }
}
