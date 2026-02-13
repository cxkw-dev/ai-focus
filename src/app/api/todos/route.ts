import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import { z } from 'zod'

const statusSchema = z.enum(['TODO', 'IN_PROGRESS', 'WAITING', 'ON_HOLD', 'COMPLETED'])
const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

const subtaskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(200),
  completed: z.boolean().optional(),
  order: z.number().int(),
})

const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  priority: prioritySchema.optional(),
  dueDate: z.string().datetime().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
  subtasks: z.array(subtaskSchema).optional(),
  myPrUrl: z.string().url().optional().nullable(),
  githubPrUrls: z.array(z.string().url()).optional(),
})

const listTodosQuerySchema = z.object({
  completed: z.enum(['true', 'false']).optional(),
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
  archived: z.enum(['true', 'false']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const validatedQuery = listTodosQuerySchema.parse({
      completed: request.nextUrl.searchParams.get('completed') ?? undefined,
      status: request.nextUrl.searchParams.get('status') ?? undefined,
      priority: request.nextUrl.searchParams.get('priority') ?? undefined,
      archived: request.nextUrl.searchParams.get('archived') ?? undefined,
    })

    const where: Prisma.TodoWhereInput = {}

    // By default, don't show archived todos unless explicitly requested
    if (validatedQuery.archived !== undefined) {
      where.archived = validatedQuery.archived === 'true'
    } else {
      where.archived = false
    }

    if (validatedQuery.status) {
      where.status = validatedQuery.status
    } else if (validatedQuery.completed !== undefined) {
      // For backwards compatibility, map completed=true to COMPLETED status
      where.status = validatedQuery.completed === 'true' ? 'COMPLETED' : { not: 'COMPLETED' }
    }

    if (validatedQuery.priority) {
      where.priority = validatedQuery.priority
    }

    const todos = await db.todo.findMany({
      where,
      include: {
        labels: { orderBy: { name: 'asc' } },
        subtasks: { orderBy: { order: 'asc' } },
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(todos)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error fetching todos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createTodoSchema.parse(body)
    const { labelIds, subtasks, ...todoData } = validatedData

    // Get the minimum order value to place new todo at the top
    const minOrderTodo = await db.todo.findFirst({
      orderBy: { order: 'asc' },
      select: { order: true },
    })
    const newOrder = minOrderTodo ? minOrderTodo.order - 1 : 0

    const todo = await db.todo.create({
      data: {
        ...todoData,
        priority: validatedData.priority || 'MEDIUM',
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        labels: labelIds?.length
          ? { connect: labelIds.map((id) => ({ id })) }
          : undefined,
        subtasks: subtasks?.length
          ? { create: subtasks.map((s) => ({ title: s.title, completed: s.completed ?? false, order: s.order })) }
          : undefined,
        order: newOrder,
      },
      include: {
        labels: { orderBy: { name: 'asc' } },
        subtasks: { orderBy: { order: 'asc' } },
      },
    })

    emit('todos')
    return NextResponse.json(todo, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating todo:', error)
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    )
  }
}
