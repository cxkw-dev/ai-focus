'use client'

import * as React from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CheckSquare, GripVertical, Square, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SubtaskMentionInput } from '@/components/ui/subtask-mention-input'
import type { Subtask } from '@/types/todo'

export function inlineSubtaskDndId(subtaskId: string) {
  return `subtask-${subtaskId}`
}

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
  const [isEditing, setIsEditing] = React.useState(false)
  const commitFxControls = useAnimationControls()
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
  const handleCommit = React.useCallback(() => {
    onTitleCommit()
    void commitFxControls.start({
      x: [0, -1.5, 1.5, -0.75, 0],
      transition: { duration: 0.24, ease: 'easeOut' },
    })
  }, [commitFxControls, onTitleCommit])

  return (
    <div ref={setNodeRef} style={style} className="relative py-0.5">
      <motion.span
        className="pointer-events-none absolute top-1/2 left-0 h-3 w-0.5 rounded-full"
        animate={
          isEditing
            ? { opacity: [0.45, 1, 0.45], scaleY: [0.75, 1, 0.75] }
            : { opacity: 0, scaleY: 0.75 }
        }
        transition={
          isEditing
            ? {
                duration: 1.2,
                ease: 'easeInOut',
                repeat: Number.POSITIVE_INFINITY,
              }
            : { duration: 0.12, ease: 'easeOut' }
        }
        style={{ backgroundColor: 'var(--primary)' }}
      />
      <motion.div
        className="group/subtask flex w-full items-center rounded pr-0.5 pl-1 transition-colors hover:bg-white/5"
        animate={{
          backgroundColor: isEditing
            ? 'color-mix(in srgb, var(--primary) 10%, transparent)'
            : 'transparent',
          boxShadow: isEditing
            ? 'inset 0 0 0 1px color-mix(in srgb, var(--primary) 28%, transparent)'
            : 'inset 0 0 0 1px transparent',
          y: isEditing ? -0.5 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.6 }}
      >
        <motion.div
          className="flex w-full min-w-0 items-center gap-1.5"
          animate={commitFxControls}
        >
          <button
            type="button"
            {...attributes}
            {...listeners}
            className={cn(
              'flex-shrink-0 cursor-grab rounded transition-colors active:cursor-grabbing',
              isDragging && 'cursor-grabbing',
            )}
            style={{ color: 'var(--text-muted)', opacity: 0.7 }}
            aria-label="Reorder subtask"
          >
            <GripVertical className="h-3 w-3" />
          </button>
          <button type="button" onClick={onToggle} className="flex-shrink-0">
            {subtask.completed ? (
              <CheckSquare
                className="h-3.5 w-3.5"
                style={{ color: 'var(--status-done)' }}
              />
            ) : (
              <Square
                className="h-3.5 w-3.5"
                style={{ color: 'var(--text-muted)' }}
              />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <SubtaskMentionInput
              value={subtask.title}
              onChange={onTitleChange}
              onCommit={handleCommit}
              onFocusChange={setIsEditing}
              mentions={mentions}
              completed={subtask.completed}
              className={cn(
                '!text-[11px] !leading-snug',
                subtask.completed
                  ? 'text-[var(--text-muted)]'
                  : 'text-[var(--text-primary)]',
              )}
              ariaLabel="Subtask title"
            />
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="flex-shrink-0 rounded opacity-40 transition-opacity hover:opacity-100"
            style={{ color: 'var(--destructive)' }}
            title="Delete subtask"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
