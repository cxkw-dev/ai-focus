import { ZodError, z } from 'zod'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import {
  internalError,
  notFound,
  ok,
  parseJsonBody,
  validationError,
} from '@/lib/server/api-responses'
import { findResolvedTodo } from '@/lib/server/todo-lookup'

const updateContactSchema = z.object({
  role: z.string().min(1).optional(),
  order: z.number().int().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  try {
    const { id, contactId } = await params
    const data = await parseJsonBody(request, updateContactSchema)
    const todo = await findResolvedTodo(id)

    if (!todo) {
      return notFound('Todo not found')
    }

    const updated = await db.todoContact.updateMany({
      where: { id: contactId, todoId: todo.id },
      data,
    })

    if (updated.count === 0) {
      return notFound('Contact not found')
    }

    const contact = await db.todoContact.findUniqueOrThrow({
      where: { id: contactId },
      include: { person: { select: { id: true, name: true, email: true } } },
    })
    emit('todoContacts', { todoId: todo.id })
    return ok(contact)
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error)
    }
    return internalError(
      'Failed to update contact',
      error,
      'Error updating contact',
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  try {
    const { id, contactId } = await params
    const todo = await findResolvedTodo(id)

    if (!todo) {
      return notFound('Todo not found')
    }

    const deleted = await db.todoContact.deleteMany({
      where: { id: contactId, todoId: todo.id },
    })

    if (deleted.count === 0) {
      return notFound('Contact not found')
    }

    emit('todoContacts', { todoId: todo.id })
    return ok({ success: true })
  } catch (error) {
    return internalError(
      'Failed to delete contact',
      error,
      'Error deleting contact',
    )
  }
}
