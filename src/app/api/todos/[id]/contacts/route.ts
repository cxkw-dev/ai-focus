import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'

const addContactSchema = z.object({
  personId: z.string(),
  role: z.string().min(1),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const contacts = await db.todoContact.findMany({
    where: { todoId: id },
    include: { person: { select: { id: true, name: true, email: true } } },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(contacts)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const data = addContactSchema.parse(body)

  try {
    const count = await db.todoContact.count({ where: { todoId: id } })
    const contact = await db.todoContact.create({
      data: {
        todoId: id,
        personId: data.personId,
        role: data.role,
        order: count,
      },
      include: { person: { select: { id: true, name: true, email: true } } },
    })
    emit('todos')
    return NextResponse.json(contact, { status: 201 })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      return NextResponse.json({ error: 'Contact already assigned to this task' }, { status: 409 })
    }
    throw err
  }
}
