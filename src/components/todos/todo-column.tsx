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
  DragOverEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Circle, CheckCircle2, Trash2, Inbox, Search, X } from 'lucide-react'
import { TodoItem, TodoItemOverlay } from './todo-item'
import { InlineTodoForm } from './inline-todo-form'
import type { Todo, Status, Priority, CreateTodoInput } from '@/types/todo'
import type { TodoCategory } from '@/lib/categorize-todos'

type Filter = 'active' | 'completed' | 'deleted'

interface TodoColumnProps {
  title: string
  color: string
  category: TodoCategory
  activeTodos: Todo[]
  completedTodos: Todo[]
  deletedTodos: Todo[]
  onEdit: (todo: Todo) => void
  onStatusChange: (id: string, status: Status) => void
  onPriorityChange: (id: string, priority: Priority) => void
  onDelete: (id: string) => void
  onPermanentDelete: (id: string) => void
  onRestore: (id: string) => void
  onToggleSubtask: (todoId: string, subtaskId: string, completed: boolean) => void
  onReorder: (reorderedTodos: Todo[]) => void
  onCreateTodo: (data: CreateTodoInput) => Promise<boolean>
  isSaving?: boolean
  defaultLabelIds?: string[]
  showInlineForm?: boolean
  animateListTransitions?: boolean
}

