import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const completed = searchParams.get('completed')
    const priority = searchParams.get('priority')
    const categoryId = searchParams.get('categoryId')
    const archived = searchParams.get('archived')

    const where: Record<string, unknown> = {}

    // By default, don't show archived todos unless explicitly requested
    if (archived !== null) {
      where.archived = archived === 'true'
    } else {
      where.archived = false
    }

    if (completed !== null) {
      // For backwards compatibility, map completed=true to COMPLETED status
      where.status = completed === 'true' ? 'COMPLETED' : { not: 'COMPLETED' }
    }

    if (priority) {
      where.priority = priority
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    const todos = await db.todo.findMany({
      where,
      include: {
        category: true,
        labels: { orderBy: { name: 'asc' } },
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
    const { labelIds, categoryId, ...todoData } = validatedData

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
        ...(categoryId
          ? { category: { connect: { id: categoryId } } }
          : {}),
        labels: labelIds?.length
          ? { connect: labelIds.map((id) => ({ id })) }
          : undefined,
        order: newOrder,
      },
      include: {
        category: true,
        labels: { orderBy: { name: 'asc' } },
      },
    })

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
