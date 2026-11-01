'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { Icon } from '@/components/ui/icon'
import { SubtaskMentionInput } from '@/components/ui/subtask-mention-input'
import { cn } from '@/lib/utils'
import type { Subtask } from '@/types/todo'

export function inlineSubtaskDndId(subtaskId: string) {
  return `subtask-${subtaskId}`
}

/**
 * One editable subtask on a card: drag handle, checkbox, inline mention editor and delete. The row takes a wash on
 * hover and while its editor has focus (a deeper one while dragged). The handle and delete are always shown.
 */
export function SortableInlineSubtaskRow({
  subtask,
  onToggle,
  onTitleChange,
  onTitleCommit,
  onDelete,
  mentions,
}: {
  subtask: Subtask
  onToggle: () => void
  onTitleChange: (title: string) => void
  onTitleCommit: () => void
  onDelete: () => void
  mentions: { id: string; name: string; email: string }[]
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: inlineSubtaskDndId(subtask.id),
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group/subtask rounded-ctl hover:bg-wash focus-within:bg-wash flex w-full min-w-0 items-start gap-1.5 py-0.5 pr-0.5 pl-0.5 text-sm transition-colors',
        isDragging && 'bg-wash-strong relative z-10',
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className={cn(
          'text-quiet hover:text-text flex flex-none touch-none items-center self-stretch',
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
        )}
        aria-label="Reorder subtask"
      >
        <GripVertical className="size-[1.15em]" aria-hidden />
      </button>
      <label className="dd-checkbox dd-checkbox--sm">
        <input
          type="checkbox"
          className="dd-checkbox__input"
          checked={subtask.completed}
          onChange={onToggle}
          aria-label="Done"
        />
      </label>
      <div className="min-w-0 flex-1">
        <SubtaskMentionInput
          value={subtask.title}
          onChange={onTitleChange}
          onCommit={onTitleCommit}
          mentions={mentions}
          completed={subtask.completed}
          className={cn(
            'text-sm',
            subtask.completed ? 'text-muted' : 'text-text',
          )}
          ariaLabel="Subtask title"
        />
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-ctl text-quiet hover:text-bad flex flex-none items-center self-stretch px-0.5"
        aria-label="Delete subtask"
        title="Delete subtask"
      >
        <Icon name="trash" />
      </button>
    </div>
  )
}
