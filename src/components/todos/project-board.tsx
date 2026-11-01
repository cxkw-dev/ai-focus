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
import { TodoItem, TodoItemOverlay } from './todo-item'
import { InlineTodoForm } from './inline-todo-form'
import { IconButton } from '@/components/ui/button'
import { Icon, type IconName } from '@/components/ui/icon'
import { STATUS_CONFIG } from '@/lib/status'
import { cn } from '@/lib/utils'
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
      <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row lg:gap-3">
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
              <div className="mb-1.5 flex-none">
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
      className={cn(
        'flex min-w-0 flex-col rounded-lg p-2 transition-colors lg:min-h-0 lg:w-0 lg:flex-1',
        isOver ? 'bg-[var(--dd-card-hover)]' : 'bg-surface',
      )}
      aria-label={column.title}
    >
      <LaneHeader column={column}>
        {onCollapse && (
          <IconButton
            icon="chevron-right"
            label={`Collapse ${column.title}`}
            size="sm"
            className="text-quiet hover:text-text ml-auto p-1"
            onClick={onCollapse}
          />
        )}
      </LaneHeader>

      {children}

      <div
        ref={setNodeRef}
        className="dd-scroll flex-1 [scrollbar-gutter:auto] lg:min-h-0"
      >
        <SortableContext
          items={visibleTodos.map((todo) => todo.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex min-h-20 flex-col gap-1.5">
            {isLoading ? (
              <LoadingLane />
            ) : column.todos.length === 0 ? (
              <EmptyLane
                icon={laneStatus(column).icon}
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
            className="dd-btn dd-btn--ghost dd-btn--sm text-muted mt-1.5 w-full"
          >
            {showAll ? (
              `Show recent ${FINISHED_PREVIEW_COUNT}`
            ) : (
              <>
                Show all{' '}
                <span className="font-mono tabular-nums">
                  {column.todos.length}
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </section>
  )
}

/** A lane's status look: the canonical colour and icon of the status a card takes when dropped in. */
function laneStatus(column: ProjectBoardColumn) {
  return STATUS_CONFIG[column.dropStatus]
}

function LaneHeader({
  column,
  children,
}: {
  column: ProjectBoardColumn
  children?: React.ReactNode
}) {
  const status = laneStatus(column)
  return (
    <div className="mb-1.5 flex min-h-7 flex-none items-center gap-1.5 pl-1">
      <Icon
        name={status.icon}
        className="text-sm"
        style={{ color: status.colorVar }}
      />
      <h2 className="text-text text-sm font-semibold">{column.title}</h2>
      <span className="dd-badge dd-badge--count">{column.count}</span>
      {children}
    </div>
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
  const status = laneStatus(column)
  return (
    <section
      ref={ref}
      className={cn(
        'flex flex-none rounded-lg transition-colors lg:w-11',
        isOver ? 'bg-[var(--dd-card-hover)]' : 'bg-surface',
      )}
      aria-label={column.title}
    >
      <button
        type="button"
        onClick={onExpand}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs transition-colors hover:bg-[var(--dd-card-hover)] lg:flex-col lg:py-3"
        aria-label={`Expand ${column.title} (${column.count})`}
        title={`Show ${column.count} ${column.title.toLowerCase()}`}
      >
        <Icon name="chevron-left" className="text-quiet hidden lg:block" />
        <Icon name={status.icon} style={{ color: status.colorVar }} />
        <span className="text-text font-semibold lg:[writing-mode:vertical-rl]">
          {column.title}
        </span>
        <span className="dd-badge dd-badge--count">{column.count}</span>
        {isDragging && column.dropHint && (
          <span className="text-quiet lg:[writing-mode:vertical-rl]">
            {column.dropHint}
          </span>
        )}
      </button>
    </section>
  )
}

function LoadingLane() {
  return (
    <div className="dd-skeleton-group gap-1.5" aria-busy="true">
      <span className="dd-visually-hidden">Loading finished tasks…</span>
      {[0, 1, 2, 3].map((index) => (
        <span
          key={index}
          className="dd-skeleton rounded-box h-12"
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

function EmptyLane({ icon, message }: { icon: IconName; message: string }) {
  return (
    <div className="dd-empty-state dd-empty-state--compact rounded-box bg-wash w-full max-w-none">
      <div className="dd-empty-state__icon">
        <Icon name={icon} />
      </div>
      <p className="dd-empty-state__text text-xs">{message}</p>
    </div>
  )
}
