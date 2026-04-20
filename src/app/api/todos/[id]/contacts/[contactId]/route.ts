import { NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import {
  internalError,
  notFound,
  parseJsonBody,
  validationError,
} from '@/lib/server/api-responses'

const updateContactSchema = z.object({
  role: z.string().min(1).optional(),
  order: z.number().int().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  try {
    const { id, contactId } = await params
    const data = await parseJsonBody(request, updateContactSchema)

    const updated = await db.todoContact.updateMany({
      where: { id: contactId, todoId: id },
      data,
    })

    if (updated.count === 0) {
      return notFound('Contact not found')
    }

    const contact = await db.todoContact.findUniqueOrThrow({
      where: { id: contactId },
      include: { person: { select: { id: true, name: true, email: true } } },
    })
    emit('todoContacts', { todoId: id })
    return NextResponse.json(contact)
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error)
    }
    return internalError(
      'Failed to update contact',
      error,
      'Error updating contact',
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  try {
    const { id, contactId } = await params
    const deleted = await db.todoContact.deleteMany({
      where: { id: contactId, todoId: id },
    })

    if (deleted.count === 0) {
      return notFound('Contact not found')
    }

    emit('todoContacts', { todoId: id })
    return NextResponse.json({ success: true })
  } catch (error) {
    return internalError(
      'Failed to delete contact',
      error,
      'Error deleting contact',
    )
  }
}
