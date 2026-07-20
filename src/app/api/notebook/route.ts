import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import {
  created,
  handleApiError,
  ok,
  parseJsonBody,
} from '@/lib/server/api-responses'
import { z } from 'zod'

const createNoteSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().max(100000).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (search) {
      where.title = { contains: search, mode: 'insensitive' }
    }

    const notes = await db.notebookNote.findMany({
      where,
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
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
    })

    return ok(notes)
  } catch (error) {
    return handleApiError(
      error,
      'Failed to fetch notes',
      'Error fetching notebook notes',
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const validatedData = await parseJsonBody(request, createNoteSchema)

    const note = await db.notebookNote.create({
      data: {
        title: validatedData.title ?? 'Untitled',
        content: validatedData.content ?? '',
      },
    })

    emit('notebook')
    return created(note)
  } catch (error) {
    return handleApiError(
      error,
      'Failed to create note',
      'Error creating notebook note',
    )
  }
}
