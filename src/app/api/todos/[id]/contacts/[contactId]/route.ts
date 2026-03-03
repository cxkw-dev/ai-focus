import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'

const updateContactSchema = z.object({
  role: z.string().min(1).optional(),
  order: z.number().int().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { id, contactId } = await params
  const body = await request.json()
  const data = updateContactSchema.parse(body)

  const contact = await db.todoContact.update({
    where: { id: contactId, todoId: id },
    data,
    include: { person: { select: { id: true, name: true, email: true } } },
  })
  emit('todos')
  return NextResponse.json(contact)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { id, contactId } = await params
  await db.todoContact.delete({
    where: { id: contactId, todoId: id },
  })
  emit('todos')
  return NextResponse.json({ success: true })
}
