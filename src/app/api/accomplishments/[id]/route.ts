import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import {
  handleApiError,
  internalError,
  notFound,
  ok,
  parseJsonBody,
} from '@/lib/server/api-responses'
import { updateAccomplishmentSchema } from '@/lib/validation/accomplishment'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const data = await parseJsonBody(request, updateAccomplishmentSchema)

    const updateData: Prisma.AccomplishmentUpdateInput = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) {
      updateData.description = data.description
    }
    if (data.category !== undefined) updateData.category = data.category
    if (data.date !== undefined) {
      const nextDate = new Date(data.date)
      updateData.date = nextDate
      updateData.year = nextDate.getFullYear()
    }

    const result = await db.$transaction(async (tx) => {
      const existing = await tx.accomplishment.findUnique({
        where: { id },
        select: { year: true },
      })

      if (!existing) {
        return null
      }

      const accomplishment = await tx.accomplishment.update({
        where: { id },
        data: updateData,
      })

      return { accomplishment, previousYear: existing.year }
    })

    if (!result) {
      return notFound('Accomplishment not found')
    }

    emit('accomplishments', { year: result.accomplishment.year })
    if (result.previousYear !== result.accomplishment.year) {
      emit('accomplishments', { year: result.previousYear })
    }

    return ok(result.accomplishment)
  } catch (error) {
    return handleApiError(
      error,
      'Failed to update accomplishment',
      'Error updating accomplishment',
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const deleted = await db.$transaction(async (tx) => {
      const existing = await tx.accomplishment.findUnique({
        where: { id },
        select: { year: true },
      })

      if (!existing) {
        return null
      }

      await tx.accomplishment.delete({ where: { id } })
      return existing
    })

    if (!deleted) {
      return notFound('Accomplishment not found')
    }

    emit('accomplishments', { year: deleted.year })
    return ok({ success: true })
  } catch (error) {
    return internalError(
      'Failed to delete accomplishment',
      error,
      'Error deleting accomplishment',
    )
  }
}
