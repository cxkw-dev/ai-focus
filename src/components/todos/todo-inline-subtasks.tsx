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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Plus,
  Square,
} from 'lucide-react'
import { SubtaskMentionInput } from '@/components/ui/subtask-mention-input'
import {
  hasMeaningfulText,
  isHtmlContent,
  linkifyHtml,
  mentionifyHtml,
  normalizeSubtaskTitle,
} from '@/lib/rich-text'
import {
  isRapidDuplicateSubtaskCommit,
  normalizeSubtaskCommitValue,
  type RecentSubtaskCommit,
} from '@/lib/subtask-commit'
import { createClientSubtaskId } from '@/lib/subtask-ids'
import {
  inlineSubtaskDndId,
  SortableInlineSubtaskRow,
} from './sortable-inline-subtask-row'
import type { Subtask, SubtaskInput } from '@/types/todo'
import type { Person } from '@/types/person'

const EMPTY_SUBTASKS: Subtask[] = []

const POINTER_SENSOR_OPTIONS = {
  activationConstraint: { distance: 6 },
} as const
const KEYBOARD_SENSOR_OPTIONS = {
  coordinateGetter: sortableKeyboardCoordinates,
}

function toSubtaskInput(subtasks: Subtask[]): SubtaskInput[] {
  return subtasks.map((subtask, index) => ({
    id: subtask.id,
    title: subtask.title,
    completed: subtask.completed,
    order: index,
  }))
}

interface TodoInlineSubtasksProps {
  todoId: string
  sourceSubtasks?: Subtask[]
  canInlineEdit: boolean
  mentions: Array<Pick<Person, 'id' | 'name' | 'email'>>
  onToggleSubtask?: (
    todoId: string,
    subtaskId: string,
    completed: boolean,
  ) => void
  onUpdateSubtasks?: (todoId: string, subtasks: SubtaskInput[]) => void
}