export function TodoColumn({
  title,
  color,
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
  onReorder,
  onCreateTodo,
  isSaving,
  defaultLabelIds,
  showInlineForm = true,
  animateListTransitions = true,
}: TodoColumnProps) {
  const [filter, setFilter] = React.useState<Filter>('active')
  const [completedSearch, setCompletedSearch] = React.useState('')
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [overId, setOverId] = React.useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const filteredCompletedTodos = React.useMemo(() => {
    if (!completedSearch) return completedTodos
    const q = completedSearch.toLowerCase()
    return completedTodos.filter(t => t.title.toLowerCase().includes(q))
  }, [completedTodos, completedSearch])

  const displayedTodos = React.useMemo(() => {
    if (filter === 'completed') return filteredCompletedTodos
    if (filter === 'deleted') return deletedTodos
    return activeTodos
  }, [activeTodos, filteredCompletedTodos, deletedTodos, filter])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string | null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setOverId(null)

    if (over && active.id !== over.id) {
      const oldIndex = activeTodos.findIndex((t) => t.id === active.id)
      const newIndex = activeTodos.findIndex((t) => t.id === over.id)
      onReorder(arrayMove(activeTodos, oldIndex, newIndex))
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setOverId(null)
  }

  const activeTodo = activeId ? activeTodos.find((t) => t.id === activeId) : null

  const tabs = [
    { value: 'active' as Filter, label: 'Active', icon: Circle, count: activeTodos.length, color: 'var(--status-in-progress)' },
    { value: 'completed' as Filter, label: 'Completed', icon: CheckCircle2, count: completedTodos.length, color: 'var(--status-done)' },
    { value: 'deleted' as Filter, label: 'Deleted', icon: Trash2, count: deletedTodos.length, color: 'var(--status-on-hold)' },
  ]

  const emptyMessage = filter === 'active'
    ? 'No active tasks'
    : filter === 'completed'
      ? completedSearch ? 'No matching tasks' : 'No completed tasks yet'
      : 'No deleted tasks'

  const emptyIcon = filter === 'completed'
    ? <CheckCircle2 className="h-6 w-6" style={{ color: 'var(--status-done)' }} />
    : filter === 'deleted'
      ? <Trash2 className="h-6 w-6" style={{ color: 'var(--status-on-hold)' }} />
      : <Inbox className="h-6 w-6" style={{ color: 'var(--accent)' }} />

  const emptyBg = filter === 'completed'
    ? 'color-mix(in srgb, var(--status-done) 15%, transparent)'
    : filter === 'deleted'
      ? 'color-mix(in srgb, var(--status-on-hold) 15%, transparent)'
      : 'color-mix(in srgb, var(--accent) 15%, transparent)'

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="w-1 h-4 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h2 className="text-xs font-medium uppercase tracking-wide" style={{ color }}>{title}</h2>
        </div>
        <div className="flex items-center gap-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className="todo-filter-btn flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors"
              style={filter === tab.value ? {
                backgroundColor: `color-mix(in srgb, ${tab.color} 15%, transparent)`,
                color: tab.color,
              } : {
                color: 'var(--text-muted)',
              }}
              data-color={tab.color}
              data-active={filter === tab.value ? 'true' : undefined}
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

      {/* Inline create form (desktop only) */}
      {showInlineForm && filter === 'active' && (
        <div className="flex-shrink-0 mb-3">
          <InlineTodoForm
            onSubmit={onCreateTodo}
            isLoading={isSaving}
            defaultLabelIds={defaultLabelIds}
          />
        </div>
      )}

      {/* Search bar for completed tab */}
      {filter === 'completed' && (
        <div className="relative mb-2 flex-shrink-0">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            value={completedSearch}
            onChange={(e) => setCompletedSearch(e.target.value)}
            placeholder="Search completed tasks..."
            className="w-full h-8 pl-8 pr-8 rounded-lg text-xs outline-none border transition-colors"
            style={{
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)',
            }}
          />
          {completedSearch && (
            <button
              onClick={() => setCompletedSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white/10 transition-colors"
            >
              <X className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>
      )}

      {/* Todo items with drag and drop */}
      <div className="relative flex-1 min-h-0">
        <div className="h-full overflow-y-auto scrollbar-hide">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={displayedTodos.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {displayedTodos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div
                      className="rounded-full p-3 mb-3"
                      style={{ backgroundColor: emptyBg }}
                    >
                      {emptyIcon}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {emptyMessage}
                    </p>
                  </div>
                ) : (
                  animateListTransitions ? (
                    <AnimatePresence mode="popLayout" initial={false}>
                      {displayedTodos.map((todo) => {
                        let dropIndicator: 'above' | 'below' | null = null
                        if (activeId && overId && overId === todo.id && activeId !== overId) {
                          const activeIndex = activeTodos.findIndex(t => t.id === activeId)
                          const overIndex = activeTodos.findIndex(t => t.id === overId)
                          if (activeIndex !== -1 && overIndex !== -1) {
                            dropIndicator = activeIndex < overIndex ? 'below' : 'above'
                          }
                        }
                        return (
                          <TodoItem
                            key={todo.id}
                            todo={todo}
                            onStatusChange={onStatusChange}
                            onPriorityChange={onPriorityChange}
                            onDelete={filter === 'deleted' ? onPermanentDelete : onDelete}
                            onEdit={onEdit}
                            onRestore={onRestore}
                            onToggleSubtask={onToggleSubtask}
                            viewMode={filter}
                            dropIndicator={dropIndicator}
                            animateTransitions={true}
                          />
                        )
                      })}
                    </AnimatePresence>
                  ) : (
                    displayedTodos.map((todo) => {
                      let dropIndicator: 'above' | 'below' | null = null
                      if (activeId && overId && overId === todo.id && activeId !== overId) {
                        const activeIndex = activeTodos.findIndex(t => t.id === activeId)
                        const overIndex = activeTodos.findIndex(t => t.id === overId)
                        if (activeIndex !== -1 && overIndex !== -1) {
                          dropIndicator = activeIndex < overIndex ? 'below' : 'above'
                        }
                      }
                      return (
                        <TodoItem
                          key={todo.id}
                          todo={todo}
                          onStatusChange={onStatusChange}
                          onPriorityChange={onPriorityChange}
                          onDelete={filter === 'deleted' ? onPermanentDelete : onDelete}
                          onEdit={onEdit}
                          onRestore={onRestore}
                          onToggleSubtask={onToggleSubtask}
                          viewMode={filter}
                          dropIndicator={dropIndicator}
                          animateTransitions={false}
                        />
                      )
                    })
                  )
                )}
              </div>
            </SortableContext>

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
        {/* Bottom fade overlay */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-12"
          style={{
            background: 'linear-gradient(to top, var(--background), transparent)',
          }}
        />
      </div>
    </div>
  )
}
