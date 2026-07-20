import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import { labelInclude } from '@/lib/label-queries'
import {
  conflict,
  created,
  handleApiError,
  internalError,
  ok,
  parseJsonBody,
} from '@/lib/server/api-responses'
import { isPrismaErrorCode } from '@/lib/server/prisma-errors'
import { createLabelSchema } from '@/lib/validation/label'

export async function GET(request: Request) {
  try {
    // status=active (default) hides archived labels from pickers and the
    // active list; status=archived returns only the archive; status=all both.
    const status = new URL(request.url).searchParams.get('status')
    const where =
      status === 'all'
        ? {}
        : status === 'archived'
          ? { archived: true }
          : { archived: false }

    const labels = await db.label.findMany({
      where,
      include: labelInclude,
      orderBy: { name: 'asc' },
    })
    return ok(labels)
  } catch (error) {
    return internalError(
      'Failed to fetch labels',
      error,
      'Error fetching labels',
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await parseJsonBody(request, createLabelSchema)
    const label = await db.label.create({
      data: {
        name: data.name,
        ...(data.color ? { color: data.color } : {}),
        ...(data.billingCodes && data.billingCodes.length > 0
          ? {
              billingCodes: {
                create: data.billingCodes.map((billingCode) => ({
                  type: billingCode.type,
                  code: billingCode.code,
                  description: billingCode.description ?? null,
                  order: billingCode.order,
                })),
              },
            }
          : {}),
      },
      include: labelInclude,
    })

    emit('labels')
    return created(label)
  } catch (error) {
    // A unique-name clash usually means an archived label still holds the
    // name — surface that instead of a generic 500 so the user can restore it.
    if (isPrismaErrorCode(error, 'P2002')) {
      return conflict(
        'A label with this name already exists (it may be archived).',
      )
    }

    return handleApiError(
      error,
      'Failed to create label',
      'Error creating label',
    )
  }
}
