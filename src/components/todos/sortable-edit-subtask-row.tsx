'use client'

import * as React from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CheckSquare, GripVertical, Square, X } from 'lucide-react'
import { SubtaskMentionInput } from '@/components/ui/subtask-mention-input'

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
  const commitFxControls = useAnimationControls()
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
  const handleCommitFx = React.useCallback(() => {
    void commitFxControls.start({
      x: [0, -1.5, 1.5, -0.75, 0],
      transition: { duration: 0.24, ease: 'easeOut' },
    })
  }, [commitFxControls])

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
        className="group/subtask flex items-center gap-2 rounded pr-0.5 pl-1 transition-colors hover:bg-white/5"
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
          className="flex w-full min-w-0 items-center gap-2"
          animate={commitFxControls}
        >
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab rounded p-0.5 transition-colors active:cursor-grabbing"
            style={{
              color: 'var(--text-muted)',
              opacity: isDragging ? 1 : 0.6,
            }}
            aria-label="Reorder subtask"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="flex-shrink-0 transition-colors"
            style={{
              color: completed ? 'var(--status-done)' : 'var(--text-muted)',
            }}
          >
            {completed ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
          <SubtaskMentionInput
            value={title}
            onChange={onTitleChange}
            onCommit={handleCommitFx}
            onFocusChange={setIsEditing}
            mentions={mentions}
            completed={completed}
            className={
              completed
                ? 'flex-1 text-sm text-[var(--text-muted)]'
                : 'flex-1 text-sm text-[var(--text-primary)]'
            }
            ariaLabel="Subtask title"
          />
          <motion.span
            className="flex-shrink-0 text-[9px] font-semibold tracking-wide uppercase"
            animate={{ opacity: isEditing ? 1 : 0, x: isEditing ? 0 : -2 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            style={{ color: 'var(--primary)' }}
          >
            editing
          </motion.span>
          <button
            type="button"
            onClick={onRemove}
            className="flex-shrink-0 opacity-0 transition-opacity group-hover/subtask:opacity-100"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
