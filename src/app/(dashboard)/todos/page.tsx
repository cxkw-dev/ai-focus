'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { TodoColumn } from '@/components/todos/todo-column'
import { EditTodoDialog } from '@/components/todos/edit-todo-dialog'
import { CreateTodoModal } from '@/components/todos/create-todo-modal'
import { useToast } from '@/components/ui/use-toast'
import { useTodos } from '@/hooks/use-todos'
import { useLabels } from '@/hooks/use-labels'
import { categorizeTodos, type TodoCategory } from '@/lib/categorize-todos'
import type { Todo, UpdateTodoInput, CreateTodoInput } from '@/types/todo'

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

  const handleReorder = React.useCallback(
    (reorderedTodos: Todo[]) => reorder.mutate(reorderedTodos),
    [reorder]
  )

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
        <div className="flex items-center gap-1 mb-3 p-1 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
          {COLUMNS.map((col) => {
            const count = categorizedActive[col.key].length
            return (
              <button
                key={col.key}
                type="button"
                onClick={() => setMobileCategory(col.key)}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all relative"
                style={{
                  backgroundColor: mobileCategory === col.key ? 'var(--primary)' : 'transparent',
                  color: mobileCategory === col.key ? 'var(--primary-foreground)' : 'var(--text-muted)',
                }}
              >
                {col.title}
                {count > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: col.color, color: 'var(--background)' }}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex-1 min-h-0">
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
            onReorder={handleReorder}
            onCreateTodo={handleCreate}
            isSaving={isSaving}
            defaultLabelIds={defaultLabelIdsMap[mobileCategory]}
            showInlineForm={false}
          />
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-50"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            boxShadow: '0 4px 20px color-mix(in srgb, var(--primary) 40%, transparent)',
          }}
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </div>

      {/* Desktop View (>= 1280px) */}
      <div className="hidden xl:flex xl:flex-col flex-1 min-h-0 gap-4">
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
            }}
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add Task
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
              onReorder={handleReorder}
              onCreateTodo={handleCreate}
              isSaving={isSaving}
              showInlineForm={false}
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
    </div>
  )
}
