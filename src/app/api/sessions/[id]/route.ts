import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const session = await db.session.findUnique({ where: { id } })
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  await db.session.delete({ where: { id } })
  emit('todos')
  return NextResponse.json({ success: true })
}
