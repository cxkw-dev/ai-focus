'use client'

import * as React from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { TodoItem, TodoItemOverlay } from './todo-item'
import { InlineTodoForm } from './inline-todo-form'
import { isBoardColumnKey, type BoardColumnKey } from '@/lib/board-columns'
import type { ExpandedLanes } from '@/hooks/use-board-lanes'
import type { Project } from '@/lib/projects'
import type { ProjectBoardColumn } from '@/hooks/use-project-board'
import type {
  CreateTodoInput,
  Priority,
  Status,
  SubtaskInput,
  Todo,
} from '@/types/todo'
import type { Person } from '@/types/person'

const POINTER_SENSOR_OPTIONS = {
  activationConstraint: { distance: 8 },
} as const

/**
 * Even opened, a finished lane is a reference view, not a working one. Show the
 * most recent slice and let the rest be asked for.
 */
const FINISHED_PREVIEW_COUNT = 10
const KEYBOARD_SENSOR_OPTIONS = {
  coordinateGetter: sortableKeyboardCoordinates,
}

/**
 * A card is as wide as its lane, so corner-based collision resolves a drop by
 * where the *card* overlaps rather than where the cursor is — across six narrow
 * lanes that reliably lands it a column off. Follow the pointer instead, and
 * fall back to rectangle overlap for the keyboard sensor, which has no pointer.
 */
const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)
  return pointerCollisions.length > 0
    ? pointerCollisions
    : rectIntersection(args)
}

interface TodoCardHandlers {
  onEdit: (todo: Todo) => void
  onStatusChange: (id: string, status: Status) => void
  onPriorityChange: (id: string, priority: Priority) => void
  onDelete: (id: string) => void
  onPermanentDelete: (id: string) => void
  onRestore: (id: string) => void
  onToggleSubtask: (
    todoId: string,
    subtaskId: string,
    completed: boolean,
  ) => void
  onUpdateSubtasks: (todoId: string, subtasks: SubtaskInput[]) => void
  onOpenNote?: (todoId: string, noteId: string) => void
  people: Person[]
  subtaskMentions: Array<Pick<Person, 'id' | 'name' | 'email'>>
}

interface ProjectBoardProps extends TodoCardHandlers {
  columns: ProjectBoardColumn[]
  project: Project
  onMoveToColumn: (todoId: string, column: BoardColumnKey) => void
  onReorder: (todos: Todo[]) => void
  onCreateTodo: (data: CreateTodoInput) => Promise<boolean>
  isSaving?: boolean
  /** Finished lanes are collapsed rails until asked for; see ExpandedLanes. */
  expandedLanes: ExpandedLanes
  onLaneExpandedChange: (key: BoardColumnKey, expanded: boolean) => void
  isLoadingFinished?: boolean
}

