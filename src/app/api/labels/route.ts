import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import { labelInclude } from '@/lib/label-queries'
import {
  created,
  internalError,
  ok,
  parseJsonBody,
  validationError,
} from '@/lib/server/api-responses'
import { createLabelSchema } from '@/lib/validation/label'
import { ZodError } from 'zod'

export async function GET() {
  try {
    const labels = await db.label.findMany({
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
    if (error instanceof ZodError) {
      return validationError(error)
    }

    return internalError(
      'Failed to create label',
      error,
      'Error creating label',
    )
  }
}
