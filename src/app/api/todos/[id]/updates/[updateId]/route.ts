import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; updateId: string }> }
) {
  const { id, updateId } = await params
  await db.statusUpdate.delete({
    where: { id: updateId, todoId: id },
  })
  emit('todoUpdates', { todoId: id })
  return NextResponse.json({ success: true })
}
