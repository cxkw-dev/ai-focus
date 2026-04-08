'use client'

import * as React from 'react'
import { Plus, Eye, EyeOff, Circle, CheckCircle2, Trash2 } from 'lucide-react'
import { HeaderActions } from '@/components/layout/header-actions-context'
import { BlockedExpandedProvider } from '@/components/todos/todo-item'
import { TodoColumn } from '@/components/todos/todo-column'
import {
  LabelStatusBoard,
  type LabelStatusBoardFilter,
} from '@/components/todos/label-status-board'
import { EditTodoDialog } from '@/components/todos/edit-todo-dialog'
import { CreateTodoModal } from '@/components/todos/create-todo-modal'
import { NoteDrawer } from '@/components/todos/note-drawer'
import { useToast } from '@/components/ui/use-toast'
import { useTodos } from '@/hooks/use-todos'
import { useLabels } from '@/hooks/use-labels'
import { usePeople } from '@/hooks/use-people'
import { buildColumns, categorizeTodosByLabel } from '@/lib/categorize-todos'
import { todosApi } from '@/lib/api'
import type {
  Todo,
  UpdateTodoInput,
  CreateTodoInput,
  SubtaskInput,
} from '@/types/todo'

export default function TodosPage() {
  const {
    todos,
    completedTodos,
    deletedTodos,
    isLoading,
    isSaving,
    create,
    update,
    updateStatus,
    updatePriority,
    archive,
    restore,
    permanentDelete,
    reorder,
    toggleSubtask,
  } = useTodos()
  const { labels } = useLabels()
  const { people } = usePeople()
  const { toast } = useToast()

  const [editingTodo, setEditingTodo] = React.useState<Todo | null>(null)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [openNote, setOpenNote] = React.useState<{
    todoId: string
    noteId: string
    todoTitle: string
  } | null>(null)
  const [blockedExpanded, setBlockedExpanded] = React.useState(false)
  const [responsiveFilter, setResponsiveFilter] =
    React.useState<LabelStatusBoardFilter>('active')

  // Build dynamic columns from labels
  const columns = React.useMemo(() => buildColumns(labels), [labels])

  // Categorize all todo lists by label
  const categorizedActive = React.useMemo(
    () => categorizeTodosByLabel(todos, columns),
    [todos, columns],
  )
  const categorizedCompleted = React.useMemo(
    () => categorizeTodosByLabel(completedTodos, columns),
    [completedTodos, columns],
  )
  const categorizedDeleted = React.useMemo(
    () => categorizeTodosByLabel(deletedTodos, columns),
    [deletedTodos, columns],
  )

  // Responsive view: hide labels that have nothing for the active filter
  const categorizedForFilter =
    responsiveFilter === 'completed'
      ? categorizedCompleted
      : responsiveFilter === 'deleted'
        ? categorizedDeleted
        : categorizedActive

  const responsiveColumns = React.useMemo(
    () =>
      columns.filter(
        (col) => (categorizedForFilter[col.key]?.length ?? 0) > 0,
      ),
    [columns, categorizedForFilter],
  )

  // Mobile category defaults to first non-empty column
  const [mobileCategory, setMobileCategory] = React.useState<string>('')
  React.useEffect(() => {
    if (
      responsiveColumns.length > 0 &&
      (!mobileCategory ||
        !responsiveColumns.some((c) => c.key === mobileCategory))
    ) {
      setMobileCategory(responsiveColumns[0].key)
    }
  }, [responsiveColumns, mobileCategory])

  const handleMobileCategoryKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, currentKey: string) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()

      const currentIndex = responsiveColumns.findIndex(
        (col) => col.key === currentKey,
      )
      if (currentIndex === -1) return
      const offset = event.key === 'ArrowRight' ? 1 : -1
      const nextIndex =
        (currentIndex + offset + responsiveColumns.length) %
        responsiveColumns.length
      setMobileCategory(responsiveColumns[nextIndex].key)
    },
    [responsiveColumns],
  )
  const subtaskMentions = React.useMemo(
    () =>
      people.map((person) => ({
        id: person.id,
        name: person.name,
        email: person.email,
      })),
    [people],
  )
  const todoTitleById = React.useMemo(
    () =>
      new Map(
        [...todos, ...completedTodos, ...deletedTodos].map((todo) => [
          todo.id,
          todo.title,
        ]),
      ),
    [todos, completedTodos, deletedTodos],
  )

  const handleCreate = React.useCallback(
    async (data: CreateTodoInput) => {
      try {
        await create.mutateAsync(data)
        return true
      } catch {
        return false
      }
    },
    [create],
  )

  const handleUpdate = React.useCallback(
    async (
      data: UpdateTodoInput,
      options?: { silent?: boolean; close?: boolean },
    ) => {
      if (!editingTodo) return
      try {
        await update.mutateAsync({ id: editingTodo.id, data })
        if (options?.close !== false) {
          setEditingTodo(null)
          setIsFormOpen(false)
        }
        if (!options?.silent) {
          toast({ title: 'Updated', description: 'Changes saved.' })
        }
      } catch {
        // Error handled by mutation
      }
    },
    [editingTodo, update, toast],
  )

  const handleEdit = React.useCallback((todo: Todo) => {
    setEditingTodo(todo)
    setIsFormOpen(true)
  }, [])

  const handleFormClose = React.useCallback((open: boolean) => {
    setIsFormOpen(open)
    if (!open) setEditingTodo(null)
  }, [])

  const handleStatusChange = React.useCallback(
    (id: string, status: Todo['status']) => updateStatus.mutate({ id, status }),
    [updateStatus],
  )

  const handlePriorityChange = React.useCallback(
    (id: string, priority: Todo['priority']) =>
      updatePriority.mutate({ id, priority }),
    [updatePriority],
  )

  const handleDelete = React.useCallback(
    (id: string) => archive.mutate(id),
    [archive],
  )

  const handlePermanentDelete = React.useCallback(
    (id: string) => permanentDelete.mutate(id),
    [permanentDelete],
  )

  const handleRestore = React.useCallback(
    (id: string) => restore.mutate(id),
    [restore],
  )

  const handleToggleSubtask = React.useCallback(
    (todoId: string, subtaskId: string, completed: boolean) =>
      toggleSubtask.mutate({ todoId, subtaskId, completed }),
    [toggleSubtask],
  )

  const handleUpdateSubtasks = React.useCallback(
    (todoId: string, subtasks: SubtaskInput[]) =>
      update.mutate({ id: todoId, data: { subtasks } }),
    [update],
  )

  const handleReorder = React.useCallback(
    (reorderedTodos: Todo[]) => reorder.mutate(reorderedTodos),
    [reorder],
  )

  const handleOpenNote = React.useCallback(
    (todoId: string, noteId: string) => {
      setOpenNote({
        todoId,
        noteId,
        todoTitle: todoTitleById.get(todoId) ?? 'Note',
      })
    },
    [todoTitleById],
  )

  const handleUnlinkNote = React.useCallback(async () => {
    if (!openNote) return
    await todosApi.update(openNote.todoId, { notebookNoteId: null })
    setOpenNote(null)
  }, [openNote])

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center">
        <div className="w-full max-w-md space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg"
              style={{ backgroundColor: 'var(--surface-2)' }}
            />
          ))}
        </div>
      </div>
    )
  }

  const mobileCol =
    responsiveColumns.find((c) => c.key === mobileCategory) ??
    responsiveColumns[0]

  return (
    <BlockedExpandedProvider expanded={blockedExpanded}>
    <div className="flex h-[calc(100vh-120px)] flex-col">
      <HeaderActions>
        {/* Desktop (xl+): show "Show blocked" toggle */}
        <button
          type="button"
          onClick={() => setBlockedExpanded((prev) => !prev)}
          className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all xl:flex"
          style={{
            backgroundColor: blockedExpanded
              ? 'color-mix(in srgb, var(--primary) 16%, var(--surface-2) 84%)'
              : 'var(--surface-2)',
            color: blockedExpanded ? 'var(--primary)' : 'var(--text-muted)',
            border: blockedExpanded
              ? '1px solid color-mix(in srgb, var(--primary) 30%, transparent)'
              : '1px solid var(--border-color)',
          }}
          title={
            blockedExpanded ? 'Collapse blocked cards' : 'Expand blocked cards'
          }
          aria-label={
            blockedExpanded ? 'Collapse blocked cards' : 'Expand blocked cards'
          }
        >
          {blockedExpanded ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
          <span>{blockedExpanded ? 'Collapse blocked' : 'Show blocked'}</span>
        </button>

        {/* Responsive (< xl): active / completed / deleted filter */}
        <div
          className="flex items-center gap-0.5 rounded-lg p-0.5 xl:hidden"
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-color)',
          }}
          role="tablist"
          aria-label="Filter todos"
        >
          {(
            [
              { key: 'active', label: 'Active', icon: Circle },
              { key: 'completed', label: 'Done', icon: CheckCircle2 },
              { key: 'deleted', label: 'Trash', icon: Trash2 },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon
            const isActive = responsiveFilter === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setResponsiveFilter(tab.key)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
                style={{
                  backgroundColor: isActive
                    ? 'color-mix(in srgb, var(--primary) 16%, transparent)'
                    : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                }}
              >
                <Icon className="h-3 w-3" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </HeaderActions>

      {/* Mobile/Narrow View (< 1280px) */}
      <div className="flex h-full flex-col xl:hidden">
        {/* Category tab switcher */}
        <div
          className="mb-3 rounded-xl border p-1.5"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor:
              'color-mix(in srgb, var(--surface) 72%, transparent)',
          }}
        >
          <div
            className="flex gap-1.5"
            role="tablist"
            aria-label="Task categories"
          >
            {responsiveColumns.map((col) => {
              const count = (categorizedForFilter[col.key] ?? []).length
              const isActive = mobileCategory === col.key

              return (
                <button
                  key={col.key}
                  type="button"
                  id={`todos-category-tab-${col.key}`}
                  role="tab"
                  aria-controls={`todos-category-panel-${col.key}`}
                  aria-selected={isActive}
                  onClick={() => setMobileCategory(col.key)}
                  onKeyDown={(event) =>
                    handleMobileCategoryKeyDown(event, col.key)
                  }
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-all active:scale-[0.99]"
                  style={{
                    border: `1px solid ${
                      isActive
                        ? `color-mix(in srgb, ${col.color} 45%, var(--border-color))`
                        : 'transparent'
                    }`,
                    backgroundColor: isActive
                      ? 'color-mix(in srgb, var(--surface-2) 82%, transparent)'
                      : 'transparent',
                    color: isActive
                      ? 'var(--text-primary)'
                      : 'var(--text-muted)',
                  }}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{
                        backgroundColor: col.color,
                        boxShadow: isActive
                          ? `0 0 0 3px color-mix(in srgb, ${col.color} 22%, transparent)`
                          : 'none',
                      }}
                    />
                    <span
                      className="block min-w-0 truncate text-xs leading-none font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {col.title}
                    </span>
                  </span>

                  <span
                    className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums"
                    style={{
                      backgroundColor: isActive
                        ? `color-mix(in srgb, ${col.color} 20%, transparent)`
                        : 'color-mix(in srgb, var(--surface-2) 78%, transparent)',
                      color: isActive ? col.color : 'var(--text-muted)',
                    }}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {mobileCol && (
          <div
            className="min-h-0 flex-1"
            role="tabpanel"
            id={`todos-category-panel-${mobileCategory}`}
            aria-labelledby={`todos-category-tab-${mobileCategory}`}
          >
            <LabelStatusBoard
              filter={responsiveFilter}
              activeTodos={categorizedActive[mobileCol.key] ?? []}
              completedTodos={categorizedCompleted[mobileCol.key] ?? []}
              deletedTodos={categorizedDeleted[mobileCol.key] ?? []}
              onEdit={handleEdit}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onDelete={handleDelete}
              onPermanentDelete={handlePermanentDelete}
              onRestore={handleRestore}
              onToggleSubtask={handleToggleSubtask}
              onUpdateSubtasks={handleUpdateSubtasks}
              onOpenNote={handleOpenNote}
              people={people}
              subtaskMentions={subtaskMentions}
            />
          </div>
        )}
      </div>

      {/* Desktop View (>= 1280px) */}
      <div className="hidden min-h-0 flex-1 xl:flex xl:flex-col">
        <div
          className="min-h-0 flex-1 gap-6"
          style={{
            display: 'grid',
            gridTemplateColumns: columns
              .map((col) =>
                (categorizedActive[col.key] ?? []).length === 0
                  ? '36px'
                  : 'minmax(0, 1fr)',
              )
              .join(' '),
          }}
        >
          {columns.map((col) => {
            const active = categorizedActive[col.key] ?? []
            if (active.length === 0) {
              return (
                <div
                  key={col.key}
                  className="flex flex-col items-center"
                >
                  <span
                    className="mt-3 text-[8px] font-bold uppercase tracking-wide"
                    style={{ color: col.color, opacity: 0.4, writingMode: 'vertical-rl' }}
                  >
                    {col.title}
                  </span>
                  <div
                    className="mt-2 flex-1"
                    style={{
                      width: 1,
                      background:
                        `linear-gradient(to bottom, color-mix(in srgb, ${col.color} 20%, transparent), transparent 80%)`,
                    }}
                  />
                  <span
                    className="mb-3 text-[9px]"
                    style={{ color: col.color, opacity: 0.3 }}
                  >
                    0
                  </span>
                </div>
              )
            }
            return (
              <TodoColumn
                key={col.key}
                title={col.title}
                color={col.color}
                activeTodos={active}
                completedTodos={categorizedCompleted[col.key] ?? []}
                deletedTodos={categorizedDeleted[col.key] ?? []}
                onEdit={handleEdit}
                onStatusChange={handleStatusChange}
                onPriorityChange={handlePriorityChange}
                onDelete={handleDelete}
                onPermanentDelete={handlePermanentDelete}
                onRestore={handleRestore}
                onToggleSubtask={handleToggleSubtask}
                onUpdateSubtasks={handleUpdateSubtasks}
                onOpenNote={handleOpenNote}
                onReorder={handleReorder}
                onCreateTodo={handleCreate}
                isSaving={isSaving}
                defaultLabelIds={col.labelId ? [col.labelId] : []}
                people={people}
                subtaskMentions={subtaskMentions}
                showInlineForm={false}
              />
            )
          })}
        </div>
      </div>

      {/* Edit Dialog */}
      <EditTodoDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={handleUpdate}
        todo={editingTodo}
        isLoading={isSaving}
        people={people}
      />

      {/* Create Modal */}
      <CreateTodoModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreate}
        isLoading={isSaving}
        people={people}
      />

      {/* Note Drawer */}
      <NoteDrawer
        noteId={openNote?.noteId ?? null}
        todoTitle={openNote?.todoTitle}
        open={!!openNote}
        onClose={() => setOpenNote(null)}
        onUnlink={handleUnlinkNote}
      />

      <button
        type="button"
        onClick={() => setIsCreateModalOpen(true)}
        className="group fixed right-4 bottom-4 z-50 flex items-center rounded-full transition-transform active:scale-95 sm:right-6 sm:bottom-6"
        style={{
          backgroundColor: 'var(--surface-2)',
          boxShadow:
            '0 4px 20px color-mix(in srgb, var(--background) 70%, transparent)',
        }}
        aria-label="Add task"
      >
        <span
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
          style={{
            backgroundColor: 'var(--primary)',
            border: '3px solid var(--surface-2)',
          }}
        >
          <Plus
            className="h-5 w-5 group-hover:animate-[spin_0.5s_ease-in-out]"
            strokeWidth={2.5}
            style={{ color: 'var(--primary-foreground)' }}
          />
        </span>
        <span
          className="hidden pr-4 pl-2 text-xs font-semibold tracking-wide sm:inline"
          style={{ color: 'var(--text-primary)' }}
        >
          Add Task
        </span>
      </button>
    </div>
    </BlockedExpandedProvider>
  )
}
