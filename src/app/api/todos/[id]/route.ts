import { NextRequest, NextResponse } from 'next/server'
import { Prisma, Priority as PrismaPriority, Status as PrismaStatus } from '@prisma/client'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import { evaluateAccomplishment } from '@/lib/accomplishment-agent'
import { todoInclude, todoWhere } from '@/lib/todo-queries'
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
  status: z.enum(['TODO', 'IN_PROGRESS', 'WAITING', 'UNDER_REVIEW', 'ON_HOLD', 'COMPLETED']).optional(),
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
      include: todoInclude,
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
    const { labelIds, subtasks, notebookNoteId, dueDate, ...todoData } = validatedData

    const todo = await db.$transaction(async (tx) => {
      let resolvedTodoId: string | null = null
      let completedAt: Date | null | undefined

      const needsExistingTodo = todoData.status !== undefined || subtasks !== undefined
      const existingTodo = needsExistingTodo
        ? await tx.todo.findUnique({
            where: todoWhere(id),
            select: {
              id: true,
              status: true,
              subtasks: { select: { id: true } },
            },
          })
        : null

      if (needsExistingTodo && !existingTodo) {
        throw new Error('TODO_NOT_FOUND')
      }

      resolvedTodoId = existingTodo?.id ?? null

      // Handle completedAt + auto-archive when status changes
      if (todoData.status !== undefined) {
        if (todoData.status === 'COMPLETED') {
          todoData.archived = true
          completedAt = new Date()
        } else if (existingTodo?.status === 'COMPLETED') {
          completedAt = null
          todoData.archived = false

          // Delete linked accomplishment when un-completing
          await tx.accomplishment.deleteMany({
            where: { todoId: existingTodo.id },
          })
        }
      }

      // If subtasks are provided, do a declarative sync with ownership validation.
      if (subtasks !== undefined && existingTodo) {
        const existingSubtaskIds = new Set(existingTodo.subtasks.map((subtask) => subtask.id))
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
              todoId: existingTodo.id,
            },
          })
        }

        await Promise.all(subtasks.map((subtask) => {
          if (subtask.id) {
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
              title: subtask.title,
              completed: subtask.completed ?? false,
              order: subtask.order,
              todoId: existingTodo.id,
            },
          })
        }))
      }

      const updateData: Prisma.TodoUpdateInput = {}

      if (todoData.title !== undefined) updateData.title = todoData.title
      if (todoData.description !== undefined) updateData.description = todoData.description
      if (todoData.status !== undefined) updateData.status = todoData.status as PrismaStatus
      if (todoData.archived !== undefined) updateData.archived = todoData.archived
      if (todoData.priority !== undefined) updateData.priority = todoData.priority as PrismaPriority
      if (todoData.myPrUrls !== undefined) updateData.myPrUrls = todoData.myPrUrls
      if (todoData.githubPrUrls !== undefined) updateData.githubPrUrls = todoData.githubPrUrls
      if (todoData.azureWorkItemUrl !== undefined) updateData.azureWorkItemUrl = todoData.azureWorkItemUrl
      if (todoData.azureDepUrls !== undefined) updateData.azureDepUrls = todoData.azureDepUrls
      if (todoData.myIssueUrls !== undefined) updateData.myIssueUrls = todoData.myIssueUrls
      if (todoData.githubIssueUrls !== undefined) updateData.githubIssueUrls = todoData.githubIssueUrls

      if (completedAt !== undefined) {
        updateData.completedAt = completedAt
      }

      if (labelIds !== undefined) {
        updateData.labels = { set: labelIds.map((labelId) => ({ id: labelId })) }
      }

      if (dueDate !== undefined) {
        updateData.dueDate = dueDate ? new Date(dueDate) : null
      }

      if (notebookNoteId !== undefined) {
        updateData.notebookNote = notebookNoteId === null
          ? { disconnect: true }
          : { connect: { id: notebookNoteId } }
      }

      const updatedTodo = await tx.todo.update({
        where: resolvedTodoId ? { id: resolvedTodoId } : todoWhere(id),
        data: updateData,
        include: todoInclude,
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
  _request: NextRequest,
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
