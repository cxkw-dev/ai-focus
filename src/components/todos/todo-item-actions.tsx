'use client'

import { Edit2, FileText, Minimize2, RotateCcw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHIP_BASE } from './todo-display'
import type { ViewMode } from './todo-item'
import type { Todo } from '@/types/todo'

interface TodoItemActionsProps {
  todo: Todo
  viewMode: ViewMode
  onDelete: (id: string) => void
  onEdit: (todo: Todo) => void
  onRestore?: (id: string) => void
  onOpenNote?: (todoId: string, noteId: string) => void
  onCollapse?: () => void
}

export function TodoItemActions({
  todo,
  viewMode,
  onDelete,
  onEdit,
  onRestore,
  onOpenNote,
  onCollapse,
}: TodoItemActionsProps) {
  return (
    <div className="flex flex-shrink-0 items-center gap-1">
      {onCollapse && (
        <button
          onClick={onCollapse}
          className={cn(CHIP_BASE, 'todo-action-edit')}
          title="Collapse"
        >
          <Minimize2 className="h-3 w-3" />
        </button>
      )}
      {(viewMode === 'active' || viewMode === 'completed') && (
        <>
          {todo.notebookNoteId && (
            <button
              onClick={() => onOpenNote?.(todo.id, todo.notebookNoteId!)}
              className={cn(CHIP_BASE, 'todo-action-edit')}
              title="Open note"
            >
              <FileText className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={() => onEdit(todo)}
            className={cn(CHIP_BASE, 'todo-action-edit')}
            title="Edit"
          >
            <Edit2 className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className={cn(CHIP_BASE, 'todo-action-delete')}
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </>
      )}
      {viewMode === 'deleted' && (
        <>
          <button
            onClick={() => onRestore?.(todo.id)}
            className={cn(CHIP_BASE, 'todo-action-restore')}
            title="Restore"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className={cn(CHIP_BASE, 'todo-action-destroy')}
            title="Delete permanently"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </>
      )}
      <span
        className="font-mono text-[11px] font-semibold"
        style={{ color: 'var(--text-muted)' }}
      >
        #{todo.taskNumber}
      </span>
    </div>
  )
}
