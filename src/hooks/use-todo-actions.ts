'use client'

import * as React from 'react'
import { useToast } from '@/components/ui/use-toast'
import { useTodos } from '@/hooks/use-todos'
import type {
  CreateTodoInput,
  Priority,
  Status,
  SubtaskInput,
  Todo,
  UpdateTodoInput,
} from '@/types/todo'

/**
 * Every todo surface (the general list, a project board) needs the same set of
 * card callbacks plus the edit-dialog wiring. This keeps the pages as thin
 * composition layers instead of each re-deriving the same handlers.
 */
export function useTodoActions({ withCompleted = false } = {}) {
  const {
    todos,
    completedTodos,
    completedCounts,
    isLoadingCompleted,
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
  } = useTodos({ withCompleted })
  const { toast } = useToast()

  const [editingTodo, setEditingTodo] = React.useState<Todo | null>(null)
  const [isEditOpen, setIsEditOpen] = React.useState(false)

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
          setIsEditOpen(false)
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
    setIsEditOpen(true)
  }, [])

  const handleEditOpenChange = React.useCallback((open: boolean) => {
    setIsEditOpen(open)
    if (!open) setEditingTodo(null)
  }, [])

  const handleStatusChange = React.useCallback(
    (id: string, status: Status) => updateStatus.mutate({ id, status }),
    [updateStatus],
  )

  const handlePriorityChange = React.useCallback(
    (id: string, priority: Priority) => updatePriority.mutate({ id, priority }),
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

  return {
    todos,
    completedTodos,
    completedCounts,
    isLoadingCompleted,
    deletedTodos,
    isLoading,
    isSaving,
    editingTodo,
    isEditOpen,
    handleCreate,
    handleUpdate,
    handleEdit,
    handleEditOpenChange,
    handleStatusChange,
    handlePriorityChange,
    handleDelete,
    handlePermanentDelete,
    handleRestore,
    handleToggleSubtask,
    handleUpdateSubtasks,
    handleReorder,
  }
}
