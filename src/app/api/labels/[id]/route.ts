import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import { labelInclude } from '@/lib/label-queries'
import {
  handleApiError,
  internalError,
  notFound,
  ok,
  parseJsonBody,
} from '@/lib/server/api-responses'
import { isPrismaErrorCode } from '@/lib/server/prisma-errors'
import { updateLabelSchema } from '@/lib/validation/label'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const data = await parseJsonBody(request, updateLabelSchema)
    const label = await db.$transaction(async (tx) => {
      await tx.label.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.color !== undefined ? { color: data.color } : {}),
          ...(data.repoUrl !== undefined ? { repoUrl: data.repoUrl } : {}),
          ...(data.archived !== undefined
            ? {
                archived: data.archived,
                archivedAt: data.archived ? new Date() : null,
              }
            : {}),
        },
      })

      if (data.billingCodes !== undefined) {
        await tx.billingCode.deleteMany({ where: { labelId: id } })

        if (data.billingCodes.length > 0) {
          await tx.billingCode.createMany({
            data: data.billingCodes.map((billingCode) => ({
              type: billingCode.type,
              code: billingCode.code,
              description: billingCode.description ?? null,
              order: billingCode.order,
              labelId: id,
            })),
          })
        }
      }

      return tx.label.findUniqueOrThrow({
        where: { id },
        include: labelInclude,
      })
    })

    emit('labels')
    return ok(label)
  } catch (error) {
    if (isPrismaErrorCode(error, 'P2025')) {
      return notFound('Label not found')
    }

    return handleApiError(
      error,
      'Failed to update label',
      'Error updating label',
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    // Deleting a finished project's label archives it by default so every
    // historical todo association stays intact. ?purge=true removes it for
    // good (and cascades its billing codes) — used from the archive view.
    const purge = new URL(request.url).searchParams.get('purge') === 'true'

    if (purge) {
      await db.label.delete({ where: { id } })
      emit('labels')
      return ok({ success: true, purged: true })
    }

    await db.label.update({
      where: { id },
      data: { archived: true, archivedAt: new Date() },
    })
    emit('labels')
    return ok({ success: true, archived: true })
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
