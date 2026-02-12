import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import { z } from 'zod'

const toggleSchema = z.object({
  completed: z.boolean(),
})

function todoWhere(id: string) {
  const num = Number(id)
  if (Number.isInteger(num) && num > 0) {
    return { taskNumber: num }
  }
  return { id }
}

function isNotFoundError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025'
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const { id, subtaskId } = await params
    const body = await request.json()
    const { completed } = toggleSchema.parse(body)

    const todo = await db.todo.findUnique({
      where: todoWhere(id),
      select: { id: true },
    })

    if (!todo) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      )
    }

    const updated = await db.subtask.updateMany({
      where: {
        id: subtaskId,
        todoId: todo.id,
      },
      data: { completed },
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { error: 'Subtask not found for this todo' },
        { status: 404 }
      )
    }

    // Return the full parent todo for cache update
    const updatedTodo = await db.todo.findUniqueOrThrow({
      where: { id: todo.id },
      include: {
        labels: { orderBy: { name: 'asc' } },
        subtasks: { orderBy: { order: 'asc' } },
      },
    })

    emit('todos')
    return NextResponse.json(updatedTodo)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (isNotFoundError(error)) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      )
    }

    console.error('Error toggling subtask:', error)
    return NextResponse.json(
      { error: 'Failed to toggle subtask' },
      { status: 500 }
    )
  }
}
