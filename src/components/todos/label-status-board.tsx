'use client'

import * as React from 'react'
import { Inbox, CheckCircle2, Trash2 } from 'lucide-react'
import { TodoItem, BlockedExpandedProvider } from './todo-item'
import type { Todo, Status, Priority, SubtaskInput } from '@/types/todo'
import type { Person } from '@/types/person'

export type LabelStatusBoardFilter = 'active' | 'completed' | 'deleted'

interface LabelStatusBoardProps {
  filter: LabelStatusBoardFilter
  activeTodos: Todo[]
  completedTodos: Todo[]
  deletedTodos: Todo[]
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

const STATUS_COLUMNS: Array<{ key: Status; label: string; color: string }> = [
  { key: 'TODO', label: 'To Do', color: 'var(--status-todo)' },
  {
    key: 'IN_PROGRESS',
    label: 'In Progress',
    color: 'var(--status-in-progress)',
  },
  { key: 'WAITING', label: 'Waiting', color: 'var(--status-waiting)' },
  {
    key: 'UNDER_REVIEW',
    label: 'Under Review',
    color: 'var(--status-under-review)',
  },
  { key: 'ON_HOLD', label: 'On Hold', color: 'var(--status-on-hold)' },
  { key: 'BLOCKED', label: 'Blocked', color: 'var(--status-blocked)' },
]

export function LabelStatusBoard({
  filter,
  activeTodos,
  completedTodos,
  deletedTodos,
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
}: LabelStatusBoardProps) {
  const horizontalScrollRef = React.useRef<HTMLDivElement>(null)
  const [showLeftFade, setShowLeftFade] = React.useState(false)
  const [showRightFade, setShowRightFade] = React.useState(false)

  const updateHorizontalFades = React.useCallback(() => {
    const el = horizontalScrollRef.current
    if (!el) {
      setShowLeftFade(false)
      setShowRightFade(false)
      return
    }
    const maxScrollLeft = el.scrollWidth - el.clientWidth
    const hasOverflow = maxScrollLeft > 1
    const atStart = el.scrollLeft <= 2
    const atEnd = maxScrollLeft - el.scrollLeft <= 2
    setShowLeftFade(hasOverflow && !atStart)
    setShowRightFade(hasOverflow && !atEnd)
  }, [])

  const todosByStatus = React.useMemo(() => {
    const groups: Record<Status, Todo[]> = {
      TODO: [],
      IN_PROGRESS: [],
      WAITING: [],
      UNDER_REVIEW: [],
      ON_HOLD: [],
      BLOCKED: [],
      COMPLETED: [],
      CANCELLED: [],
    }
    for (const todo of activeTodos) {
      groups[todo.status].push(todo)
    }
    return groups
  }, [activeTodos])

  const visibleStatusColumns = STATUS_COLUMNS.filter(
    (col) => todosByStatus[col.key].length > 0,
  )

  // Recompute fade visibility when content or filter changes
  React.useEffect(() => {
    updateHorizontalFades()
  }, [updateHorizontalFades, visibleStatusColumns.length, filter])

  // Watch container resize for fade updates
  React.useEffect(() => {
    const el = horizontalScrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => updateHorizontalFades())
    ro.observe(el)
    return () => ro.disconnect()
  }, [updateHorizontalFades])

  const renderTodoItem = (todo: Todo, viewMode: LabelStatusBoardFilter) => (
    <TodoItem
      key={todo.id}
      todo={todo}
      onStatusChange={onStatusChange}
      onPriorityChange={onPriorityChange}
      onDelete={viewMode === 'active' ? onDelete : onPermanentDelete}
      onEdit={onEdit}
      onRestore={onRestore}
      onToggleSubtask={onToggleSubtask}
      onUpdateSubtasks={onUpdateSubtasks}
      onOpenNote={onOpenNote}
      people={people}
      subtaskMentions={subtaskMentions}
      viewMode={viewMode}
      animateTransitions={false}
    />
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Body */}
      {filter === 'active' ? (
        visibleStatusColumns.length === 0 ? (
          <EmptyState
            icon={
              <Inbox className="h-6 w-6" style={{ color: 'var(--accent)' }} />
            }
            bg="color-mix(in srgb, var(--accent) 15%, transparent)"
            message="No active tasks for this label"
          />
        ) : (
          <BlockedExpandedProvider expanded={true}>
            <div className="relative min-h-0 flex-1">
              <div
                ref={horizontalScrollRef}
                onScroll={updateHorizontalFades}
                className="scrollbar-hide absolute inset-0 flex flex-col gap-4 overflow-y-auto md:flex-row md:gap-3 md:overflow-x-auto md:overflow-y-hidden md:pb-2"
              >
                {visibleStatusColumns.map((col) => {
                  const colTodos = todosByStatus[col.key]
                  return (
                    <div
                      key={col.key}
                      className="flex flex-shrink-0 flex-col md:h-full md:w-72 md:max-w-72 md:min-w-72"
                    >
                      {/* Status column header */}
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: col.color }}
                        />
                        <span
                          className="text-[10px] font-semibold tracking-wide uppercase"
                          style={{ color: col.color }}
                        >
                          {col.label}
                        </span>
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
                          style={{
                            color: col.color,
                            backgroundColor: `color-mix(in srgb, ${col.color} 12%, transparent)`,
                          }}
                        >
                          {colTodos.length}
                        </span>
                      </div>
                      {/* Cards */}
                      <div className="scrollbar-hide flex flex-col gap-1 md:min-h-0 md:flex-1 md:overflow-y-auto md:pr-1">
                        {colTodos.map((todo) => renderTodoItem(todo, 'active'))}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Horizontal scroll fade indicators (md+ only) */}
              <div
                className="pointer-events-none absolute top-0 bottom-0 left-0 hidden w-10 transition-opacity duration-200 md:block"
                style={{
                  background:
                    'linear-gradient(to right, var(--background), transparent)',
                  opacity: showLeftFade ? 1 : 0,
                }}
              />
              <div
                className="pointer-events-none absolute top-0 right-0 bottom-0 hidden w-10 transition-opacity duration-200 md:block"
                style={{
                  background:
                    'linear-gradient(to left, var(--background), transparent)',
                  opacity: showRightFade ? 1 : 0,
                }}
              />
            </div>
          </BlockedExpandedProvider>
        )
      ) : filter === 'completed' ? (
        completedTodos.length === 0 ? (
          <EmptyState
            icon={
              <CheckCircle2
                className="h-6 w-6"
                style={{ color: 'var(--status-done)' }}
              />
            }
            bg="color-mix(in srgb, var(--status-done) 15%, transparent)"
            message="No completed tasks yet"
          />
        ) : (
          <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
            {completedTodos.map((todo) => renderTodoItem(todo, 'completed'))}
          </div>
        )
      ) : deletedTodos.length === 0 ? (
        <EmptyState
          icon={
            <Trash2
              className="h-6 w-6"
              style={{ color: 'var(--status-on-hold)' }}
            />
          }
          bg="color-mix(in srgb, var(--status-on-hold) 15%, transparent)"
          message="No deleted tasks"
        />
      ) : (
        <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {deletedTodos.map((todo) => renderTodoItem(todo, 'deleted'))}
        </div>
      )}
    </div>
  )
}

function EmptyState({
  icon,
  bg,
  message,
}: {
  icon: React.ReactNode
  bg: string
  message: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 rounded-full p-3" style={{ backgroundColor: bg }}>
        {icon}
      </div>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {message}
      </p>
    </div>
  )
}
