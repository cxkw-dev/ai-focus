import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { emit } from '@/lib/events'

const updatePersonSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(200).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updatePersonSchema.parse(body)

    const person = await db.person.update({
      where: { id },
      data: validatedData,
    })

    emit('people')
    return NextResponse.json(person)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating person:', error)
    return NextResponse.json(
      { error: 'Failed to update person' },
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
    await db.person.delete({ where: { id } })
    emit('people')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting person:', error)
    return NextResponse.json(
      { error: 'Failed to delete person' },
      { status: 500 }
    )
  }
}
