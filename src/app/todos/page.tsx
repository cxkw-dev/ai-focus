'use client'

import * as React from 'react'
import { Undo2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TodoList } from '@/components/todos/todo-list'
import { TodoForm, InlineTodoForm } from '@/components/todos/todo-form'
import { useToast } from '@/components/ui/use-toast'
import type { Todo, Category, CreateTodoInput, UpdateTodoInput, Status, Priority } from '@/types/todo'
import type { Note } from '@/types/note'

export default function TodosPage() {
  const [todos, setTodos] = React.useState<Todo[]>([])
  const [archivedTodos, setArchivedTodos] = React.useState<Todo[]>([])
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingTodo, setEditingTodo] = React.useState<Todo | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [note, setNote] = React.useState<Note | null>(null)
  const [isNoteLoading, setIsNoteLoading] = React.useState(true)
  const [noteStatus, setNoteStatus] = React.useState<'idle' | 'saving' | 'error'>('idle')
  const { toast, dismiss } = useToast()
  const latestNoteContentRef = React.useRef<string>('')
  const noteSavingRef = React.useRef(false)

  React.useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    setIsNoteLoading(true)
    try {
      const [todosRes, archivedRes, categoriesRes, noteRes] = await Promise.all([
        fetch('/api/todos'),
        fetch('/api/todos?archived=true'),
        fetch('/api/categories'),
        fetch('/api/note'),
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
      if (noteRes.ok) {
        const noteData: Note = await noteRes.json()
        setNote(noteData)
        latestNoteContentRef.current = noteData.content
      } else {
        setNote({ id: 'default', content: '', updatedAt: null })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setIsNoteLoading(false)
    }
  }

  const handleCreate = async (data: CreateTodoInput) => {
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

  const handleUpdate = async (data: UpdateTodoInput) => {
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
        setEditingTodo(null)
        setIsFormOpen(false)
        toast({
          title: 'Updated',
          description: 'Changes saved.',
        })
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

  const persistNote = async (content: string) => {
    latestNoteContentRef.current = content
    if (noteSavingRef.current) return

    noteSavingRef.current = true
    while (true) {
      const currentContent = latestNoteContentRef.current
      setNoteStatus('saving')
      try {
        const res = await fetch('/api/note', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: currentContent }),
        })
        if (!res.ok) {
          throw new Error('Failed to save note')
        }
        const saved: Note = await res.json()
        setNote(saved)
        setNoteStatus('idle')
      } catch (error) {
        setNoteStatus('error')
        toast({
          title: 'Error',
          description: 'Failed to save note. Changes may be unsaved.',
          variant: 'destructive',
        })
      }

      if (latestNoteContentRef.current === currentContent) {
        noteSavingRef.current = false
        break
      }
    }
  }

  const handleNoteChange = (value: string) => {
    setNote((prev) =>
      prev
        ? { ...prev, content: value }
        : { id: 'default', content: value, updatedAt: null }
    )
    void persistNote(value)
  }

  return (
    <DashboardLayout title="Todos">
      <div className="h-[calc(100vh-120px)] flex flex-col">
        {/* Three Column Layout - scratch pad takes majority */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[240px_320px_1fr] gap-4 min-h-0">
          {/* Left Column - Create Form */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-1 h-4 rounded-full"
                style={{ backgroundColor: 'var(--accent)' }}
              />
              <h2 className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--accent)' }}>New Task</h2>
            </div>
            <InlineTodoForm
              onSubmit={handleCreate}
              categories={categories}
              isLoading={isSaving}
            />
          </div>

          {/* Center Column - Todo List (narrow) */}
          <div className="flex flex-col min-h-0">
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

          {/* Scratch Pad - takes remaining space, fixed to viewport */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-1 h-4 rounded-full"
                  style={{ backgroundColor: 'var(--status-waiting)' }}
                />
                <h2 className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--status-waiting)' }}>Scratch Pad</h2>
              </div>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {noteStatus === 'saving' ? 'Saving...' : noteStatus === 'error' ? 'Error' : 'Auto-saves'}
              </span>
            </div>
            <div className="group/pad flex-1 min-h-0 relative">
              {/* Glow effect on focus */}
              <div
                className="absolute -inset-px rounded-lg opacity-0 blur-sm transition-opacity duration-300 group-focus-within/pad:opacity-100"
                style={{
                  background: `linear-gradient(135deg, color-mix(in srgb, var(--primary) 40%, transparent), color-mix(in srgb, var(--accent) 30%, transparent))`,
                }}
              />

              {/* Main container with dot pattern */}
              <div
                className="relative h-full rounded-lg overflow-hidden transition-all duration-300"
                style={{
                  backgroundColor: 'var(--surface)',
                }}
              >
                {/* Dot grid pattern overlay */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.03]"
                  style={{
                    backgroundImage: `radial-gradient(circle, var(--text-primary) 1px, transparent 1px)`,
                    backgroundSize: '16px 16px',
                    backgroundPosition: '8px 8px',
                  }}
                />

                {/* Subtle gradient fade at edges */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(180deg, transparent 0%, transparent 85%, var(--surface) 100%)`,
                  }}
                />

                <textarea
                  className="relative w-full h-full resize-none bg-transparent px-4 py-3 text-xs outline-none leading-relaxed"
                  style={{
                    color: 'var(--text-primary)',
                    caretColor: 'var(--primary)',
                  }}
                  placeholder="Jot down quick notes..."
                  value={note?.content ?? ''}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  disabled={isNoteLoading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Edit Dialog */}
        <TodoForm
          open={isFormOpen}
          onOpenChange={handleFormClose}
          onSubmit={handleUpdate}
          todo={editingTodo}
          categories={categories}
          isLoading={isSaving}
        />
      </div>
    </DashboardLayout>
  )
}
