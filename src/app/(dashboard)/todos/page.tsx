'use client'

import * as React from 'react'
import { Plus, Rows3 } from 'lucide-react'
import { TodoColumn } from '@/components/todos/todo-column'
import { EditTodoDialog } from '@/components/todos/edit-todo-dialog'
import { CreateTodoModal } from '@/components/todos/create-todo-modal'
import { NoteDrawer } from '@/components/todos/note-drawer'
import { useToast } from '@/components/ui/use-toast'
import { useTodos } from '@/hooks/use-todos'
import { useLabels } from '@/hooks/use-labels'
import { categorizeTodos, type TodoCategory } from '@/lib/categorize-todos'
import { todosApi } from '@/lib/api'
import type { Todo, UpdateTodoInput, CreateTodoInput, SubtaskInput } from '@/types/todo'

const COLUMNS: { key: TodoCategory; title: string; color: string }[] = [
  { key: 'kaf', title: 'KAF', color: 'var(--accent)' },
  { key: 'projects', title: 'Projects', color: 'var(--primary)' },
  { key: 'others', title: 'Others', color: 'var(--status-waiting)' },
]

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
  const { toast } = useToast()

  const [editingTodo, setEditingTodo] = React.useState<Todo | null>(null)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [mobileCategory, setMobileCategory] = React.useState<TodoCategory>('kaf')
  const [openNote, setOpenNote] = React.useState<{ todoId: string; noteId: string; todoTitle: string } | null>(null)
  const [compact, setCompact] = React.useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('ai-focus-compact-mode') === 'true'
  })

  const toggleCompact = React.useCallback(() => {
    setCompact(prev => {
      const next = !prev
      localStorage.setItem('ai-focus-compact-mode', String(next))
      return next
    })
  }, [])

  const handleMobileCategoryKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, currentCategory: TodoCategory) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()

      const currentIndex = COLUMNS.findIndex((column) => column.key === currentCategory)
      const offset = event.key === 'ArrowRight' ? 1 : -1
      const nextIndex = (currentIndex + offset + COLUMNS.length) % COLUMNS.length
      setMobileCategory(COLUMNS[nextIndex].key)
    },
    []
  )

  // Find label IDs for default auto-labeling
  const kafLabelId = React.useMemo(
    () => labels.find(l => l.name.toLowerCase() === 'kaf')?.id,
    [labels]
  )
  const defaultLabelIdsMap = React.useMemo<Record<TodoCategory, string[]>>(() => ({
    kaf: kafLabelId ? [kafLabelId] : [],
    projects: [],
    others: [],
  }), [kafLabelId])

  // Categorize all todo lists
  const categorizedActive = React.useMemo(() => categorizeTodos(todos), [todos])
  const categorizedCompleted = React.useMemo(() => categorizeTodos(completedTodos), [completedTodos])
  const categorizedDeleted = React.useMemo(() => categorizeTodos(deletedTodos), [deletedTodos])

  const handleCreate = React.useCallback(async (data: CreateTodoInput) => {
    try {
      await create.mutateAsync(data)
      return true
    } catch {
      return false
    }
  }, [create])

  const handleUpdate = React.useCallback(async (
    data: UpdateTodoInput,
    options?: { silent?: boolean; close?: boolean }
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
  }, [editingTodo, update, toast])

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
    [updateStatus]
  )

  const handlePriorityChange = React.useCallback(
    (id: string, priority: Todo['priority']) => updatePriority.mutate({ id, priority }),
    [updatePriority]
  )

  const handleDelete = React.useCallback(
    (id: string) => archive.mutate(id),
    [archive]
  )

  const handlePermanentDelete = React.useCallback(
    (id: string) => permanentDelete.mutate(id),
    [permanentDelete]
  )

  const handleRestore = React.useCallback(
    (id: string) => restore.mutate(id),
    [restore]
  )

  const handleToggleSubtask = React.useCallback(
    (todoId: string, subtaskId: string, completed: boolean) =>
      toggleSubtask.mutate({ todoId, subtaskId, completed }),
    [toggleSubtask]
  )

  const handleUpdateSubtasks = React.useCallback(
    (todoId: string, subtasks: SubtaskInput[]) =>
      update.mutate({ id: todoId, data: { subtasks } }),
    [update]
  )

  const handleReorder = React.useCallback(
    (reorderedTodos: Todo[]) => reorder.mutate(reorderedTodos),
    [reorder]
  )

  const handleOpenNote = React.useCallback(
    (todoId: string, noteId: string) => {
      const allTodos = [...todos, ...completedTodos, ...deletedTodos]
      const todo = allTodos.find(t => t.id === todoId)
      setOpenNote({ todoId, noteId, todoTitle: todo?.title ?? 'Note' })
    },
    [todos, completedTodos, deletedTodos]
  )

  const handleUnlinkNote = React.useCallback(async () => {
    if (!openNote) return
    await todosApi.update(openNote.todoId, { notebookNoteId: null })
    setOpenNote(null)
  }, [openNote])

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="space-y-2 w-full max-w-md">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-lg animate-pulse"
              style={{ backgroundColor: 'var(--surface-2)' }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Mobile/Narrow View (< 1280px) */}
      <div className="flex flex-col h-full xl:hidden">
        {/* Category tab switcher */}
        <div
          className="mb-3 rounded-xl border p-1.5"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'color-mix(in srgb, var(--surface) 72%, transparent)',
          }}
        >
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Task categories">
            <button
              type="button"
              onClick={toggleCompact}
              className="flex-shrink-0 flex items-center justify-center rounded-lg px-2 py-2 transition-all"
              style={{
                backgroundColor: compact ? 'color-mix(in srgb, var(--primary) 16%, var(--surface-2) 84%)' : 'transparent',
                color: compact ? 'var(--primary)' : 'var(--text-muted)',
                border: compact ? '1px solid color-mix(in srgb, var(--primary) 45%, var(--border-color))' : '1px solid transparent',
              }}
              title={compact ? 'Switch to comfortable view' : 'Switch to compact view'}
              aria-label={compact ? 'Switch to comfortable view' : 'Switch to compact view'}
            >
              <Rows3 className="h-3.5 w-3.5" />
            </button>
            {COLUMNS.map((col) => {
              const count = categorizedActive[col.key].length
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
                  onKeyDown={(event) => handleMobileCategoryKeyDown(event, col.key)}
                  className="flex min-w-[112px] flex-1 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all active:scale-[0.99]"
                  style={{
                    border: `1px solid ${isActive
                      ? `color-mix(in srgb, ${col.color} 45%, var(--border-color))`
                      : 'transparent'}`,
                    backgroundColor: isActive
                      ? `color-mix(in srgb, ${col.color} 16%, var(--surface-2) 84%)`
                      : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: col.color,
                        boxShadow: isActive
                          ? `0 0 0 3px color-mix(in srgb, ${col.color} 22%, transparent)`
                          : 'none',
                      }}
                    />
                    <span className="leading-none">{col.title}</span>
                  </span>

                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums"
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

        <div
          className="flex-1 min-h-0"
          role="tabpanel"
          id={`todos-category-panel-${mobileCategory}`}
          aria-labelledby={`todos-category-tab-${mobileCategory}`}
        >
          <TodoColumn
            title={COLUMNS.find(c => c.key === mobileCategory)!.title}
            color={COLUMNS.find(c => c.key === mobileCategory)!.color}
            category={mobileCategory}
            activeTodos={categorizedActive[mobileCategory]}
            completedTodos={categorizedCompleted[mobileCategory]}
            deletedTodos={categorizedDeleted[mobileCategory]}
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
            defaultLabelIds={defaultLabelIdsMap[mobileCategory]}
            showInlineForm={false}
            animateListTransitions={false}
            compact={compact}
          />
        </div>

      </div>

      {/* Desktop View (>= 1280px) */}
      <div className="hidden xl:flex xl:flex-col flex-1 min-h-0 gap-4">
        <div className="flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={toggleCompact}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all"
            style={{
              backgroundColor: compact ? 'color-mix(in srgb, var(--primary) 16%, var(--surface-2) 84%)' : 'var(--surface-2)',
              color: compact ? 'var(--primary)' : 'var(--text-muted)',
              border: compact ? '1px solid color-mix(in srgb, var(--primary) 30%, transparent)' : '1px solid var(--border-color)',
            }}
            title={compact ? 'Switch to comfortable view' : 'Switch to compact view'}
            aria-label={compact ? 'Switch to comfortable view' : 'Switch to compact view'}
          >
            <Rows3 className="h-3.5 w-3.5" />
            <span>{compact ? 'Compact' : 'Comfortable'}</span>
          </button>
        </div>
        <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
          {COLUMNS.map((col) => (
            <TodoColumn
              key={col.key}
              title={col.title}
              color={col.color}
              category={col.key}
              activeTodos={categorizedActive[col.key]}
              completedTodos={categorizedCompleted[col.key]}
              deletedTodos={categorizedDeleted[col.key]}
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
              showInlineForm={false}
              compact={compact}
            />
          ))}
        </div>
      </div>

      {/* Edit Dialog */}
      <EditTodoDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={handleUpdate}
        todo={editingTodo}
        isLoading={isSaving}
      />

      {/* Create Modal */}
      <CreateTodoModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreate}
        isLoading={isSaving}
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
        className="group fixed bottom-6 right-6 z-50 flex items-center rounded-full active:scale-95 transition-transform"
        style={{
          backgroundColor: 'var(--surface-2)',
          boxShadow: '0 4px 20px color-mix(in srgb, var(--background) 70%, transparent)',
        }}
        aria-label="Add task"
      >
        <span
          className="w-12 h-12 flex items-center justify-center rounded-full flex-shrink-0"
          style={{
            backgroundColor: 'var(--primary)',
            border: '3px solid var(--surface-2)',
          }}
        >
          <Plus className="h-5 w-5 group-hover:animate-[spin_0.5s_ease-in-out]" strokeWidth={2.5} style={{ color: 'var(--primary-foreground)' }} />
        </span>
        <span
          className="text-xs font-semibold tracking-wide pr-4 pl-2 hidden sm:inline"
          style={{ color: 'var(--text-primary)' }}
        >
          Add Task
        </span>
      </button>
    </div>
  )
}
