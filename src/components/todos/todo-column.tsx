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
import type {
  Todo,
  Status,
  Priority,
  CreateTodoInput,
  SubtaskInput,
} from '@/types/todo'
import type { Person } from '@/types/person'

type Filter = 'active' | 'completed' | 'deleted'

interface TodoColumnProps {
  title: string
  color: string
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
  onReorder: (reorderedTodos: Todo[]) => void
  onCreateTodo: (data: CreateTodoInput) => Promise<boolean>
  isSaving?: boolean
  defaultLabelIds?: string[]
  people: Person[]
  subtaskMentions: Array<Pick<Person, 'id' | 'name' | 'email'>>
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
  onUpdateSubtasks,
  onOpenNote,
  onReorder,
  onCreateTodo,
  isSaving,
  defaultLabelIds,
  people,
  subtaskMentions,
  showInlineForm = true,
  animateListTransitions = true,
}: TodoColumnProps) {
  const [filter, setFilter] = React.useState<Filter>('active')
  const [completedSearch, setCompletedSearch] = React.useState('')
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [overId, setOverId] = React.useState<string | null>(null)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const listContentRef = React.useRef<HTMLDivElement>(null)
  const [showBottomFade, setShowBottomFade] = React.useState(false)

  const updateBottomFade = React.useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) {
      setShowBottomFade(false)
      return
    }

    const maxScrollTop = container.scrollHeight - container.clientHeight
    const hasOverflow = maxScrollTop > 1
    const isAtBottom = maxScrollTop - container.scrollTop <= 2
    setShowBottomFade(hasOverflow && !isAtBottom)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const filteredCompletedTodos = React.useMemo(() => {
    if (!completedSearch) return completedTodos
    const q = completedSearch.toLowerCase()
    return completedTodos.filter((t) => t.title.toLowerCase().includes(q))
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

  const activeTodo = activeId
    ? activeTodos.find((t) => t.id === activeId)
    : null

  const tabs = [
    {
      value: 'active' as Filter,
      label: 'Active',
      icon: Circle,
      count: activeTodos.length,
      color: 'var(--status-in-progress)',
    },
    {
      value: 'completed' as Filter,
      label: 'Completed',
      icon: CheckCircle2,
      count: completedTodos.length,
      color: 'var(--status-done)',
    },
    {
      value: 'deleted' as Filter,
      label: 'Deleted',
      icon: Trash2,
      count: deletedTodos.length,
      color: 'var(--status-on-hold)',
    },
  ]
  const headerInsetStyle = {
    marginLeft: '20px',
    marginRight: '22px',
  }

  const emptyMessage =
    filter === 'active'
      ? 'No active tasks'
      : filter === 'completed'
        ? completedSearch
          ? 'No matching tasks'
          : 'No completed tasks yet'
        : 'No deleted tasks'

  const emptyIcon =
    filter === 'completed' ? (
      <CheckCircle2
        className="h-6 w-6"
        style={{ color: 'var(--status-done)' }}
      />
    ) : filter === 'deleted' ? (
      <Trash2 className="h-6 w-6" style={{ color: 'var(--status-on-hold)' }} />
    ) : (
      <Inbox className="h-6 w-6" style={{ color: 'var(--accent)' }} />
    )

  const emptyBg =
    filter === 'completed'
      ? 'color-mix(in srgb, var(--status-done) 15%, transparent)'
      : filter === 'deleted'
        ? 'color-mix(in srgb, var(--status-on-hold) 15%, transparent)'
        : 'color-mix(in srgb, var(--accent) 15%, transparent)'

  React.useEffect(() => {
    updateBottomFade()
  }, [updateBottomFade, displayedTodos.length, filter, completedSearch])

  React.useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver(() => {
      updateBottomFade()
    })

    resizeObserver.observe(container)
    const listContent = listContentRef.current
    if (listContent) {
      resizeObserver.observe(listContent)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [updateBottomFade])

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Column header */}
      <div className="mb-3 shrink-0" style={headerInsetStyle}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center">
              <h2
                className="truncate text-[11px] leading-none font-bold"
                style={{
                  color: 'var(--text-primary)',
                }}
              >
                {title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-0.5 self-start sm:self-auto">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className="todo-filter-btn flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium transition-colors"
                style={
                  filter === tab.value
                    ? {
                        backgroundColor:
                          'color-mix(in srgb, var(--surface-2) 78%, transparent)',
                        color: tab.color,
                      }
                    : {
                        color: 'var(--text-muted)',
                      }
                }
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
        <div className="mt-2 flex items-center gap-2">
          <div
            className="h-px w-8 flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <div
            className="h-px flex-1"
            style={{
              background: `linear-gradient(90deg, color-mix(in srgb, ${color} 20%, transparent) 0%, transparent 100%)`,
            }}
          />
        </div>
      </div>

      {/* Inline create form (desktop only) */}
      {showInlineForm && filter === 'active' && (
        <div className="mb-3 flex-shrink-0">
          <InlineTodoForm
            onSubmit={onCreateTodo}
            isLoading={isSaving}
            defaultLabelIds={defaultLabelIds}
            subtaskMentions={subtaskMentions}
          />
        </div>
      )}

      {/* Search bar for completed tab */}
      {filter === 'completed' && (
        <div className="relative mb-2 flex-shrink-0">
          <Search
            className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            value={completedSearch}
            onChange={(e) => setCompletedSearch(e.target.value)}
            placeholder="Search completed tasks..."
            className="h-8 w-full rounded-lg border pr-8 pl-8 text-xs transition-colors outline-none"
            style={{
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)',
            }}
          />
          {completedSearch && (
            <button
              onClick={() => setCompletedSearch('')}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 transition-colors hover:bg-white/10"
            >
              <X className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>
      )}

      {/* Todo items with drag and drop */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollContainerRef}
          onScroll={updateBottomFade}
          className="scrollbar-hide h-full overflow-y-auto"
        >
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
              <div ref={listContentRef} className="space-y-1">
                {displayedTodos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div
                      className="mb-3 rounded-full p-3"
                      style={{ backgroundColor: emptyBg }}
                    >
                      {emptyIcon}
                    </div>
                    <p
                      className="text-sm"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {emptyMessage}
                    </p>
                  </div>
                ) : animateListTransitions ? (
                  <AnimatePresence mode="popLayout" initial={false}>
                    {displayedTodos.map((todo) => {
                      let dropIndicator: 'above' | 'below' | null = null
                      if (
                        activeId &&
                        overId &&
                        overId === todo.id &&
                        activeId !== overId
                      ) {
                        const activeIndex = activeTodos.findIndex(
                          (t) => t.id === activeId,
                        )
                        const overIndex = activeTodos.findIndex(
                          (t) => t.id === overId,
                        )
                        if (activeIndex !== -1 && overIndex !== -1) {
                          dropIndicator =
                            activeIndex < overIndex ? 'below' : 'above'
                        }
                      }
                      return (
                        <TodoItem
                          key={todo.id}
                          todo={todo}
                          onStatusChange={onStatusChange}
                          onPriorityChange={onPriorityChange}
                          onDelete={
                            filter === 'active' ? onDelete : onPermanentDelete
                          }
                          onEdit={onEdit}
                          onRestore={onRestore}
                          onToggleSubtask={onToggleSubtask}
                          onUpdateSubtasks={onUpdateSubtasks}
                          onOpenNote={onOpenNote}
                          people={people}
                          subtaskMentions={subtaskMentions}
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
                    if (
                      activeId &&
                      overId &&
                      overId === todo.id &&
                      activeId !== overId
                    ) {
                      const activeIndex = activeTodos.findIndex(
                        (t) => t.id === activeId,
                      )
                      const overIndex = activeTodos.findIndex(
                        (t) => t.id === overId,
                      )
                      if (activeIndex !== -1 && overIndex !== -1) {
                        dropIndicator =
                          activeIndex < overIndex ? 'below' : 'above'
                      }
                    }
                    return (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onStatusChange={onStatusChange}
                        onPriorityChange={onPriorityChange}
                        onDelete={
                          filter === 'active' ? onDelete : onPermanentDelete
                        }
                        onEdit={onEdit}
                        onRestore={onRestore}
                        onToggleSubtask={onToggleSubtask}
                        onUpdateSubtasks={onUpdateSubtasks}
                        people={people}
                        subtaskMentions={subtaskMentions}
                        viewMode={filter}
                        dropIndicator={dropIndicator}
                        animateTransitions={false}
                      />
                    )
                  })
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
                  people={people}
                  subtaskMentions={subtaskMentions}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
        {/* Bottom fade overlay */}
        {showBottomFade && (
          <div
            className="pointer-events-none absolute right-0 bottom-0 left-0 h-12"
            style={{
              background:
                'linear-gradient(to top, var(--background), transparent)',
            }}
          />
        )}
      </div>
    </div>
  )
}
