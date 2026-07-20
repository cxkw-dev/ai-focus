import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import {
  created,
  handleApiError,
  notFound,
  parseJsonBody,
} from '@/lib/server/api-responses'
import { findResolvedTodo } from '@/lib/server/todo-lookup'
import { createSessionSchema } from '@/lib/validation/todo'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const data = await parseJsonBody(request, createSessionSchema)
    const todo = await findResolvedTodo(id)

    if (!todo) {
      return notFound('Todo not found')
    }

    const session = await db.session.create({
      data: {
        tool: data.tool,
        command: data.command,
        workingPath: data.workingPath,
        todoId: todo.id,
      },
    })

    emit('todos')
    return created(session)
  } catch (error) {
    return handleApiError(
      error,
      'Failed to create session',
      'Error creating todo session',
    )
  }
}
