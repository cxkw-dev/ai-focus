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
import type { Todo } from '@/types/todo'

interface TodoListProps {
  todos: Todo[]
  archivedTodos: Todo[]
  onToggle: (id: string, completed: boolean) => void
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
  onToggle,
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
        return todos.filter((t) => !t.completed)
      case 'completed':
        return todos.filter((t) => t.completed)
      default:
        return todos
    }
  }, [todos, archivedTodos, filter])

  const stats = React.useMemo(() => {
    const active = todos.filter((t) => !t.completed).length
    const completed = todos.filter((t) => t.completed).length
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
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl border bg-card animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header with filters - compact to align better with side columns */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tasks</h2>
        <div className="flex items-center gap-0.5">
          {[
            { value: 'all', label: 'All', icon: Inbox, count: stats.total },
            { value: 'active', label: 'Active', icon: Circle, count: stats.active },
            { value: 'completed', label: 'Done', icon: CheckCircle2, count: stats.completed },
            { value: 'archived', label: 'Archived', icon: Archive, count: stats.archived },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value as Filter)}
              className={cn(
                'flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors',
                filter === tab.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
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
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredTodos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-3 mb-3">
                      {isArchiveView ? (
                        <Archive className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <Inbox className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
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
                      onToggle={onToggle}
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
                onToggle={() => {}}
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
