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
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  const { id, contactId } = await params
  const body = await request.json()
  const data = updateContactSchema.parse(body)

  const updated = await db.todoContact.updateMany({
    where: { id: contactId, todoId: id },
    data,
  })

  if (updated.count === 0) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }

  const contact = await db.todoContact.findUniqueOrThrow({
    where: { id: contactId },
    include: { person: { select: { id: true, name: true, email: true } } },
  })
  emit('todoContacts', { todoId: id })
  return NextResponse.json(contact)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  const { id, contactId } = await params
  const deleted = await db.todoContact.deleteMany({
    where: { id: contactId, todoId: id },
  })

  if (deleted.count === 0) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }

  emit('todoContacts', { todoId: id })
  return NextResponse.json({ success: true })
}
