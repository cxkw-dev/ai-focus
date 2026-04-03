import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import {
  internalError,
  notFound,
  ok,
  parseJsonBody,
  validationError,
} from '@/lib/server/api-responses'
import { isPrismaErrorCode } from '@/lib/server/prisma-errors'
import { updateLabelSchema } from '@/lib/validation/label'
import { ZodError } from 'zod'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const data = await parseJsonBody(request, updateLabelSchema)
    const label = await db.label.update({ where: { id }, data })

    emit('labels')
    return ok(label)
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error)
    }

    if (isPrismaErrorCode(error, 'P2025')) {
      return notFound('Label not found')
    }

    return internalError(
      'Failed to update label',
      error,
      'Error updating label',
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    await db.label.delete({ where: { id } })
    emit('labels')
    return ok({ success: true })
  } catch (error) {
    if (isPrismaErrorCode(error, 'P2025')) {
      return notFound('Label not found')
    }

    return internalError(
      'Failed to delete label',
      error,
      'Error deleting label',
    )
  }
}
