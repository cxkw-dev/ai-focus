import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
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
  myPrUrl: z.string().url().optional().nullable(),
  githubPrUrls: z.array(z.string().url()).optional(),
})

// Resolve an id param that could be a cuid or a task number (e.g. "7")
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

    const todo = await db.$transaction(async (tx) => {
      let resolvedTodoId: string | null = null

      // If subtasks are provided, do a declarative sync with ownership validation.
      if (subtasks !== undefined) {
        const existing = await tx.todo.findUnique({
          where: todoWhere(id),
          select: { id: true, subtasks: { select: { id: true } } },
        })

        if (!existing) {
          throw new Error('TODO_NOT_FOUND')
        }

        resolvedTodoId = existing.id

        const existingSubtaskIds = new Set(existing.subtasks.map((subtask) => subtask.id))
        const incomingSubtaskIds = new Set(
          subtasks
            .map((subtask) => subtask.id)
            .filter((subtaskId): subtaskId is string => !!subtaskId)
        )

        const unknownSubtaskIds = Array.from(incomingSubtaskIds).filter(
          (subtaskId) => !existingSubtaskIds.has(subtaskId)
        )

        if (unknownSubtaskIds.length > 0) {
          throw new Error('INVALID_SUBTASK_ID')
        }

        const subtaskIdsToDelete = Array.from(existingSubtaskIds).filter(
          (existingId) => !incomingSubtaskIds.has(existingId)
        )

        if (subtaskIdsToDelete.length > 0) {
          await tx.subtask.deleteMany({
            where: {
              id: { in: subtaskIdsToDelete },
              todoId: existing.id,
            },
          })
        }

        for (const subtask of subtasks) {
          if (subtask.id) {
            await tx.subtask.update({
              where: { id: subtask.id },
              data: {
                title: subtask.title,
                completed: subtask.completed ?? false,
                order: subtask.order,
              },
            })
            continue
          }

          await tx.subtask.create({
            data: {
              title: subtask.title,
              completed: subtask.completed ?? false,
              order: subtask.order,
              todoId: existing.id,
            },
          })
        }
      }

      const updatedTodo = await tx.todo.update({
        where: resolvedTodoId ? { id: resolvedTodoId } : todoWhere(id),
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

      return updatedTodo
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

    if (error instanceof Error && error.message === 'INVALID_SUBTASK_ID') {
      return NextResponse.json(
        { error: 'One or more subtasks do not belong to this todo' },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'TODO_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      )
    }

    if (isNotFoundError(error)) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
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
    if (isNotFoundError(error)) {
      return NextResponse.json(
        { error: 'Todo not found' },
        { status: 404 }
      )
    }

    console.error('Error deleting todo:', error)
    return NextResponse.json(
      { error: 'Failed to delete todo' },
      { status: 500 }
    )
  }
}
