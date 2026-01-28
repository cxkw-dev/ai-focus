import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const reorderSchema = z.object({
  orderedIds: z.array(z.string()),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderedIds } = reorderSchema.parse(body)

    // Update each todo with its new order
    await db.$transaction(
      orderedIds.map((id, index) =>
        db.todo.update({
          where: { id },
          data: { order: index },
        })
      )
    )

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
