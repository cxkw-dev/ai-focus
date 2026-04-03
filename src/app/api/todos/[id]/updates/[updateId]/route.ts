import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; updateId: string }> },
) {
  const { id, updateId } = await params
  try {
    await db.statusUpdate.delete({
      where: { id: updateId, todoId: id },
    })
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      err.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 })
    }
    throw err
  }
  emit('todoUpdates', { todoId: id })
  return NextResponse.json({ success: true })
}
