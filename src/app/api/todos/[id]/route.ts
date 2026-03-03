import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import { evaluateAccomplishment } from '@/lib/accomplishment-agent'
import { z } from 'zod'

const subtaskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(1000),
  completed: z.boolean().optional(),
  order: z.number().int(),
})

const updateTodoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(10000).optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'WAITING', 'ON_HOLD', 'COMPLETED']).optional(),
  archived: z.boolean().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
  subtasks: z.array(subtaskSchema).optional(),
  myPrUrls: z.array(z.string().url()).optional(),
  githubPrUrls: z.array(z.string().url()).optional(),
  azureWorkItemUrl: z.string().url().optional().nullable(),
  azureDepUrls: z.array(z.string().url()).optional(),
  myIssueUrls: z.array(z.string().url()).optional(),
  githubIssueUrls: z.array(z.string().url()).optional(),
  notebookNoteId: z.string().optional().nullable(),
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
        notebookNote: { select: { id: true, title: true } },
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

      // Handle completedAt + auto-archive when status changes
      if (todoData.status !== undefined) {
        const current = await tx.todo.findUnique({
          where: todoWhere(id),
          select: { id: true, status: true },
        })

        if (!current) throw new Error('TODO_NOT_FOUND')
        resolvedTodoId = current.id

        if (todoData.status === 'COMPLETED') {
          todoData.archived = true
          ;(todoData as Record<string, unknown>).completedAt = new Date()
        } else if (current.status === 'COMPLETED') {
          ;(todoData as Record<string, unknown>).completedAt = null
          todoData.archived = false

          // Delete linked accomplishment when un-completing
          await tx.accomplishment.deleteMany({
            where: { todoId: current.id },
          })
        }
      }

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
          notebookNote: { select: { id: true, title: true } },
        },
      })

      return updatedTodo
    })

    // If the task was just completed, evaluate it for accomplishment
    if (validatedData.status === 'COMPLETED') {
      evaluateAccomplishment({
        id: todo.id,
        title: todo.title,
        description: todo.description,
        labels: todo.labels,
        completedAt: new Date(),
      })
    }

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
    const where = todoWhere(id)

    // Resolve the actual id (could be a taskNumber lookup)
    const todo = await db.todo.findUnique({ where, select: { id: true } })
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }

    // Delete linked accomplishment before deleting the todo
    await db.accomplishment.deleteMany({ where: { todoId: todo.id } })

    await db.todo.delete({ where: { id: todo.id } })

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
