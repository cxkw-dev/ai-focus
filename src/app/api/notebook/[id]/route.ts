import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import {
  handleApiError,
  notFound,
  ok,
  parseJsonBody,
} from '@/lib/server/api-responses'
import { z } from 'zod'

const updateNoteSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().max(100000).optional(),
  pinned: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const note = await db.notebookNote.findUnique({
      where: { id },
      include: {
        todo: {
          select: {
            id: true,
            taskNumber: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            labels: { select: { id: true, name: true, color: true } },
          },
        },
      },
    })

    if (!note) {
      return notFound('Note not found')
    }

    return ok(note)
  } catch (error) {
    return handleApiError(
      error,
      'Failed to fetch note',
      'Error fetching notebook note',
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const validatedData = await parseJsonBody(request, updateNoteSchema)

    const note = await db.notebookNote.update({
      where: { id },
      data: validatedData,
      include: {
        todo: {
          select: {
            id: true,
            taskNumber: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            labels: { select: { id: true, name: true, color: true } },
          },
        },
      },
    })

    emit('notebook')
    return ok(note)
  } catch (error) {
    return handleApiError(
      error,
      'Failed to update note',
      'Error updating notebook note',
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await db.notebookNote.delete({
      where: { id },
    })

    emit('notebook')
    return ok({ success: true })
  } catch (error) {
    return handleApiError(
      error,
      'Failed to delete note',
      'Error deleting notebook note',
    )
  }
}