export function TodoInlineSubtasks({
  todoId,
  sourceSubtasks,
  canInlineEdit,
  mentions,
  onToggleSubtask,
  onUpdateSubtasks,
}: TodoInlineSubtasksProps) {
  const normalizedSourceSubtasks = sourceSubtasks ?? EMPTY_SUBTASKS
  const [subtasks, setSubtasks] = React.useState<Subtask[]>(
    normalizedSourceSubtasks,
  )
  const [isAddingSubtask, setIsAddingSubtask] = React.useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('')
  const [subtasksExpanded, setSubtasksExpanded] = React.useState(false)
  const lastAddedSubtaskRef = React.useRef<RecentSubtaskCommit | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, POINTER_SENSOR_OPTIONS),
    useSensor(KeyboardSensor, KEYBOARD_SENSOR_OPTIONS),
  )

  const [prevSubtasksRef, setPrevSubtasksRef] = React.useState(
    normalizedSourceSubtasks,
  )
  if (prevSubtasksRef !== normalizedSourceSubtasks) {
    setPrevSubtasksRef(normalizedSourceSubtasks)
    setSubtasks(normalizedSourceSubtasks)
  }

  const persistSubtasks = React.useCallback(
    (nextSubtasks: Subtask[]) => {
      onUpdateSubtasks?.(todoId, toSubtaskInput(nextSubtasks))
    },
    [onUpdateSubtasks, todoId],
  )

  const handleToggle = React.useCallback(
    (subtaskId: string, completed: boolean) => {
      setSubtasks((prev) =>
        prev.map((subtask) =>
          subtask.id === subtaskId ? { ...subtask, completed } : subtask,
        ),
      )
      onToggleSubtask?.(todoId, subtaskId, completed)
    },
    [onToggleSubtask, todoId],
  )

  const handleTitleChange = React.useCallback(
    (subtaskId: string, title: string) => {
      setSubtasks((prev) =>
        prev.map((subtask) =>
          subtask.id === subtaskId ? { ...subtask, title } : subtask,
        ),
      )
    },
    [],
  )

  const handleTitleCommit = React.useCallback(
    (subtaskId: string) => {
      setSubtasks((prev) => {
        const current = prev.find((subtask) => subtask.id === subtaskId)
        if (!current) return prev

        const trimmed = normalizeSubtaskTitle(current.title)
        const original =
          normalizedSourceSubtasks.find((subtask) => subtask.id === subtaskId)
            ?.title ?? ''
        const originalNormalized = normalizeSubtaskTitle(original)

        if (!hasMeaningfulText(trimmed)) {
          if (current.title !== original) {
            return prev.map((subtask) =>
              subtask.id === subtaskId
                ? { ...subtask, title: original }
                : subtask,
            )
          }
          return prev
        }

        if (trimmed !== current.title) {
          const normalized = prev.map((subtask) =>
            subtask.id === subtaskId ? { ...subtask, title: trimmed } : subtask,
          )
          if (trimmed !== originalNormalized) {
            persistSubtasks(normalized)
          }
          return normalized
        }

        if (trimmed !== originalNormalized) {
          persistSubtasks(prev)
        }

        return prev
      })
    },
    [normalizedSourceSubtasks, persistSubtasks],
  )

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      setSubtasks((prev) => {
        const activeIndex = prev.findIndex(
          (subtask) => inlineSubtaskDndId(subtask.id) === active.id,
        )
        const overIndex = prev.findIndex(
          (subtask) => inlineSubtaskDndId(subtask.id) === over.id,
        )
        if (activeIndex === -1 || overIndex === -1) return prev
        const reordered = arrayMove(prev, activeIndex, overIndex).map(
          (subtask, index) => ({
            ...subtask,
            order: index,
          }),
        )
        persistSubtasks(reordered)
        return reordered
      })
    },
    [persistSubtasks],
  )

  const handleDelete = React.useCallback(
    (subtaskId: string) => {
      setSubtasks((prev) => {
        const nextSubtasks = prev
          .filter((subtask) => subtask.id !== subtaskId)
          .map((subtask, index) => ({ ...subtask, order: index }))
        persistSubtasks(nextSubtasks)
        return nextSubtasks
      })
    },
    [persistSubtasks],
  )

  const handleAddCommit = React.useCallback(() => {
    const normalized = normalizeSubtaskTitle(newSubtaskTitle)
    const now = Date.now()

    if (!hasMeaningfulText(normalized)) {
      setNewSubtaskTitle('')
      setIsAddingSubtask(false)
      return
    }

    if (
      isRapidDuplicateSubtaskCommit(
        lastAddedSubtaskRef.current,
        normalized,
        now,
      )
    ) {
      setNewSubtaskTitle('')
      setIsAddingSubtask(false)
      return
    }

    lastAddedSubtaskRef.current = {
      value: normalizeSubtaskCommitValue(normalized),
      at: now,
    }

    setSubtasks((prev) => {
      const nextSubtasks: Subtask[] = [
        ...prev,
        {
          id: createClientSubtaskId(),
          title: normalized,
          completed: false,
          order: prev.length,
        },
      ]
      persistSubtasks(nextSubtasks)
      return nextSubtasks
    })

    setNewSubtaskTitle('')
    setIsAddingSubtask(false)
  }, [newSubtaskTitle, persistSubtasks])

  const completedCount = subtasks.filter((s) => s.completed).length
  const allDone = subtasks.length > 0 && completedCount === subtasks.length
  const hasSubtasks = subtasks.length > 0
  const canAddSubtasks = canInlineEdit && !!onUpdateSubtasks
  const shouldShow = hasSubtasks || canAddSubtasks || isAddingSubtask

  if (!shouldShow) {
    return null
  }

  if (!hasSubtasks && !isAddingSubtask) {
    return canAddSubtasks ? (
      <button
        type="button"
        onClick={() => setIsAddingSubtask(true)}
        className="mt-1 inline-flex items-center gap-1 rounded px-1 py-0.5 text-[10px] transition-colors hover:bg-white/5"
        style={{ color: 'var(--text-muted)', opacity: 0.6 }}
      >
        <Plus className="h-2.5 w-2.5" />
        Add subtask
      </button>
    ) : null
  }

  return (
    <div
      className="pt-1.5"
      style={{
        borderTop:
          '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)',
      }}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSubtasksExpanded((prev) => !prev)}
          className="flex cursor-pointer items-center gap-1.5 transition-opacity hover:opacity-80"
        >
          {subtasksExpanded ? (
            <ChevronDown
              className="h-3 w-3"
              style={{ color: 'var(--text-muted)', opacity: 0.6 }}
            />
          ) : (
            <ChevronRight
              className="h-3 w-3"
              style={{ color: 'var(--text-muted)', opacity: 0.6 }}
            />
          )}
          <span
            className="text-[10px] font-semibold tracking-wide uppercase"
            style={{ color: 'var(--text-muted)', opacity: 0.6 }}
          >
            Subtasks
          </span>
        </button>
        {hasSubtasks && (
          <span
            className="text-[10px] font-medium"
            style={{
              color: allDone ? 'var(--status-done)' : 'var(--text-muted)',
            }}
          >
            {completedCount}/{subtasks.length}
          </span>
        )}
        {canAddSubtasks && !isAddingSubtask && subtasksExpanded && (
          <button
            type="button"
            onClick={() => setIsAddingSubtask(true)}
            className="ml-auto inline-flex items-center gap-1 rounded px-1 py-0.5 text-[10px] transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}
          >
            <Plus className="h-2.5 w-2.5" />
            Add
          </button>
        )}
      </div>
      {(subtasksExpanded || (!hasSubtasks && isAddingSubtask)) && (
        <>
          {hasSubtasks &&
            (canInlineEdit ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={subtasks.map((subtask) =>
                    inlineSubtaskDndId(subtask.id),
                  )}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-0.5">
                    {subtasks.map((subtask) => (
                      <SortableInlineSubtaskRow
                        key={subtask.id}
                        subtask={subtask}
                        onToggle={() =>
                          handleToggle(subtask.id, !subtask.completed)
                        }
                        onTitleChange={(title) =>
                          handleTitleChange(subtask.id, title)
                        }
                        onTitleCommit={() => handleTitleCommit(subtask.id)}
                        onDelete={() => handleDelete(subtask.id)}
                        mentions={mentions}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="space-y-0.5">
                {subtasks.map((subtask) => (
                  <ReadOnlyInlineSubtask key={subtask.id} subtask={subtask} />
                ))}
              </div>
            ))}
          {canAddSubtasks && isAddingSubtask && (
            <div
              className="mt-1 rounded px-1 py-0.5"
              style={{
                backgroundColor:
                  'color-mix(in srgb, var(--surface) 45%, transparent)',
              }}
            >
              <div className="flex items-center gap-1.5">
                <Plus
                  className="h-3 w-3 flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                />
                <SubtaskMentionInput
                  value={newSubtaskTitle}
                  onChange={setNewSubtaskTitle}
                  onCommit={handleAddCommit}
                  commitOnBlur={false}
                  mentions={mentions}
                  placeholder="Add a subtask..."
                  className="!text-[11px] !leading-snug text-[var(--text-primary)]"
                  ariaLabel="New subtask title"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ReadOnlyInlineSubtask({ subtask }: { subtask: Subtask }) {
  return (
    <div className="flex w-full items-center gap-2 rounded px-0.5 py-0.5 text-left">
      {subtask.completed ? (
        <CheckSquare
          className="h-3.5 w-3.5 flex-shrink-0"
          style={{ color: 'var(--status-done)' }}
        />
      ) : (
        <Square
          className="h-3.5 w-3.5 flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}
        />
      )}
      <div
        className="text-[11px] leading-snug"
        style={{
          color: subtask.completed
            ? 'var(--text-muted)'
            : 'var(--text-primary)',
          textDecoration: subtask.completed ? 'line-through' : 'none',
        }}
      >
        {isHtmlContent(subtask.title) ? (
          <div
            className="[&_.mention]:font-medium [&_.mention:hover]:underline [&_a]:text-[var(--primary)] [&_a:hover]:underline [&_p]:my-0 [&_p]:leading-snug"
            dangerouslySetInnerHTML={{
              __html: linkifyHtml(mentionifyHtml(subtask.title)),
            }}
          />
        ) : (
          subtask.title
        )}
      </div>
    </div>
  )
}
