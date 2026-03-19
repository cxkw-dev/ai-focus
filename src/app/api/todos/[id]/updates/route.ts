import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'

const createSchema = z.object({
  content: z.string().min(1).max(5000),
  status: z.enum(['TODO', 'IN_PROGRESS', 'WAITING', 'UNDER_REVIEW', 'ON_HOLD', 'COMPLETED']).optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const updates = await db.statusUpdate.findMany({
    where: { todoId: id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(updates)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = createSchema.parse(body)

    const todo = await db.todo.findUnique({ where: { id }, select: { id: true } })
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }

    const update = await db.statusUpdate.create({
      data: {
        todoId: id,
        content: data.content,
        status: data.status ?? null,
      },
    })
    emit('todoUpdates', { todoId: id })
    return NextResponse.json(update, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    throw err
  }
}
