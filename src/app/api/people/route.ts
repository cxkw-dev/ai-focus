import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import {
  conflict,
  created,
  internalError,
  ok,
  parseJsonBody,
  validationError,
} from '@/lib/server/api-responses'
import { isPrismaErrorCode } from '@/lib/server/prisma-errors'
import { createPersonSchema } from '@/lib/validation/person'
import { ZodError } from 'zod'

export async function GET() {
  try {
    const people = await db.person.findMany({
      orderBy: { name: 'asc' },
    })
    return ok(people)
  } catch (error) {
    return internalError(
      'Failed to fetch people',
      error,
      'Error fetching people',
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await parseJsonBody(request, createPersonSchema)
    const person = await db.person.create({ data })

    emit('people')
    return created(person)
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error)
    }

    if (isPrismaErrorCode(error, 'P2002')) {
      return conflict('A contact with this email already exists')
    }

    return internalError(
      'Failed to create person',
      error,
      'Error creating person',
    )
  }
}
