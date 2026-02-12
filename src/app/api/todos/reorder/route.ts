import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import { z } from 'zod'

const reorderSchema = z.object({
  orderedIds: z.array(z.string().min(1))
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, 'orderedIds must be unique'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderedIds } = reorderSchema.parse(body)

    const matchedTodoCount = await db.todo.count({
      where: {
        id: { in: orderedIds },
        archived: false,
      },
    })

    if (matchedTodoCount !== orderedIds.length) {
      return NextResponse.json(
        { error: 'One or more todos are invalid or archived' },
        { status: 400 }
      )
    }

    // Update each todo with its new order
    await db.$transaction(
      orderedIds.map((id, index) =>
        db.todo.update({
          where: { id },
          data: { order: index },
        })
      )
    )

    emit('todos')
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error reordering todos:', error)
    return NextResponse.json(
      { error: 'Failed to reorder todos' },
      { status: 500 }
    )
  }
}
