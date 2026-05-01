import {
  Prisma,
  Priority as PrismaPriority,
  Status as PrismaStatus,
} from '@prisma/client'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import { evaluateAccomplishment } from '@/lib/accomplishment-agent'
import { todoInclude, todoWhere } from '@/lib/todo-queries'
import {
  badRequest,
  internalError,
  notFound,
  ok,
  parseJsonBody,
  validationError,
} from '@/lib/server/api-responses'
import { isPrismaErrorCode } from '@/lib/server/prisma-errors'
import { validateTodoForResponse } from '@/lib/server/todo-response'
import { updateTodoSchema } from '@/lib/validation/todo'
import { isClientSubtaskId } from '@/lib/subtask-ids'
import { ZodError, z } from 'zod'

const TODO_ROUTE_ERRORS = {
  invalidSubtaskId: 'INVALID_SUBTASK_ID',
  todoNotFound: 'TODO_NOT_FOUND',
} as const

type ExistingTodoSnapshot = {
  id: string
  status: PrismaStatus
  notebookNoteId: string | null
  subtasks: { id: string }[]
}

type UpdateTodoPayload = z.infer<typeof updateTodoSchema>

type SubtaskPayload = Array<{
  id?: string
  title: string
  completed?: boolean
  order: number
}>

function createRouteError(code: keyof typeof TODO_ROUTE_ERRORS) {
  return new Error(TODO_ROUTE_ERRORS[code])
}

function isRouteError(error: unknown, code: keyof typeof TODO_ROUTE_ERRORS) {
  return error instanceof Error && error.message === TODO_ROUTE_ERRORS[code]
}

async function syncSubtasks(
  tx: Prisma.TransactionClient,
  todo: ExistingTodoSnapshot,
  subtasks: SubtaskPayload,
) {
  const existingSubtaskIds = new Set(todo.subtasks.map((subtask) => subtask.id))
  const incomingSubtaskIds = new Set(
    subtasks
      .map((subtask) => subtask.id)
      .filter((subtaskId): subtaskId is string => Boolean(subtaskId)),
  )

  const unknownSubtaskIds = Array.from(incomingSubtaskIds).filter(
    (subtaskId) =>
      !existingSubtaskIds.has(subtaskId) && !isClientSubtaskId(subtaskId),
  )

  if (unknownSubtaskIds.length > 0) {
    throw createRouteError('invalidSubtaskId')
  }

  const subtaskIdsToDelete = Array.from(existingSubtaskIds).filter(
    (existingId) => !incomingSubtaskIds.has(existingId),
  )

  if (subtaskIdsToDelete.length > 0) {
    await tx.subtask.deleteMany({
      where: {
        id: { in: subtaskIdsToDelete },
        todoId: todo.id,
      },
    })
  }

  await Promise.all(
    subtasks.map((subtask) => {
      if (subtask.id && existingSubtaskIds.has(subtask.id)) {
        return tx.subtask.update({
          where: { id: subtask.id },
          data: {
            title: subtask.title,
            completed: subtask.completed ?? false,
            order: subtask.order,
          },
        })
      }

      return tx.subtask.create({
        data: {
          ...(subtask.id ? { id: subtask.id } : {}),
          title: subtask.title,
          completed: subtask.completed ?? false,
          order: subtask.order,
          todoId: todo.id,
        },
      })
    }),
  )
}

async function applyStatusTransition(
  tx: Prisma.TransactionClient,
  todo: ExistingTodoSnapshot,
  nextStatus: PrismaStatus | undefined,
) {
  const transition: {
    archived?: boolean
    completedAt?: Date | null
    statusChangedAt?: Date
  } = {}

  if (nextStatus === undefined) {
    return transition
  }

  if (todo.status !== nextStatus) {
    transition.statusChangedAt = new Date()
  }

  const terminalStatuses = [
    PrismaStatus.COMPLETED,
    PrismaStatus.CANCELLED,
  ] as const
  const isTerminal = terminalStatuses.includes(
    nextStatus as (typeof terminalStatuses)[number],
  )
  const wasTerminal = terminalStatuses.includes(
    todo.status as (typeof terminalStatuses)[number],
  )

  if (isTerminal) {
    transition.archived = true
    if (nextStatus === PrismaStatus.COMPLETED) {
      transition.completedAt = new Date()
    }

    if (todo.notebookNoteId) {
      await tx.notebookNote.update({
        where: { id: todo.notebookNoteId },
        data: { archived: true },
      })
    }

    return transition
  }

  if (wasTerminal) {
    transition.archived = false
    transition.completedAt = null

    await tx.accomplishment.deleteMany({
      where: { todoId: todo.id },
    })

    if (todo.notebookNoteId) {
      await tx.notebookNote.update({
        where: { id: todo.notebookNoteId },
        data: { archived: false },
      })
    }
  }

  return transition
}

