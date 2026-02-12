import { NextRequest, NextResponse } from 'next/server'
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const { id, subtaskId } = await params
    const body = await request.json()
    const { completed } = toggleSchema.parse(body)

    await db.subtask.update({
      where: { id: subtaskId },
      data: { completed },
    })

    // Return the full parent todo for cache update
    const todo = await db.todo.findUniqueOrThrow({
      where: todoWhere(id),
      include: {
        labels: { orderBy: { name: 'asc' } },
        subtasks: { orderBy: { order: 'asc' } },
      },
    })

    emit('todos')
    return NextResponse.json(todo)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error toggling subtask:', error)
    return NextResponse.json(
      { error: 'Failed to toggle subtask' },
      { status: 500 }
    )
  }
}
