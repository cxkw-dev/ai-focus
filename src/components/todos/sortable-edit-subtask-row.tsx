'use client'

import * as React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { IconButton } from '@/components/ui/button'
import { SubtaskMentionInput } from '@/components/ui/subtask-mention-input'
import { cn } from '@/lib/utils'

export function editSubtaskDndId(
  subtaskId: string | undefined,
  index: number,
): string {
  return subtaskId ?? `new-subtask-${index}`
}

export function SortableEditSubtaskRow({
  dndId,
  completed,
  title,
  onToggle,
  onTitleChange,
  onRemove,
  mentions,
}: {
  dndId: string
  completed: boolean
  title: string
  onToggle: () => void
  onTitleChange: (title: string) => void
  onRemove: () => void
  mentions: { id: string; name: string; email: string }[]
}) {
  const [isEditing, setIsEditing] = React.useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dndId })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group/subtask rounded-ctl ease-gentle hover:bg-wash flex items-center gap-1.5 py-0.5 pr-0.5 pl-0.5 transition-colors duration-[var(--dd-dur-fast)]',
        isEditing && 'bg-wash',
        isDragging && 'bg-wash-strong relative z-10',
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className={cn(
          'rounded-ctl text-quiet hover:text-muted flex-none cursor-grab p-0.5 transition-colors active:cursor-grabbing',
          isDragging && 'text-muted',
        )}
        aria-label="Reorder subtask"
      >
        <GripVertical className="size-[1.15em]" aria-hidden />
      </button>
      <label className="dd-checkbox dd-checkbox--sm flex-none">
        <input
          className="dd-checkbox__input"
          type="checkbox"
          checked={completed}
          onChange={onToggle}
          aria-label={completed ? 'Mark subtask not done' : 'Mark subtask done'}
        />
      </label>
      <SubtaskMentionInput
        value={title}
        onChange={onTitleChange}
        onFocusChange={setIsEditing}
        mentions={mentions}
        completed={completed}
        className={cn(
          'min-w-0 flex-1 text-sm',
          completed ? 'text-muted' : 'text-text',
        )}
        ariaLabel="Subtask title"
      />
      <IconButton
        icon="x"
        label="Remove subtask"
        size="sm"
        onClick={onRemove}
        className="-my-1 text-sm opacity-0 group-focus-within/subtask:opacity-100 group-hover/subtask:opacity-100 focus-visible:opacity-100"
      />
    </div>
  )
}
