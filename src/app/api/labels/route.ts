import { db } from '@/lib/db'
import { emit } from '@/lib/events'
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
    const label = await db.label.create({ data })

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
