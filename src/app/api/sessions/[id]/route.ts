import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import { internalError, notFound } from '@/lib/server/api-responses'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const deleted = await db.session.deleteMany({ where: { id } })
    if (deleted.count === 0) {
      return notFound('Session not found')
    }

    emit('todos')
    return NextResponse.json({ success: true })
  } catch (error) {
    return internalError(
      'Failed to delete session',
      error,
      'Error deleting session',
    )
  }
}
