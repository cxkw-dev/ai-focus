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

const updateTodoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'WAITING', 'ON_HOLD', 'COMPLETED']).optional(),
  archived: z.boolean().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
  subtasks: z.array(subtaskSchema).optional(),
})

// Resolve an id param that could be a cuid or a task number (e.g. "7")
function todoWhere(id: string) {
  const num = Number(id)
  if (Number.isInteger(num) && num > 0) {
    return { taskNumber: num }
  }
  return { id }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const todo = await db.todo.findUnique({
      where: todoWhere(id),
      include: {
        labels: { orderBy: { name: 'asc' } },
        subtasks: { orderBy: { order: 'asc' } },
      },
    })

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }

    return NextResponse.json(todo)
  } catch (error) {
    console.error('Error fetching todo:', error)
    return NextResponse.json(
      { error: 'Failed to fetch todo' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateTodoSchema.parse(body)
    const { labelIds, subtasks, ...todoData } = validatedData

    // If subtasks are provided, do a declarative sync in a transaction
    if (subtasks !== undefined) {
      // Resolve the actual todo id (might be a task number)
      const existing = await db.todo.findUniqueOrThrow({
        where: todoWhere(id),
        select: { id: true, subtasks: { select: { id: true } } },
      })
      const todoId = existing.id
      const incomingIds = subtasks.filter(s => s.id).map(s => s.id!)
      const toDelete = existing.subtasks.filter(s => !incomingIds.includes(s.id)).map(s => s.id)

      await db.$transaction([
        // Delete removed subtasks
        ...(toDelete.length ? [db.subtask.deleteMany({ where: { id: { in: toDelete } } })] : []),
        // Upsert each subtask
        ...subtasks.map(s =>
          s.id
            ? db.subtask.update({
                where: { id: s.id },
                data: { title: s.title, completed: s.completed ?? false, order: s.order },
              })
            : db.subtask.create({
                data: { title: s.title, completed: s.completed ?? false, order: s.order, todoId },
              })
        ),
      ])
    }

    const todo = await db.todo.update({
      where: todoWhere(id),
      data: {
        ...todoData,
        ...(labelIds
          ? { labels: { set: labelIds.map((labelId) => ({ id: labelId })) } }
          : {}),
        dueDate: validatedData.dueDate
          ? new Date(validatedData.dueDate)
          : validatedData.dueDate === null
          ? null
          : undefined,
      },
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

    console.error('Error updating todo:', error)
    return NextResponse.json(
      { error: 'Failed to update todo' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.todo.delete({
      where: todoWhere(id),
    })

    emit('todos')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting todo:', error)
    return NextResponse.json(
      { error: 'Failed to delete todo' },
      { status: 500 }
    )
  }
}
