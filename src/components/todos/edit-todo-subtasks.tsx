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
import { Icon } from '@/components/ui/icon'
import { SubtaskMentionInput } from '@/components/ui/subtask-mention-input'
import { hasMeaningfulText, normalizeSubtaskTitle } from '@/lib/rich-text'
import {
  editSubtaskDndId,
  SortableEditSubtaskRow,
} from './sortable-edit-subtask-row'
import type { SubtaskInput } from '@/types/todo'

const POINTER_SENSOR_OPTIONS = {
  activationConstraint: { distance: 6 },
} as const
const KEYBOARD_SENSOR_OPTIONS = {
  coordinateGetter: sortableKeyboardCoordinates,
}

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
    useSensor(PointerSensor, POINTER_SENSOR_OPTIONS),
    useSensor(KeyboardSensor, KEYBOARD_SENSOR_OPTIONS),
  )
  const completedCount = subtasks.filter((s) => s.completed).length

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
    <div className="dd-field dd-field--above">
      <span className="dd-field__label">
        Subtasks
        {subtasks.length > 0 && (
          <span className="dd-field__opt dd-num">
            {' '}
            · {completedCount}/{subtasks.length}
          </span>
        )}
      </span>
      <div className="flex flex-col">
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
          </SortableContext>
        </DndContext>
        <div className="rounded-ctl text-quiet ease-gentle focus-within:bg-wash hover:bg-wash flex items-center gap-2 py-1 pr-1.5 pl-1.5 transition-colors duration-[var(--dd-dur-fast)]">
          <Icon name="plus" />
          <SubtaskMentionInput
            value={newSubtaskTitle}
            onChange={setNewSubtaskTitle}
            onCommit={handleAddSubtask}
            commitOnBlur={false}
            mentions={mentions}
            placeholder="Add a subtask"
            className="text-text min-w-0 flex-1 text-sm"
          />
        </div>
      </div>
    </div>
  )
}
