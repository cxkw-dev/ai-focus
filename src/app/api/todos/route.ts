import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import { z } from 'zod'

const subtaskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(200),
  completed: z.boolean().optional(),
  order: z.number().int(),
})

const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
  subtasks: z.array(subtaskSchema).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const completed = searchParams.get('completed')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const archived = searchParams.get('archived')

    const where: Record<string, unknown> = {}

    // By default, don't show archived todos unless explicitly requested
    if (archived !== null) {
      where.archived = archived === 'true'
    } else {
      where.archived = false
    }

    if (status) {
      where.status = status
    } else if (completed !== null) {
      // For backwards compatibility, map completed=true to COMPLETED status
      where.status = completed === 'true' ? 'COMPLETED' : { not: 'COMPLETED' }
    }

    if (priority) {
      where.priority = priority
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
