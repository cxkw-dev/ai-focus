import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const CATEGORIES = ['DELIVERY', 'HIRING', 'MENTORING', 'COLLABORATION', 'GROWTH'] as const

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  category: z.enum(CATEGORIES).optional(),
  date: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid date').optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateSchema.parse(body)

    const updateData: Record<string, unknown> = { ...data }
    if (data.date) {
      const date = new Date(data.date)
      updateData.date = date
      updateData.year = date.getFullYear()
    }

    const accomplishment = await db.accomplishment.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(accomplishment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 },
      )
    }

    console.error('Error updating accomplishment:', error)
    return NextResponse.json({ error: 'Failed to update accomplishment' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await db.accomplishment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting accomplishment:', error)
    return NextResponse.json({ error: 'Failed to delete accomplishment' }, { status: 500 })
  }
}
