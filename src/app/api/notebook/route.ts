import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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
      orderBy: [
        { pinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('Error fetching notebook notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createNoteSchema.parse(body)

    const note = await db.notebookNote.create({
      data: {
        title: validatedData.title ?? 'Untitled',
        content: validatedData.content ?? '',
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating notebook note:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
}
