'use client'

import { IconButton } from '@/components/ui/button'
import type { ViewMode } from './todo-item'
import type { Todo } from '@/types/todo'

interface TodoItemActionsProps {
  todo: Todo
  viewMode: ViewMode
  onDelete: (id: string) => void
  onEdit: (todo: Todo) => void
  onRestore?: (id: string) => void
  onOpenNote?: (todoId: string, noteId: string) => void
}

/** Dense ghost icon buttons for a card: quiet until hovered. */
const ACTION_CLASS = 'p-1 text-quiet hover:text-text'
const DANGER_ACTION_CLASS = 'p-1 text-quiet hover:text-bad'

export function TodoItemActions({
  todo,
  viewMode,
  onDelete,
  onEdit,
  onRestore,
  onOpenNote,
}: TodoItemActionsProps) {
  const noteId = todo.notebookNoteId

  return (
    <div className="flex flex-none items-center gap-0.5">
      {(viewMode === 'active' || viewMode === 'completed') && (
        <>
          {noteId && (
            <IconButton
              icon="file"
              label="Open note"
              size="sm"
              className={ACTION_CLASS}
              onClick={() => onOpenNote?.(todo.id, noteId)}
            />
          )}
          <IconButton
            icon="edit"
            label="Edit"
            size="sm"
            className={ACTION_CLASS}
            onClick={() => onEdit(todo)}
          />
          <IconButton
            icon="trash"
            label="Delete"
            size="sm"
            className={DANGER_ACTION_CLASS}
            onClick={() => onDelete(todo.id)}
          />
        </>
      )}
      {viewMode === 'deleted' && (
        <>
          <IconButton
            icon="refresh"
            label="Restore"
            size="sm"
            className={ACTION_CLASS}
            onClick={() => onRestore?.(todo.id)}
          />
          <IconButton
            icon="trash"
            label="Delete permanently"
            size="sm"
            className={DANGER_ACTION_CLASS}
            onClick={() => onDelete(todo.id)}
          />
        </>
      )}
      <span className="text-quiet ml-1 font-mono text-xs tabular-nums">
        #{todo.taskNumber}
      </span>
    </div>
  )
}
