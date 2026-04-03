import {
  Prisma,
  Priority as PrismaPriority,
  Status as PrismaStatus,
} from '@prisma/client'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import { evaluateAccomplishment } from '@/lib/accomplishment-agent'
import { activeTodoOrderBy, todoInclude } from '@/lib/todo-queries'
import {
  validateTodoForResponse,
  validateTodosForResponse,
} from '@/lib/server/todo-response'
import {
  created,
  internalError,
  ok,
  parseJsonBody,
  validationError,
} from '@/lib/server/api-responses'
import { createTodoSchema, parseListTodosQuery } from '@/lib/validation/todo'
import { ZodError } from 'zod'
import type { NextRequest } from 'next/server'

type ListTodosQuery = ReturnType<typeof parseListTodosQuery>

function buildStatusFilter(query: ListTodosQuery) {
  if (query.status) {
    return query.status as PrismaStatus
  }

  if (query.completed === undefined) {
    return undefined
  }

  return query.completed === 'true'
    ? PrismaStatus.COMPLETED
    : { not: PrismaStatus.COMPLETED }
}

function buildTodoWhere(query: ListTodosQuery): Prisma.TodoWhereInput {
  const where: Prisma.TodoWhereInput = {
    archived: query.archived === undefined ? false : query.archived === 'true',
  }

  const statusFilter = buildStatusFilter(query)

  if (query.excludeStatus) {
    if (typeof statusFilter === 'string') {
      if (statusFilter === query.excludeStatus) {
        where.id = '__no_matching_todos__'
      } else {
        where.status = statusFilter
      }
    } else if (statusFilter) {
      where.status = {
        ...statusFilter,
        not: query.excludeStatus as PrismaStatus,
      }
    } else {
      where.status = { not: query.excludeStatus as PrismaStatus }
    }
  } else if (statusFilter) {
    where.status = statusFilter
  }

  if (query.priority) {
    where.priority = query.priority as PrismaPriority
  }

  if (query.search) {
    where.title = { contains: query.search, mode: 'insensitive' }
  }

  return where
}

function buildTodoOrderBy(
  sortBy: ListTodosQuery['sortBy'],
): Prisma.TodoOrderByWithRelationInput[] {
  if (sortBy === 'completedAt') {
    return [{ completedAt: 'desc' }]
  }

  if (sortBy === 'updatedAt') {
    return [{ updatedAt: 'desc' }]
  }

  return activeTodoOrderBy
}

async function getNextTodoOrder() {
  const minOrderTodo = await db.todo.findFirst({
    orderBy: { order: 'asc' },
    select: { order: true },
  })

  return minOrderTodo ? minOrderTodo.order - 1 : 0
}

export async function GET(request: NextRequest) {
  try {
    const query = parseListTodosQuery(request.nextUrl.searchParams)
    const where = buildTodoWhere(query)
    const orderBy = buildTodoOrderBy(query.sortBy)

    if (query.limit !== undefined) {
      const [todos, total] = await Promise.all([
        db.todo.findMany({
          where,
          include: todoInclude,
          orderBy,
          take: query.limit,
          skip: query.offset ?? 0,
        }),
        db.todo.count({ where }),
      ])

      return ok({ todos: validateTodosForResponse(todos), total })
    }

    const todos = await db.todo.findMany({
      where,
      include: todoInclude,
      orderBy,
    })

    return ok(validateTodosForResponse(todos))
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error)
    }

    return internalError('Failed to fetch todos', error, 'Error fetching todos')
  }
}

export async function POST(request: Request) {
  try {
    const data = await parseJsonBody(request, createTodoSchema)
    const { labelIds, subtasks, ...todoData } = data
    const initialStatus = (data.status ?? 'TODO') as PrismaStatus
    const isInitiallyCompleted = initialStatus === PrismaStatus.COMPLETED

    const todo = await db.todo.create({
      data: {
        ...todoData,
        priority: (data.priority ?? 'MEDIUM') as PrismaPriority,
        status: initialStatus,
        archived: isInitiallyCompleted,
        completedAt: isInitiallyCompleted ? new Date() : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        labels: labelIds?.length
          ? { connect: labelIds.map((id) => ({ id })) }
          : undefined,
        subtasks: subtasks?.length
          ? {
              create: subtasks.map((subtask) => ({
                ...(subtask.id ? { id: subtask.id } : {}),
                title: subtask.title,
                completed: subtask.completed ?? false,
                order: subtask.order,
              })),
            }
          : undefined,
        order: await getNextTodoOrder(),
      },
      include: todoInclude,
    })

    if (isInitiallyCompleted) {
      evaluateAccomplishment({
        id: todo.id,
        title: todo.title,
        description: todo.description,
        labels: todo.labels,
        completedAt: todo.completedAt ?? new Date(),
      })
    }

    emit('todos')
    if (data.notebookNoteId) {
      emit('notebook')
    }

    return created(validateTodoForResponse(todo))
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error)
    }

    return internalError('Failed to create todo', error, 'Error creating todo')
  }
}
