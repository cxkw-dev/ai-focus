import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import {
  created,
  handleApiError,
  ok,
  parseJsonBody,
} from '@/lib/server/api-responses'
import {
  createAccomplishmentSchema,
  parseListAccomplishmentsQuery,
} from '@/lib/validation/accomplishment'

export async function GET(request: Request) {
  try {
    const { year } = parseListAccomplishmentsQuery(
      new URL(request.url).searchParams,
    )

    const accomplishments = await db.accomplishment.findMany({
      where: { year },
      orderBy: { date: 'desc' },
    })

    return ok(accomplishments)
  } catch (error) {
    return handleApiError(
      error,
      'Failed to fetch accomplishments',
      'Error fetching accomplishments',
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await parseJsonBody(request, createAccomplishmentSchema)
    const date = new Date(data.date)

    const accomplishment = await db.accomplishment.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        date,
        year: date.getFullYear(),
      },
    })

    emit('accomplishments', { year: date.getFullYear() })
    return created(accomplishment)
  } catch (error) {
    return handleApiError(
      error,
      'Failed to create accomplishment',
      'Error creating accomplishment',
    )
  }
}
