'use client'

import * as React from 'react'
import { Undo2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { TodoList } from '@/components/todos/todo-list'
import { TodoForm, InlineTodoForm } from '@/components/todos/todo-form'
import { useToast } from '@/components/ui/use-toast'
import type { Todo, Category, CreateTodoInput, UpdateTodoInput } from '@/types/todo'
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

  const handleToggle = async (id: string, completed: boolean) => {
    // Optimistic update
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed } : t))
    )

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      })

      if (!res.ok) {
        // Revert on failure
        setTodos((prev) =>
          prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t))
        )
        throw new Error('Failed to toggle todo')
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
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">New Task</h2>
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
              onToggle={handleToggle}
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
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Scratch Pad</h2>
              <span className="text-[10px] text-muted-foreground">
                {noteStatus === 'saving' ? 'Saving...' : noteStatus === 'error' ? 'Error' : 'Auto-saves'}
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <textarea
                className="w-full h-full resize-none rounded-xl border bg-card px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shadow-sm"
                placeholder="Jot down quick notes..."
                value={note?.content ?? ''}
                onChange={(e) => handleNoteChange(e.target.value)}
                disabled={isNoteLoading}
              />
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
