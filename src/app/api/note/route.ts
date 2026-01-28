import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const NOTE_ID = 'default'

const noteSchema = z.object({
  content: z.string().max(20000),
})

export async function GET() {
  try {
    const note = await db.note.findUnique({
      where: { id: NOTE_ID },
    })

    return NextResponse.json({
      id: NOTE_ID,
      content: note?.content ?? '',
      updatedAt: note?.updatedAt ?? null,
    })
  } catch (error) {
    console.error('Error fetching note:', error)
    return NextResponse.json(
      { error: 'Failed to fetch note' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { content } = noteSchema.parse(body)

    const note = await db.note.upsert({
      where: { id: NOTE_ID },
      update: { content },
      create: { id: NOTE_ID, content },
    })

    return NextResponse.json(note)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error saving note:', error)
    return NextResponse.json(
      { error: 'Failed to save note' },
      { status: 500 }
    )
  }
}
