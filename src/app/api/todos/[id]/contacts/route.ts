import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import {
  conflict,
  created,
  internalError,
  notFound,
  ok,
  parseJsonBody,
  validationError,
} from '@/lib/server/api-responses'
import { isPrismaErrorCode } from '@/lib/server/prisma-errors'
import { findResolvedTodo } from '@/lib/server/todo-lookup'
import { addTodoContactSchema } from '@/lib/validation/todo'
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

    const contacts = await db.todoContact.findMany({
      where: { todoId: todo.id },
      include: { person: { select: { id: true, name: true, email: true } } },
      orderBy: { order: 'asc' },
    })

    return ok(contacts)
  } catch (error) {
    return internalError(
      'Failed to fetch contacts',
      error,
      'Error fetching todo contacts',
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const todo = await findResolvedTodo(id)

    if (!todo) {
      return notFound('Todo not found')
    }

    const data = await parseJsonBody(request, addTodoContactSchema)
    const count = await db.todoContact.count({ where: { todoId: todo.id } })
    const contact = await db.todoContact.create({
      data: {
        todoId: todo.id,
        personId: data.personId,
        role: data.role,
        order: count,
      },
      include: { person: { select: { id: true, name: true, email: true } } },
    })

    emit('todoContacts', { todoId: todo.id })
    return created(contact)
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error)
    }

    if (isPrismaErrorCode(error, 'P2002')) {
      return conflict('Contact already assigned to this task')
    }

    return internalError(
      'Failed to add contact',
      error,
      'Error creating todo contact',
    )
  }
}
