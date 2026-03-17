import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { activeTodoOrderBy, todoInclude } from '@/lib/todo-queries'

export async function GET() {
  try {
    const [active, completed, deleted] = await Promise.all([
      db.todo.findMany({
        where: {
          archived: false,
          status: { not: 'COMPLETED' },
        },
        include: todoInclude,
        orderBy: activeTodoOrderBy,
      }),
      db.todo.findMany({
        where: {
          archived: true,
          status: 'COMPLETED',
        },
        include: todoInclude,
        orderBy: activeTodoOrderBy,
      }),
      db.todo.findMany({
        where: {
          archived: true,
          status: { not: 'COMPLETED' },
        },
        include: todoInclude,
        orderBy: activeTodoOrderBy,
      }),
    ])

    return NextResponse.json({ active, completed, deleted })
  } catch (error) {
    console.error('Error fetching todo board:', error)
    return NextResponse.json(
      { error: 'Failed to fetch todo board' },
      { status: 500 }
    )
  }
}
