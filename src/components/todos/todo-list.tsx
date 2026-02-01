'use client'

import * as React from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CheckCircle2, Circle, Archive, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TodoItem, TodoItemOverlay } from './todo-item'
import { Button } from '@/components/ui/button'
import type { Todo, Status, Priority } from '@/types/todo'

interface TodoListProps {
  todos: Todo[]
  archivedTodos: Todo[]
  onStatusChange: (id: string, status: Status) => void
  onPriorityChange: (id: string, priority: Priority) => void
  onDelete: (id: string) => void
  onPermanentDelete?: (id: string) => void
  onEdit: (todo: Todo) => void
  onReorder: (todos: Todo[]) => void
  onRestore: (id: string) => void
  isLoading?: boolean
}

type Filter = 'all' | 'active' | 'completed' | 'archived'

export function TodoList({
  todos,
  archivedTodos,
  onStatusChange,
  onPriorityChange,
  onDelete,
  onPermanentDelete,
  onEdit,
  onReorder,
  onRestore,
  isLoading,
}: TodoListProps) {
  const [filter, setFilter] = React.useState<Filter>('all')
  const [activeId, setActiveId] = React.useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const filteredTodos = React.useMemo(() => {
    if (filter === 'archived') {
      return archivedTodos
    }
    switch (filter) {
      case 'active':
        return todos.filter((t) => t.status !== 'COMPLETED')
      case 'completed':
        return todos.filter((t) => t.status === 'COMPLETED')
      default:
        return todos
    }
  }, [todos, archivedTodos, filter])

  const stats = React.useMemo(() => {
    const active = todos.filter((t) => t.status !== 'COMPLETED').length
    const completed = todos.filter((t) => t.status === 'COMPLETED').length
    return { active, completed, total: todos.length, archived: archivedTodos.length }
  }, [todos, archivedTodos])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const oldIndex = todos.findIndex((t) => t.id === active.id)
      const newIndex = todos.findIndex((t) => t.id === over.id)
      const newTodos = arrayMove(todos, oldIndex, newIndex)
      onReorder(newTodos)
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const activeTodo = activeId ? todos.find((t) => t.id === activeId) : null
  const isArchiveView = filter === 'archived'

  if (isLoading) {
    return (
      <div className="space-y-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-lg animate-pulse"
            style={{ backgroundColor: 'var(--surface-2)' }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header with filters - compact to align better with side columns */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="w-1 h-4 rounded-full"
            style={{ backgroundColor: 'var(--primary)' }}
          />
          <h2 className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--primary)' }}>Tasks</h2>
        </div>
        <div className="flex items-center gap-0.5">
          {[
            { value: 'all', label: 'All', icon: Inbox, count: stats.total, color: 'var(--text-muted)' },
            { value: 'active', label: 'Active', icon: Circle, count: stats.active, color: 'var(--status-in-progress)' },
            { value: 'completed', label: 'Done', icon: CheckCircle2, count: stats.completed, color: 'var(--status-done)' },
            { value: 'archived', label: 'Archived', icon: Archive, count: stats.archived, color: 'var(--status-on-hold)' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value as Filter)}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors"
              style={filter === tab.value ? {
                backgroundColor: `color-mix(in srgb, ${tab.color} 15%, transparent)`,
                color: tab.color,
              } : {
                color: 'var(--text-muted)',
              }}
              onMouseEnter={(e) => {
                if (filter !== tab.value) {
                  e.currentTarget.style.color = tab.color
                  e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${tab.color} 10%, transparent)`
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== tab.value) {
                  e.currentTarget.style.color = 'var(--text-muted)'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              <tab.icon className="h-2.5 w-2.5" />
              {tab.count > 0 && (
                <span className="tabular-nums">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Todo Items with Drag and Drop - scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={filteredTodos.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              <AnimatePresence mode="popLayout">
                {filteredTodos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div
                      className="rounded-full p-3 mb-3"
                      style={{
                        backgroundColor: isArchiveView
                          ? 'color-mix(in srgb, var(--status-on-hold) 15%, transparent)'
                          : filter === 'completed'
                          ? 'color-mix(in srgb, var(--status-done) 15%, transparent)'
                          : 'color-mix(in srgb, var(--accent) 15%, transparent)',
                      }}
                    >
                      {isArchiveView ? (
                        <Archive className="h-6 w-6" style={{ color: 'var(--status-on-hold)' }} />
                      ) : filter === 'completed' ? (
                        <CheckCircle2 className="h-6 w-6" style={{ color: 'var(--status-done)' }} />
                      ) : (
                        <Inbox className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                      )}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {isArchiveView
                        ? 'No archived items'
                        : filter === 'all'
                        ? 'No todos yet'
                        : filter === 'active'
                        ? 'All done!'
                        : 'Nothing completed'}
                    </p>
                  </div>
                ) : (
                  filteredTodos.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onStatusChange={onStatusChange}
                      onPriorityChange={onPriorityChange}
                      onDelete={isArchiveView && onPermanentDelete ? onPermanentDelete : onDelete}
                      onEdit={onEdit}
                      onRestore={onRestore}
                      isArchiveView={isArchiveView}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </SortableContext>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeTodo ? (
              <TodoItemOverlay
                todo={activeTodo}
                onStatusChange={() => {}}
                onPriorityChange={() => {}}
                onDelete={() => {}}
                onEdit={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
