import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import { todoWhere } from '@/lib/todo-queries'

const createSessionSchema = z.object({
  tool: z.enum(['claude', 'codex']),
  command: z.string().min(1),
  workingPath: z.string().min(1),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const parsed = createSessionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
  }

  const todo = await db.todo.findUnique({ where: todoWhere(id) })
  if (!todo) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
  }

  const session = await db.session.create({
    data: {
      tool: parsed.data.tool,
      command: parsed.data.command,
      workingPath: parsed.data.workingPath,
      todoId: todo.id,
    },
  })

  emit('todos')
  return NextResponse.json(session, { status: 201 })
}
