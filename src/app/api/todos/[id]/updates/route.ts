import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import {
  created,
  internalError,
  notFound,
  ok,
  parseJsonBody,
  validationError,
} from '@/lib/server/api-responses'
import { findResolvedTodo } from '@/lib/server/todo-lookup'
import { createStatusUpdateSchema } from '@/lib/validation/todo'
import { ZodError } from 'zod'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const todo = await findResolvedTodo(id)

    if (!todo) {
      return notFound('Todo not found')
    }

    const updates = await db.statusUpdate.findMany({
      where: { todoId: todo.id },
      orderBy: { createdAt: 'desc' },
    })

    return ok(updates)
  } catch (error) {
    return internalError(
      'Failed to fetch updates',
      error,
      'Error fetching todo updates',
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const data = await parseJsonBody(request, createStatusUpdateSchema)
    const todo = await findResolvedTodo(id)

    if (!todo) {
      return notFound('Todo not found')
    }

    const update = await db.statusUpdate.create({
      data: {
        todoId: id,
        content: data.content,
        status: data.status ?? null,
      },
    })

    emit('todoUpdates', { todoId: todo.id })
    return created(update)
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error)
    }

    return internalError(
      'Failed to add update',
      error,
      'Error creating todo update',
    )
  }
}
