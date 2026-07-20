import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import {
  conflict,
  created,
  handleApiError,
  internalError,
  ok,
  parseJsonBody,
} from '@/lib/server/api-responses'
import { isPrismaErrorCode } from '@/lib/server/prisma-errors'
import { createPersonSchema } from '@/lib/validation/person'

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
    if (isPrismaErrorCode(error, 'P2002')) {
      return conflict('A contact with this email already exists')
    }

    return handleApiError(
      error,
      'Failed to create person',
      'Error creating person',
    )
  }
}
