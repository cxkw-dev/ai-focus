'use client'

import * as React from 'react'
import { FileText, List, Plus } from 'lucide-react'
import { TodoList } from '@/components/todos/todo-list'
import { EditTodoDialog } from '@/components/todos/edit-todo-dialog'
import { InlineTodoForm } from '@/components/todos/inline-todo-form'
import { CreateTodoModal } from '@/components/todos/create-todo-modal'
import { ScratchPad } from '@/components/todos/scratch-pad'
import { useToast } from '@/components/ui/use-toast'
import { useTodos } from '@/hooks/use-todos'
import type { Todo, UpdateTodoInput } from '@/types/todo'

export default function TodosPage() {
  const { todos, create, update, isSaving } = useTodos()
  const { toast } = useToast()

  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingTodo, setEditingTodo] = React.useState<Todo | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [mobileView, setMobileView] = React.useState<'notes' | 'tasks'>('notes')

  const handleCreate = React.useCallback(async (data: Parameters<typeof create.mutateAsync>[0]) => {
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

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Mobile/Narrow View (< 1280px) */}
      <div className="flex flex-col h-full xl:hidden">
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

        <div className="flex-1 min-h-0">
          {mobileView === 'notes'
            ? <ScratchPad className="h-full" />
            : (
              <div className="flex flex-col min-h-0 h-full">
                <TodoList onEdit={handleEdit} />
              </div>
            )
          }
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
      <div className="hidden xl:grid xl:grid-cols-[480px_1fr] gap-8 flex-1 min-h-0">
        <div className="flex flex-col min-h-0 gap-6">
          <InlineTodoForm
            onSubmit={handleCreate}
            isLoading={isSaving}
          />
          <div className="flex flex-col min-h-0 flex-1">
            <TodoList onEdit={handleEdit} />
          </div>
        </div>

        <ScratchPad className="xl:-mr-4" />
      </div>

      {/* Edit Dialog */}
      <EditTodoDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        onSubmit={handleUpdate}
        todo={editingTodo}
        isLoading={isSaving}
      />

      {/* Create Modal (mobile) */}
      <CreateTodoModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreate}
        isLoading={isSaving}
      />
    </div>
  )
}
