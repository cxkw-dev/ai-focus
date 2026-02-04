'use client'

import * as React from 'react'
import { FileText, List, Plus, Undo2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TodoList } from '@/components/todos/todo-list'
import { TodoForm, InlineTodoForm, CreateTodoModal } from '@/components/todos/todo-form'
import { ScratchPad } from '@/components/todos/scratch-pad'
import { useToast } from '@/components/ui/use-toast'
import type { Todo, Category, Label, CreateTodoInput, UpdateTodoInput, Status, Priority } from '@/types/todo'

export default function TodosPage() {
  const [todos, setTodos] = React.useState<Todo[]>([])
  const [archivedTodos, setArchivedTodos] = React.useState<Todo[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [labels, setLabels] = React.useState<Label[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingTodo, setEditingTodo] = React.useState<Todo | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  // Responsive state
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [mobileView, setMobileView] = React.useState<'notes' | 'tasks'>('notes')
  const { toast, dismiss } = useToast()

  React.useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [todosRes, archivedRes, categoriesRes, labelsRes] = await Promise.all([
        fetch('/api/todos'),
        fetch('/api/todos?archived=true'),
        fetch('/api/categories'),
        fetch('/api/labels'),
      ])

      if (todosRes.ok) {
        setTodos(await todosRes.json())
      }
      if (archivedRes.ok) {
        setArchivedTodos(await archivedRes.json())
      }
      if (categoriesRes.ok) {
        setCategories(await categoriesRes.json())
      }
      if (labelsRes.ok) {
        setLabels(await labelsRes.json())
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateLabel = async (data: Pick<Label, 'name' | 'color'>) => {
    try {
      const res = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        const newLabel = await res.json()
        setLabels((prev) => [...prev, newLabel].sort((a, b) => a.name.localeCompare(b.name)))
        toast({
          title: 'Label created',
          description: newLabel.name,
        })
        return true
      }
      throw new Error('Failed to create label')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create label. Please try again.',
        variant: 'destructive',
      })
      return false
    }
  }

  const handleUpdateLabel = async (id: string, data: Partial<Pick<Label, 'name' | 'color'>>) => {
    try {
      const res = await fetch(`/api/labels/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        const updatedLabel = await res.json()
        setLabels((prev) =>
          prev
            .map((label) => (label.id === updatedLabel.id ? updatedLabel : label))
            .sort((a, b) => a.name.localeCompare(b.name))
        )
        setTodos((prev) =>
          prev.map((todo) => ({
            ...todo,
            labels: todo.labels.map((label) =>
              label.id === updatedLabel.id ? updatedLabel : label
            ),
          }))
        )
        setArchivedTodos((prev) =>
          prev.map((todo) => ({
            ...todo,
            labels: todo.labels.map((label) =>
              label.id === updatedLabel.id ? updatedLabel : label
            ),
          }))
        )
        toast({
          title: 'Label updated',
          description: updatedLabel.name,
        })
        return true
      }
      throw new Error('Failed to update label')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update label. Please try again.',
        variant: 'destructive',
      })
      return false
    }
  }

  const handleDeleteLabel = async (id: string) => {
    try {
      const res = await fetch(`/api/labels/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setLabels((prev) => prev.filter((label) => label.id !== id))
        setTodos((prev) =>
          prev.map((todo) => ({
            ...todo,
            labels: todo.labels.filter((label) => label.id !== id),
          }))
        )
        setArchivedTodos((prev) =>
          prev.map((todo) => ({
            ...todo,
            labels: todo.labels.filter((label) => label.id !== id),
          }))
        )
        toast({
          title: 'Label deleted',
        })
        return true
      }
      throw new Error('Failed to delete label')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete label. Please try again.',
        variant: 'destructive',
      })
      return false
    }
  }

  const handleCreate = async (
    data: CreateTodoInput,
    _options?: { silent?: boolean; close?: boolean }
  ) => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        const newTodo = await res.json()
        setTodos((prev) => [newTodo, ...prev])
        toast({
          title: 'Added',
          description: newTodo.title,
        })
        return true
      } else {
        throw new Error('Failed to create todo')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create todo. Please try again.',
        variant: 'destructive',
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async (
    data: UpdateTodoInput,
    options?: { silent?: boolean; close?: boolean }
  ) => {
    if (!editingTodo) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/todos/${editingTodo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        const updatedTodo = await res.json()
        setTodos((prev) =>
          prev.map((t) => (t.id === updatedTodo.id ? updatedTodo : t))
        )
        if (options?.close !== false) {
          setEditingTodo(null)
          setIsFormOpen(false)
        }
        if (!options?.silent) {
          toast({
            title: 'Updated',
            description: 'Changes saved.',
          })
        }
      } else {
        throw new Error('Failed to update todo')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update todo. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = async (id: string, status: Status) => {
    // Find original status for rollback
    const originalTodo = todos.find((t) => t.id === id)
    const originalStatus = originalTodo?.status

    // Optimistic update
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    )

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) {
        // Revert on failure
        setTodos((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: originalStatus! } : t))
        )
        throw new Error('Failed to update todo status')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update todo. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handlePriorityChange = async (id: string, priority: Priority) => {
    // Find original priority for rollback
    const originalTodo = todos.find((t) => t.id === id)
    const originalPriority = originalTodo?.priority

    // Optimistic update
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, priority } : t))
    )

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      })

      if (!res.ok) {
        // Revert on failure
        setTodos((prev) =>
          prev.map((t) => (t.id === id ? { ...t, priority: originalPriority! } : t))
        )
        throw new Error('Failed to update todo priority')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update todo. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    // Find the todo to archive
    const todoToArchive = todos.find((t) => t.id === id)
    if (!todoToArchive) return

    // Optimistic update - move to archived
    setTodos((prev) => prev.filter((t) => t.id !== id))
    const archivedTodo = { ...todoToArchive, archived: true }
    setArchivedTodos((prev) => [archivedTodo, ...prev])

    // Show undo toast
    const { id: toastId } = toast({
      title: 'Deleted',
      description: todoToArchive.title,
      action: (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleRestore(id, archivedTodo)
            dismiss(toastId)
          }}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground ring-offset-background transition-all hover:bg-primary/90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Undo2 className="h-4 w-4 mr-1.5" strokeWidth={2} />
          Undo
        </button>
      ),
      duration: 5000,
    })

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      })

      if (!res.ok) {
        // Revert on failure
        setArchivedTodos((prev) => prev.filter((t) => t.id !== id))
        setTodos((prev) => [...prev, todoToArchive])
        throw new Error('Failed to archive todo')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete todo. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handlePermanentDelete = async (id: string) => {
    // Find the todo to delete
    const todoToDelete = archivedTodos.find((t) => t.id === id)
    if (!todoToDelete) return

    // Optimistic update - remove from archived
    setArchivedTodos((prev) => prev.filter((t) => t.id !== id))

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        // Revert on failure
        setArchivedTodos((prev) => [...prev, todoToDelete])
        throw new Error('Failed to delete todo')
      }

      toast({
        title: 'Permanently deleted',
        description: todoToDelete.title,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete todo. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleRestore = async (id: string, todoFromToast?: Todo) => {
    const todoToRestore =
      todoFromToast ?? archivedTodos.find((t) => t.id === id)
    if (!todoToRestore) return

    // Optimistic update - move back to active
    setArchivedTodos((prev) => prev.filter((t) => t.id !== id))
    const restoredTodo = { ...todoToRestore, archived: false }
    setTodos((prev) => [restoredTodo, ...prev])

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: false }),
      })

      if (!res.ok) {
        // Revert on failure
        setTodos((prev) => prev.filter((t) => t.id !== id))
        setArchivedTodos((prev) => [...prev, todoToRestore])
        throw new Error('Failed to restore todo')
      }

      toast({
        title: 'Restored',
        description: todoToRestore.title,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to restore todo. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo)
    setIsFormOpen(true)
  }

  const handleReorder = async (reorderedTodos: Todo[]) => {
    // Optimistic update
    const previousTodos = todos
    setTodos(reorderedTodos)

    try {
      const res = await fetch('/api/todos/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderedIds: reorderedTodos.map((t) => t.id),
        }),
      })

      if (!res.ok) {
        // Revert on failure
        setTodos(previousTodos)
        throw new Error('Failed to reorder todos')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reorder todos. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open)
    if (!open) {
      setEditingTodo(null)
    }
  }

  // Todo List Section render helper (not a component — avoids remounting on parent re-render)
  const renderTodoListSection = (className = '') => (
    <div className={`flex flex-col min-h-0 ${className}`}>
      <TodoList
        todos={todos}
        archivedTodos={archivedTodos}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onDelete={handleDelete}
        onPermanentDelete={handlePermanentDelete}
        onEdit={handleEdit}
        onReorder={handleReorder}
        onRestore={handleRestore}
        isLoading={isLoading}
      />
    </div>
  )

  return (
    <DashboardLayout title="Todos">
      <div className="h-[calc(100vh-120px)] flex flex-col">
        {/* Mobile/Narrow View: Tab-based layout (< 1024px) */}
        <div className="flex flex-col h-full xl:hidden">
          {/* Mobile Tab Switcher */}
          <div className="flex items-center gap-1 mb-3 p-1 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
            <button
              type="button"
              onClick={() => setMobileView('notes')}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all"
              style={{
                backgroundColor: mobileView === 'notes' ? 'var(--primary)' : 'transparent',
                color: mobileView === 'notes' ? 'var(--primary-foreground)' : 'var(--text-muted)',
              }}
            >
              <FileText className="h-3.5 w-3.5" />
              Notes
            </button>
            <button
              type="button"
              onClick={() => setMobileView('tasks')}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all relative"
              style={{
                backgroundColor: mobileView === 'tasks' ? 'var(--primary)' : 'transparent',
                color: mobileView === 'tasks' ? 'var(--primary-foreground)' : 'var(--text-muted)',
              }}
            >
              <List className="h-3.5 w-3.5" />
              Tasks
              {todos.length > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--background)' }}
                >
                  {todos.length}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Content */}
          <div className="flex-1 min-h-0">
            {mobileView === 'notes'
              ? <ScratchPad className="h-full" />
              : renderTodoListSection("h-full")
            }
          </div>

          {/* Floating Action Button for Mobile */}
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

        {/* Desktop View: Two Column Layout (>= 1280px) */}
        <div className="hidden xl:grid xl:grid-cols-[480px_1fr] gap-8 flex-1 min-h-0">
          {/* Left Column - Create Form & Todo List */}
          <div className="flex flex-col min-h-0 gap-6">
            <InlineTodoForm
              onSubmit={handleCreate}
              categories={categories}
              labels={labels}
              onCreateLabel={handleCreateLabel}
              onUpdateLabel={handleUpdateLabel}
              onDeleteLabel={handleDeleteLabel}
              isLoading={isSaving}
            />
            {renderTodoListSection("flex-1")}
          </div>

          {/* Right Column - Scratch Pad */}
          <ScratchPad className="xl:-mr-4" />
        </div>

        {/* Edit Dialog */}
        <TodoForm
          open={isFormOpen}
          onOpenChange={handleFormClose}
          onSubmit={handleUpdate}
          todo={editingTodo}
          categories={categories}
          labels={labels}
          onCreateLabel={handleCreateLabel}
          onUpdateLabel={handleUpdateLabel}
          onDeleteLabel={handleDeleteLabel}
          isLoading={isSaving}
        />

        {/* Create Task Modal (for mobile/narrow screens) */}
        <CreateTodoModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSubmit={handleCreate}
          categories={categories}
          labels={labels}
          onCreateLabel={handleCreateLabel}
          onUpdateLabel={handleUpdateLabel}
          onDeleteLabel={handleDeleteLabel}
          isLoading={isSaving}
        />
      </div>
    </DashboardLayout>
  )
}
