import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { handleApiError, ok, parseJsonBody } from '@/lib/server/api-responses'

const NOTE_ID = 'default'

const noteSchema = z.object({
  content: z.string().max(20000),
})

export async function GET() {
  try {
    const note = await db.note.findUnique({
      where: { id: NOTE_ID },
    })

    return ok({
      id: NOTE_ID,
      content: note?.content ?? '',
      updatedAt: note?.updatedAt ?? null,
    })
  } catch (error) {
    return handleApiError(error, 'Failed to fetch note', 'Error fetching note')
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { content } = await parseJsonBody(request, noteSchema)

    const note = await db.note.upsert({
      where: { id: NOTE_ID },
      update: { content },
      create: { id: NOTE_ID, content },
    })

    return ok(note)
  } catch (error) {
    return handleApiError(error, 'Failed to save note', 'Error saving note')
  }
}
