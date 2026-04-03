import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import {
  conflict,
  internalError,
  notFound,
  ok,
  parseJsonBody,
  validationError,
} from '@/lib/server/api-responses'
import { isPrismaErrorCode } from '@/lib/server/prisma-errors'
import { updatePersonSchema } from '@/lib/validation/person'
import { ZodError } from 'zod'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const data = await parseJsonBody(request, updatePersonSchema)
    const person = await db.person.update({ where: { id }, data })

    emit('people')
    return ok(person)
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error)
    }

    if (isPrismaErrorCode(error, 'P2002')) {
      return conflict('A contact with this email already exists')
    }

    if (isPrismaErrorCode(error, 'P2025')) {
      return notFound('Person not found')
    }

    return internalError(
      'Failed to update person',
      error,
      'Error updating person',
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await db.person.delete({ where: { id } })
    emit('people')
    return ok({ success: true })
  } catch (error) {
    if (isPrismaErrorCode(error, 'P2025')) {
      return notFound('Person not found')
    }

    return internalError(
      'Failed to delete person',
      error,
      'Error deleting person',
    )
  }
}
