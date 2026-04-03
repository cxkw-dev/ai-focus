import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const CATEGORIES = [
  'DELIVERY',
  'HIRING',
  'MENTORING',
  'COLLABORATION',
  'GROWTH',
  'OTHER',
] as const

const createSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(CATEGORIES),
  date: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid date'),
})

export async function GET(request: NextRequest) {
  try {
    const yearParam = request.nextUrl.searchParams.get('year')
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()

    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
    }

    const accomplishments = await db.accomplishment.findMany({
      where: { year },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(accomplishments)
  } catch (error) {
    console.error('Error fetching accomplishments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accomplishments' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createSchema.parse(body)
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

    return NextResponse.json(accomplishment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 },
      )
    }

    console.error('Error creating accomplishment:', error)
    return NextResponse.json(
      { error: 'Failed to create accomplishment' },
      { status: 500 },
    )
  }
}
