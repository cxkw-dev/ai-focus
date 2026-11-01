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
import { IconButton } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { SubtaskMentionInput } from '@/components/ui/subtask-mention-input'
import { cn } from '@/lib/utils'
import {
  hasMeaningfulText,
  isHtmlContent,
  linkifyHtml,
  mentionifyHtml,
  normalizeSubtaskTitle,
  sanitizeHtml,
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
import { REVEAL_ON_CARD_HOVER } from './todo-display'
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
  /**
   * Whether the new-subtask field is open. The card owns it, because the button that opens it lives in the card's
   * footer (see AddSubtaskButton); committing or clearing the field closes it again.
   */
  adding: boolean
  onAddingChange: (adding: boolean) => void
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
  adding: isAddingSubtask,
  onAddingChange: setIsAddingSubtask,
  mentions,
  onToggleSubtask,
  onUpdateSubtasks,
}: TodoInlineSubtasksProps) {
  const normalizedSourceSubtasks = sourceSubtasks ?? EMPTY_SUBTASKS
  const [subtasks, setSubtasks] = React.useState<Subtask[]>(
    normalizedSourceSubtasks,
  )
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('')
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
  }, [newSubtaskTitle, persistSubtasks, setIsAddingSubtask])

  const completedCount = subtasks.filter((s) => s.completed).length
  const allDone = subtasks.length > 0 && completedCount === subtasks.length
  const hasSubtasks = subtasks.length > 0
  const canAddSubtasks = canInlineEdit && !!onUpdateSubtasks
  const showAddField = canAddSubtasks && isAddingSubtask
  const addFieldRef = React.useRef<HTMLDivElement>(null)

  // The field opens from a button in the card's footer, so take focus to it. The mention editor mounts a beat after
  // its wrapper (TipTap renders client-side), hence the observer.
  React.useEffect(() => {
    const field = addFieldRef.current
    if (!showAddField || !field) return
    const focusEditor = () => {
      const editable = field.querySelector<HTMLElement>(
        '[contenteditable="true"]',
      )
      editable?.focus()
      return Boolean(editable)
    }
    if (focusEditor()) return
    const observer = new MutationObserver(() => {
      if (focusEditor()) observer.disconnect()
    })
    observer.observe(field, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [showAddField])

  if (!hasSubtasks && !showAddField) {
    return null
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-muted text-xs font-medium">Subtasks</span>
        {hasSubtasks && (
          <span
            className={cn(
              'font-mono text-xs tabular-nums',
              allDone ? 'text-ok' : 'text-muted',
            )}
          >
            {completedCount}/{subtasks.length}
          </span>
        )}
      </div>
      {hasSubtasks &&
        (canInlineEdit ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={subtasks.map((subtask) => inlineSubtaskDndId(subtask.id))}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col">
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
          <div className="flex flex-col">
            {subtasks.map((subtask) => (
              <ReadOnlyInlineSubtask key={subtask.id} subtask={subtask} />
            ))}
          </div>
        ))}
      {showAddField && (
        <div
          ref={addFieldRef}
          className="rounded-ctl bg-wash flex items-center gap-1.5 px-1.5 py-1 text-xs"
        >
          <Icon name="plus" className="text-quiet" />
          <SubtaskMentionInput
            value={newSubtaskTitle}
            onChange={setNewSubtaskTitle}
            onCommit={handleAddCommit}
            commitOnBlur={false}
            mentions={mentions}
            placeholder="Add a subtask…"
            className="text-text text-xs leading-snug"
            ariaLabel="New subtask title"
          />
        </div>
      )}
    </div>
  )
}

/**
 * The card footer's "Add subtask": a ghost icon toggle beside the drawer toggles. It waits for the card's hover or
 * focus like the rest of the card's chrome, and stays lit while the new-subtask field it opens is showing.
 */
export function AddSubtaskButton({
  active,
  onClick,
}: {
  active: boolean
  onClick: () => void
}) {
  return (
    <IconButton
      icon="plus"
      label="Add subtask"
      size="sm"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'p-1',
        active
          ? 'bg-wash-strong text-text'
          : cn('text-quiet hover:text-text', REVEAL_ON_CARD_HOVER),
      )}
    />
  )
}

function ReadOnlyInlineSubtask({ subtask }: { subtask: Subtask }) {
  return (
    <div className="flex w-full items-start gap-2 py-0.5 pl-1">
      <span className="dd-checkbox dd-checkbox--sm">
        <input
          type="checkbox"
          className="dd-checkbox__input pointer-events-none"
          checked={subtask.completed}
          readOnly
          tabIndex={-1}
          aria-label="Done"
        />
      </span>
      <div
        className={cn(
          'min-w-0 text-xs leading-snug',
          subtask.completed ? 'text-muted line-through' : 'text-text',
        )}
      >
        {isHtmlContent(subtask.title) ? (
          <div
            className="subtask-mention-editor [&_a]:text-accent [&_a:hover]:underline"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(linkifyHtml(mentionifyHtml(subtask.title))),
            }}
          />
        ) : (
          subtask.title
        )}
      </div>
    </div>
  )
}
