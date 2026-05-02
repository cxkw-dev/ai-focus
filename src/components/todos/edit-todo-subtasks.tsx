'use client'

import * as React from 'react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { ListChecks, Plus } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { SubtaskMentionInput } from '@/components/ui/subtask-mention-input'
import { hasMeaningfulText, normalizeSubtaskTitle } from '@/lib/rich-text'
import {
  editSubtaskDndId,
  SortableEditSubtaskRow,
} from './sortable-edit-subtask-row'
import type { SubtaskInput } from '@/types/todo'

interface EditTodoSubtasksProps {
  subtasks: SubtaskInput[]
  mentions: { id: string; name: string; email: string }[]
  onAddSubtask: (title: string) => void
  onMoveSubtask: (fromIndex: number, toIndex: number) => void
  onToggleSubtask: (index: number) => void
  onUpdateSubtaskTitle: (index: number, title: string) => void
  onRemoveSubtask: (index: number) => void
}

export function EditTodoSubtasks({
  subtasks,
  mentions,
  onAddSubtask,
  onMoveSubtask,
  onToggleSubtask,
  onUpdateSubtaskTitle,
  onRemoveSubtask,
}: EditTodoSubtasksProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('')
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleAddSubtask = React.useCallback(() => {
    const normalized = normalizeSubtaskTitle(newSubtaskTitle)
    if (!hasMeaningfulText(normalized)) return
    onAddSubtask(normalized)
    setNewSubtaskTitle('')
  }, [newSubtaskTitle, onAddSubtask])

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const activeIndex = subtasks.findIndex(
        (subtask, index) => editSubtaskDndId(subtask.id, index) === active.id,
      )
      const overIndex = subtasks.findIndex(
        (subtask, index) => editSubtaskDndId(subtask.id, index) === over.id,
      )

      if (activeIndex !== -1 && overIndex !== -1) {
        onMoveSubtask(activeIndex, overIndex)
      }
    },
    [onMoveSubtask, subtasks],
  )

  return (
    <div className="space-y-2">
      <Label
        className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
        style={{ color: 'var(--text-muted)' }}
      >
        <ListChecks className="h-3.5 w-3.5" />
        Subtasks
        {subtasks.length > 0 && (
          <span
            className="text-[10px] font-normal"
            style={{ color: 'var(--text-muted)' }}
          >
            {subtasks.filter((s) => s.completed).length}/{subtasks.length}
          </span>
        )}
      </Label>
      <div className="space-y-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={subtasks.map((subtask, index) =>
              editSubtaskDndId(subtask.id, index),
            )}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {subtasks.map((subtask, index) => (
                <SortableEditSubtaskRow
                  key={editSubtaskDndId(subtask.id, index)}
                  dndId={editSubtaskDndId(subtask.id, index)}
                  completed={!!subtask.completed}
                  title={subtask.title}
                  onToggle={() => onToggleSubtask(index)}
                  onTitleChange={(title) => onUpdateSubtaskTitle(index, title)}
                  onRemove={() => onRemoveSubtask(index)}
                  mentions={mentions}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <div className="flex items-center gap-2">
          <Plus
            className="h-4 w-4 flex-shrink-0"
            style={{ color: 'var(--text-muted)' }}
          />
          <SubtaskMentionInput
            value={newSubtaskTitle}
            onChange={setNewSubtaskTitle}
            onCommit={handleAddSubtask}
            commitOnBlur={false}
            mentions={mentions}
            placeholder="Add a subtask..."
            className="flex-1 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>
    </div>
  )
}
