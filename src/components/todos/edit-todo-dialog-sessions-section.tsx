'use client'

import { SessionList } from './session-list'
import type { Session } from '@/types/todo'

interface EditTodoDialogSessionsSectionProps {
  sessions?: Session[]
  onDeleteSession: (sessionId: string) => void
}

export function EditTodoDialogSessionsSection({
  sessions,
  onDeleteSession,
}: EditTodoDialogSessionsSectionProps) {
  if (!sessions || sessions.length === 0) {
    return null
  }

  return <SessionList sessions={sessions} onDelete={onDeleteSession} compact />
}