export function ProjectBoard({
  columns,
  project,
  onMoveToColumn,
  onReorder,
  onCreateTodo,
  isSaving,
  expandedLanes,
  onLaneExpandedChange,
  isLoadingFinished,
  ...cardHandlers
}: ProjectBoardProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [overColumnKey, setOverColumnKey] =
    React.useState<BoardColumnKey | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, POINTER_SENSOR_OPTIONS),
    useSensor(KeyboardSensor, KEYBOARD_SENSOR_OPTIONS),
  )

  const columnOfTodo = React.useCallback(
    (todoId: string): BoardColumnKey | null =>
      columns.find((column) => column.todos.some((todo) => todo.id === todoId))
        ?.key ?? null,
    [columns],
  )

  const resolveDropColumn = React.useCallback(
    (overId: string | null): BoardColumnKey | null => {
      if (!overId) return null
      if (isBoardColumnKey(overId)) return overId
      return columnOfTodo(overId)
    },
    [columnOfTodo],
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragOver = (event: DragOverEvent) => {
    setOverColumnKey(
      resolveDropColumn(event.over ? String(event.over.id) : null),
    )
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setOverColumnKey(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setOverColumnKey(null)
    if (!over) return

    const todoId = String(active.id)
    const overId = String(over.id)
    const fromColumn = columnOfTodo(todoId)
    const toColumn = resolveDropColumn(overId)
    if (!fromColumn || !toColumn) return

    if (fromColumn !== toColumn) {
      onMoveToColumn(todoId, toColumn)
      return
    }

    const lane = columns.find((column) => column.key === toColumn)
    // Finished lanes are ordered by completion time, so reordering is meaningless.
    if (!lane || lane.terminal || todoId === overId) return

    const oldIndex = lane.todos.findIndex((todo) => todo.id === todoId)
    const newIndex = lane.todos.findIndex((todo) => todo.id === overId)
    if (oldIndex === -1 || newIndex === -1) return

    onReorder(arrayMove(lane.todos, oldIndex, newIndex))
  }

  const activeTodo = activeId
    ? columns.flatMap((column) => column.todos).find((t) => t.id === activeId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-3">
        {columns.map((column) => (
          <BoardLane
            // Keyed by project so a lane's local state (an expanded finished
            // preview) doesn't carry over to the next board.
            key={`${project.id}:${column.key}`}
            column={column}
            isOver={overColumnKey === column.key}
            isDragging={activeId !== null}
            collapsed={column.terminal && !expandedLanes[column.key]}
            onExpand={
              column.terminal
                ? () => onLaneExpandedChange(column.key, true)
                : undefined
            }
            onCollapse={
              column.terminal
                ? () => onLaneExpandedChange(column.key, false)
                : undefined
            }
            isLoading={column.terminal && isLoadingFinished}
            {...cardHandlers}
          >
            {column.key === 'BACKLOG' && (
              <div className="mb-2 flex-shrink-0">
                <InlineTodoForm
                  onSubmit={onCreateTodo}
                  isLoading={isSaving}
                  project={project}
                  subtaskMentions={cardHandlers.subtaskMentions}
                />
              </div>
            )}
          </BoardLane>
        ))}
      </div>

      <DragOverlay>
        {activeTodo ? (
          <TodoItemOverlay
            todo={activeTodo}
            onStatusChange={() => {}}
            onPriorityChange={() => {}}
            onDelete={() => {}}
            onEdit={() => {}}
            people={cardHandlers.people}
            subtaskMentions={cardHandlers.subtaskMentions}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

interface BoardLaneProps extends TodoCardHandlers {
  column: ProjectBoardColumn
  isOver: boolean
  isDragging: boolean
  collapsed?: boolean
  isLoading?: boolean
  onExpand?: () => void
  onCollapse?: () => void
  children?: React.ReactNode
}

function BoardLane({
  column,
  isOver,
  isDragging,
  collapsed,
  isLoading,
  onExpand,
  onCollapse,
  children,
  onEdit,
  onStatusChange,
  onPriorityChange,
  onDelete,
  onPermanentDelete,
  onRestore,
  onToggleSubtask,
  onUpdateSubtasks,
  onOpenNote,
  people,
  subtaskMentions,
}: BoardLaneProps) {
  const { setNodeRef } = useDroppable({ id: column.key })
  const isFinished = Boolean(column.terminal)
  const viewMode = isFinished ? ('completed' as const) : ('active' as const)

  const [showAll, setShowAll] = React.useState(false)
  const hiddenCount =
    isFinished && !showAll
      ? Math.max(0, column.todos.length - FINISHED_PREVIEW_COUNT)
      : 0
  const visibleTodos =
    hiddenCount > 0
      ? column.todos.slice(0, FINISHED_PREVIEW_COUNT)
      : column.todos

  if (collapsed) {
    return (
      <CollapsedLane
        ref={setNodeRef}
        column={column}
        isOver={isOver}
        isDragging={isDragging}
        onExpand={onExpand}
      />
    )
  }

  return (
    <section
      className="flex min-h-0 flex-1 flex-col rounded-xl border p-2.5 transition-colors lg:w-0"
      style={{
        borderColor: isOver
          ? `color-mix(in srgb, ${column.color} 55%, transparent)`
          : 'var(--border-color)',
        backgroundColor: isOver
          ? `color-mix(in srgb, ${column.color} 7%, transparent)`
          : 'color-mix(in srgb, var(--surface) 55%, transparent)',
      }}
      aria-label={column.title}
    >
      {/* Lane header */}
      <div className="mb-2.5 flex flex-shrink-0 items-center gap-2 px-1">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: column.color }}
        />
        <h2
          className="text-[11px] font-bold tracking-wide uppercase"
          style={{ color: column.color }}
        >
          {column.title}
        </h2>
        <span
          className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
          style={{
            color: column.color,
            backgroundColor: `color-mix(in srgb, ${column.color} 12%, transparent)`,
          }}
        >
          {column.count}
        </span>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            className="ml-auto rounded p-0.5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label={`Collapse ${column.title}`}
            title="Collapse"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {children}

      <div
        ref={setNodeRef}
        className="scrollbar-hide min-h-0 flex-1 overflow-y-auto"
      >
        <SortableContext
          items={visibleTodos.map((todo) => todo.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex min-h-[80px] flex-col gap-1">
            {isLoading ? (
              <LoadingLane />
            ) : column.todos.length === 0 ? (
              <EmptyLane
                color={column.color}
                message={
                  isDragging
                    ? 'Drop here'
                    : `Nothing in ${column.title.toLowerCase()}`
                }
              />
            ) : (
              visibleTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onStatusChange={onStatusChange}
                  onPriorityChange={onPriorityChange}
                  onDelete={isFinished ? onPermanentDelete : onDelete}
                  onEdit={onEdit}
                  onRestore={onRestore}
                  onToggleSubtask={onToggleSubtask}
                  onUpdateSubtasks={onUpdateSubtasks}
                  onOpenNote={onOpenNote}
                  people={people}
                  subtaskMentions={subtaskMentions}
                  viewMode={viewMode}
                  dragDisabled={false}
                  animateTransitions={false}
                />
              ))
            )}
          </div>
        </SortableContext>

        {isFinished && (hiddenCount > 0 || showAll) && (
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="mt-1 w-full rounded-lg py-1.5 text-[11px] font-medium transition-colors"
            style={{
              color: column.color,
              backgroundColor: `color-mix(in srgb, ${column.color} 8%, transparent)`,
            }}
          >
            {showAll
              ? `Show recent ${FINISHED_PREVIEW_COUNT}`
              : `Show all ${column.todos.length}`}
          </button>
        )}
      </div>
    </section>
  )
}

/**
 * A finished lane as a vertical strip. It stays a droppable target so dragging
 * a card here still finishes it, and clicking it opens the full lane — which is
 * also what triggers fetching the finished todos in the first place.
 */
function CollapsedLane({
  ref,
  column,
  isOver,
  isDragging,
  onExpand,
}: {
  ref: (element: HTMLElement | null) => void
  column: ProjectBoardColumn
  isOver: boolean
  isDragging: boolean
  onExpand?: () => void
}) {
  return (
    <section
      ref={ref}
      className="flex flex-shrink-0 flex-row items-center gap-2 rounded-xl border px-2 py-2 transition-colors lg:w-11 lg:flex-col lg:py-3"
      style={{
        borderColor: isOver
          ? `color-mix(in srgb, ${column.color} 55%, transparent)`
          : 'var(--border-color)',
        backgroundColor: isOver
          ? `color-mix(in srgb, ${column.color} 12%, transparent)`
          : 'color-mix(in srgb, var(--surface) 55%, transparent)',
      }}
      aria-label={column.title}
    >
      <button
        type="button"
        onClick={onExpand}
        className="flex flex-1 flex-row items-center justify-center gap-2 lg:h-full lg:flex-col"
        aria-label={`Expand ${column.title} (${column.count})`}
        title={`Show ${column.count} ${column.title.toLowerCase()}`}
      >
        <ChevronLeft
          className="hidden h-3.5 w-3.5 lg:block"
          style={{ color: 'var(--text-muted)' }}
        />
        <span
          className="text-[11px] font-bold tracking-widest uppercase lg:[writing-mode:vertical-rl]"
          style={{ color: column.color }}
        >
          {column.title}
        </span>
        <span
          className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
          style={{
            color: column.color,
            backgroundColor: `color-mix(in srgb, ${column.color} 12%, transparent)`,
          }}
        >
          {column.count}
        </span>
        {isDragging && column.dropHint && (
          <span
            className="text-[10px] lg:[writing-mode:vertical-rl]"
            style={{ color: 'var(--text-muted)' }}
          >
            {column.dropHint}
          </span>
        )}
      </button>
    </section>
  )
}

function LoadingLane() {
  return (
    <div className="flex flex-col gap-1">
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className="h-12 animate-pulse rounded-lg"
          style={{ backgroundColor: 'var(--surface-2)' }}
        />
      ))}
    </div>
  )
}

function EmptyLane({ color, message }: { color: string; message: string }) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center"
      style={{
        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
      }}
    >
      <Inbox className="h-4 w-4" style={{ color, opacity: 0.5 }} />
      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
        {message}
      </p>
    </div>
  )
}
