'use client'

import { IconButton } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  PriorityMenuGroup,
  REVEAL_ON_CARD_HOVER,
  StatusMenuGroup,
} from './todo-display'
import type { ViewMode } from './todo-item'
import type { Priority, Status, Todo } from '@/types/todo'

interface TodoItemActionsProps {
  todo: Todo
  viewMode: ViewMode
  onStatusChange: (id: string, status: Status) => void
  onPriorityChange: (id: string, priority: Priority) => void
  onDelete: (id: string) => void
  onEdit: (todo: Todo) => void
  onRestore?: (id: string) => void
  onOpenNote?: (todoId: string, noteId: string) => void
}

/** Dense ghost icon buttons for a card. */
const ACTION_CLASS = 'p-1 text-quiet hover:text-text'
const DANGER_ACTION_CLASS = 'p-1 text-quiet hover:text-bad'

/**
 * A card's actions, all in one ⋯ menu (edit, open note, status, priority, delete) so the footer stays one quiet row
 * on a narrow lane. It waits for the card's hover or focus, and stays put while its menu is open. Trashed cards get
 * restore and delete-for-good buttons instead.
 */
export function TodoItemActions({
  todo,
  viewMode,
  onStatusChange,
  onPriorityChange,
  onDelete,
  onEdit,
  onRestore,
  onOpenNote,
}: TodoItemActionsProps) {
  const noteId = todo.notebookNoteId

  return (
    <div
      className={cn(
        'flex flex-none items-center',
        REVEAL_ON_CARD_HOVER,
        'has-[[data-state=open]]:opacity-100',
      )}
    >
      {viewMode === 'deleted' ? (
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
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton
              icon="more"
              label="More actions"
              noTip
              size="sm"
              className={cn(
                ACTION_CLASS,
                'data-[state=open]:bg-wash-strong data-[state=open]:text-text',
              )}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            collisionPadding={10}
            className="min-w-44"
          >
            <DropdownMenuItem icon="edit" onSelect={() => onEdit(todo)}>
              Edit
            </DropdownMenuItem>
            {noteId && (
              <DropdownMenuItem
                icon="file"
                onSelect={() => onOpenNote?.(todo.id, noteId)}
              >
                Open note
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {viewMode === 'active' && (
              <>
                <StatusMenuGroup todo={todo} onStatusChange={onStatusChange} />
                <DropdownMenuSeparator />
                <PriorityMenuGroup
                  todo={todo}
                  onPriorityChange={onPriorityChange}
                />
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              icon="trash"
              danger
              onSelect={() => onDelete(todo.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