function buildTodoUpdateData(
  data: UpdateTodoPayload,
  transition: Awaited<ReturnType<typeof applyStatusTransition>>,
): Prisma.TodoUpdateInput {
  const updateData: Prisma.TodoUpdateInput = {}

  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.status !== undefined) updateData.status = data.status as PrismaStatus
  if (transition.archived !== undefined) {
    updateData.archived = transition.archived
  } else if (data.archived !== undefined) {
    updateData.archived = data.archived
  }
  if (data.priority !== undefined) {
    updateData.priority = data.priority as PrismaPriority
  }
  if (data.myPrUrls !== undefined) updateData.myPrUrls = data.myPrUrls
  if (data.githubPrUrls !== undefined)
    updateData.githubPrUrls = data.githubPrUrls
  if (data.azureWorkItemUrl !== undefined) {
    updateData.azureWorkItemUrl = data.azureWorkItemUrl
  }
  if (data.azureDepUrls !== undefined)
    updateData.azureDepUrls = data.azureDepUrls
  if (data.myIssueUrls !== undefined) updateData.myIssueUrls = data.myIssueUrls
  if (data.githubIssueUrls !== undefined) {
    updateData.githubIssueUrls = data.githubIssueUrls
  }
  if (transition.completedAt !== undefined) {
    updateData.completedAt = transition.completedAt
  }
  if (transition.statusChangedAt !== undefined) {
    updateData.statusChangedAt = transition.statusChangedAt
  }
  if (data.labelIds !== undefined) {
    updateData.labels = {
      set: data.labelIds.map((labelId) => ({ id: labelId })),
    }
  }
  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
  }
  if (data.notebookNoteId !== undefined) {
    updateData.notebookNote =
      data.notebookNoteId === null
        ? { disconnect: true }
        : { connect: { id: data.notebookNoteId } }
  }

  return updateData
}

async function loadTodoForMutation(
  tx: Prisma.TransactionClient,
  id: string,
): Promise<ExistingTodoSnapshot> {
  const todo = await tx.todo.findUnique({
    where: todoWhere(id),
    select: {
      id: true,
      status: true,
      notebookNoteId: true,
      subtasks: { select: { id: true } },
    },
  })

  if (!todo) {
    throw createRouteError('todoNotFound')
  }

  return todo
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const todo = await db.todo.findUnique({
      where: todoWhere(id),
      include: todoInclude,
    })

    if (!todo) {
      return notFound('Todo not found')
    }

    return ok(validateTodoForResponse(todo))
  } catch (error) {
    return internalError('Failed to fetch todo', error, 'Error fetching todo')
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const data = await parseJsonBody(request, updateTodoSchema)
    let shouldEvaluateAccomplishment = false

    const todo = await db.$transaction(async (tx) => {
      const existingTodo = await loadTodoForMutation(tx, id)
      const nextStatus = data.status as PrismaStatus | undefined
      shouldEvaluateAccomplishment =
        nextStatus === PrismaStatus.COMPLETED &&
        existingTodo.status !== PrismaStatus.COMPLETED

      if (data.subtasks !== undefined) {
        await syncSubtasks(tx, existingTodo, data.subtasks)
      }

      const transition = await applyStatusTransition(
        tx,
        existingTodo,
        nextStatus,
      )
      const updateData = buildTodoUpdateData(data, transition)

      return tx.todo.update({
        where: { id: existingTodo.id },
        data: updateData,
        include: todoInclude,
      })
    })

    if (shouldEvaluateAccomplishment) {
      evaluateAccomplishment({
        id: todo.id,
        title: todo.title,
        description: todo.description,
        labels: todo.labels,
        completedAt: todo.completedAt ?? new Date(),
      })
    }

    emit('todos')
    if (data.status !== undefined || data.notebookNoteId !== undefined) {
      emit('notebook')
    }

    return ok(validateTodoForResponse(todo))
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error)
    }

    if (isRouteError(error, 'invalidSubtaskId')) {
      return badRequest('One or more subtasks do not belong to this todo')
    }

    if (
      isRouteError(error, 'todoNotFound') ||
      isPrismaErrorCode(error, 'P2025')
    ) {
      return notFound('Todo not found')
    }

    return internalError('Failed to update todo', error, 'Error updating todo')
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const deletedNoteId = await db.$transaction(async (tx) => {
      const todo = await tx.todo.findUnique({
        where: todoWhere(id),
        select: { id: true, notebookNoteId: true },
      })

      if (!todo) {
        throw createRouteError('todoNotFound')
      }

      await tx.accomplishment.deleteMany({ where: { todoId: todo.id } })
      await tx.todo.delete({ where: { id: todo.id } })

      if (todo.notebookNoteId) {
        await tx.notebookNote
          .delete({ where: { id: todo.notebookNoteId } })
          .catch(() => {})
      }

      return todo.notebookNoteId
    })

    emit('todos')
    if (deletedNoteId) {
      emit('notebook')
    }

    return ok({ success: true })
  } catch (error) {
    if (
      isRouteError(error, 'todoNotFound') ||
      isPrismaErrorCode(error, 'P2025')
    ) {
      return notFound('Todo not found')
    }

    return internalError('Failed to delete todo', error, 'Error deleting todo')
  }
}
