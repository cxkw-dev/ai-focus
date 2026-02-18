import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { emit } from '@/lib/events'

const createPersonSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address').max(200),
})

export async function GET() {
  try {
    const people = await db.person.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(people)
  } catch (error) {
    console.error('Error fetching people:', error)
    return NextResponse.json(
      { error: 'Failed to fetch people' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createPersonSchema.parse(body)

    const person = await db.person.create({
      data: validatedData,
    })

    emit('people')
    return NextResponse.json(person, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating person:', error)
    return NextResponse.json(
      { error: 'Failed to create person' },
      { status: 500 }
    )
  }
}
