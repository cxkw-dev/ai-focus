'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Undo2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { todosApi } from '@/lib/api'
import type { Todo, UpdateTodoInput, Status, Priority } from '@/types/todo'

export function useTodos() {
  const queryClient = useQueryClient()
  const { toast, dismiss } = useToast()

  // Active todos (not archived, not completed)
  const todosQuery = useQuery({
    queryKey: ['todos'],
    queryFn: () => todosApi.list({ excludeStatus: 'COMPLETED' }),
  })

  // Completed todos (archived when completed, so include archived)
  const completedQuery = useQuery({
    queryKey: ['todos', 'completed'],
    queryFn: () => todosApi.list({ status: 'COMPLETED', archived: true }),
  })

  // Deleted todos (archived but not completed)
  const deletedQuery = useQuery({
    queryKey: ['todos', 'deleted'],
    queryFn: () => todosApi.list({ archived: true, excludeStatus: 'COMPLETED' }),
  })

  const create = useMutation({
    mutationFn: todosApi.create,
    onSuccess: (newTodo) => {
      queryClient.setQueryData<Todo[]>(['todos'], (prev = []) => [newTodo, ...prev])
      toast({ title: 'Added', description: newTodo.title })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create todo.', variant: 'destructive' })
    },
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTodoInput }) =>
      todosApi.update(id, data),
    onSuccess: (updatedTodo) => {
      if (updatedTodo.status === 'COMPLETED') {
        // Completed via edit dialog — remove from active, add to completed
        queryClient.setQueryData<Todo[]>(['todos'], (prev = []) =>
          prev.filter(t => t.id !== updatedTodo.id)
        )
        queryClient.setQueryData<Todo[]>(['todos', 'completed'], (prev = []) =>
          [updatedTodo, ...prev.filter(t => t.id !== updatedTodo.id)]
        )
      } else if (updatedTodo.archived) {
        // Manually archived via edit — move to deleted
        queryClient.setQueryData<Todo[]>(['todos'], (prev = []) =>
          prev.filter(t => t.id !== updatedTodo.id)
        )
        queryClient.setQueryData<Todo[]>(['todos', 'deleted'], (prev = []) =>
          [updatedTodo, ...prev.filter(t => t.id !== updatedTodo.id)]
        )
      } else {
        // Status changed from completed back to active — add to active, remove from completed
        queryClient.setQueryData<Todo[]>(['todos'], (prev = []) => {
          const exists = prev.some(t => t.id === updatedTodo.id)
          if (exists) return prev.map(t => (t.id === updatedTodo.id ? updatedTodo : t))
          return [updatedTodo, ...prev]
        })
        queryClient.setQueryData<Todo[]>(['todos', 'completed'], (prev = []) =>
          prev.filter(t => t.id !== updatedTodo.id)
        )
      }
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update todo.', variant: 'destructive' })
    },
  })

  const undoComplete = useMutation({
    mutationFn: ({ id, previousStatus }: { id: string; previousStatus: Status }) =>
      todosApi.update(id, { status: previousStatus }),
    onSuccess: (restoredTodo) => {
      queryClient.setQueryData<Todo[]>(['todos'], (prev = []) =>
        [restoredTodo, ...prev.filter(t => t.id !== restoredTodo.id)]
      )
      queryClient.setQueryData<Todo[]>(['todos', 'completed'], (prev = []) =>
        prev.filter(t => t.id !== restoredTodo.id)
      )
      toast({ title: 'Restored' })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to undo completion.', variant: 'destructive' })
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) =>
      todosApi.update(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })

      const previousTodos = queryClient.getQueryData<Todo[]>(['todos'])
      const todo = previousTodos?.find(t => t.id === id)
      const previousStatus = todo?.status

      if (status === 'COMPLETED' && todo) {
        queryClient.setQueryData<Todo[]>(['todos'], (prev = []) =>
          prev.filter(t => t.id !== id)
        )
      } else {
        queryClient.setQueryData<Todo[]>(['todos'], (prev = []) =>
          prev.map(t => (t.id === id ? { ...t, status } : t))
        )
      }

      return { previousTodos, previousStatus }
    },
    onSuccess: (data, { id, status }, context) => {
      if (status === 'COMPLETED') {
        queryClient.setQueryData<Todo[]>(['todos', 'completed'], (prev = []) =>
          [data, ...prev.filter(t => t.id !== id)]
        )
      }
      if (status === 'COMPLETED' && context?.previousStatus) {
        toast({
          title: 'Completed',
          description: context.previousTodos?.find(t => t.id === id)?.title,
          action: (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                undoComplete.mutate({ id, previousStatus: context.previousStatus! })
                dismiss()
              }}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground ring-offset-background transition-all hover:bg-primary/90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <Undo2 className="h-4 w-4 mr-1.5" strokeWidth={2} />
              Undo
            </button>
          ),
          duration: 5000,
        })
      }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTodos) queryClient.setQueryData(['todos'], context.previousTodos)
      toast({ title: 'Error', description: 'Failed to update todo.', variant: 'destructive' })
    },
  })

  const updatePriority = useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: Priority }) =>
      todosApi.update(id, { priority }),
    onMutate: async ({ id, priority }) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const previous = queryClient.getQueryData<Todo[]>(['todos'])
      queryClient.setQueryData<Todo[]>(['todos'], (prev = []) =>
        prev.map(t => (t.id === id ? { ...t, priority } : t))
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['todos'], context.previous)
      toast({ title: 'Error', description: 'Failed to update todo.', variant: 'destructive' })
    },
  })

  const archive = useMutation({
    mutationFn: (id: string) => todosApi.update(id, { archived: true }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      await queryClient.cancelQueries({ queryKey: ['todos', 'deleted'] })

      const previousTodos = queryClient.getQueryData<Todo[]>(['todos'])
      const previousDeleted = queryClient.getQueryData<Todo[]>(['todos', 'deleted'])
      const todoToArchive = previousTodos?.find(t => t.id === id)

      if (todoToArchive) {
        queryClient.setQueryData<Todo[]>(['todos'], (prev = []) =>
          prev.filter(t => t.id !== id)
        )
        const archivedTodo = { ...todoToArchive, archived: true }
        queryClient.setQueryData<Todo[]>(['todos', 'deleted'], (prev = []) =>
          [archivedTodo, ...prev]
        )

        toast({
          title: 'Deleted',
          description: todoToArchive.title,
          action: (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                restore.mutate(id)
                dismiss()
              }}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground ring-offset-background transition-all hover:bg-primary/90 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <Undo2 className="h-4 w-4 mr-1.5" strokeWidth={2} />
              Undo
            </button>
          ),
          duration: 5000,
        })
      }

      return { previousTodos, previousDeleted }
    },
    onError: (_err, _id, context) => {
      if (context?.previousTodos) queryClient.setQueryData(['todos'], context.previousTodos)
      if (context?.previousDeleted) queryClient.setQueryData(['todos', 'deleted'], context.previousDeleted)
      toast({ title: 'Error', description: 'Failed to delete todo.', variant: 'destructive' })
    },
  })

  const restore = useMutation({
    mutationFn: (id: string) => todosApi.update(id, { archived: false }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      await queryClient.cancelQueries({ queryKey: ['todos', 'deleted'] })

      const previousTodos = queryClient.getQueryData<Todo[]>(['todos'])
      const previousDeleted = queryClient.getQueryData<Todo[]>(['todos', 'deleted'])
      const todoToRestore = previousDeleted?.find(t => t.id === id)

      if (todoToRestore) {
        queryClient.setQueryData<Todo[]>(['todos', 'deleted'], (prev = []) =>
          prev.filter(t => t.id !== id)
        )
        const restoredTodo = { ...todoToRestore, archived: false }
        queryClient.setQueryData<Todo[]>(['todos'], (prev = []) =>
          [restoredTodo, ...prev]
        )
      }

      return { previousTodos, previousDeleted }
    },
    onSuccess: () => {
      toast({ title: 'Restored' })
    },
    onError: (_err, _id, context) => {
      if (context?.previousTodos) queryClient.setQueryData(['todos'], context.previousTodos)
      if (context?.previousDeleted) queryClient.setQueryData(['todos', 'deleted'], context.previousDeleted)
      toast({ title: 'Error', description: 'Failed to restore todo.', variant: 'destructive' })
    },
  })

  const permanentDelete = useMutation({
    mutationFn: (id: string) => todosApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['todos', 'deleted'] })
      await queryClient.cancelQueries({ queryKey: ['todos', 'completed'] })
      const previousDeleted = queryClient.getQueryData<Todo[]>(['todos', 'deleted'])
      const previousCompleted = queryClient.getQueryData<Todo[]>(['todos', 'completed'])
      queryClient.setQueryData<Todo[]>(['todos', 'deleted'], (prev = []) =>
        prev.filter(t => t.id !== id)
      )
      queryClient.setQueryData<Todo[]>(['todos', 'completed'], (prev = []) =>
        prev.filter(t => t.id !== id)
      )
      return { previousDeleted, previousCompleted }
    },
    onSuccess: () => {
      toast({ title: 'Permanently deleted' })
    },
    onError: (_err, _id, context) => {
      if (context?.previousDeleted) queryClient.setQueryData(['todos', 'deleted'], context.previousDeleted)
      if (context?.previousCompleted) queryClient.setQueryData(['todos', 'completed'], context.previousCompleted)
      toast({ title: 'Error', description: 'Failed to delete todo.', variant: 'destructive' })
    },
  })

  const toggleSubtask = useMutation({
    mutationFn: ({ todoId, subtaskId, completed }: { todoId: string; subtaskId: string; completed: boolean }) =>
      todosApi.toggleSubtask(todoId, subtaskId, completed),
    onMutate: async ({ todoId, subtaskId, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const previous = queryClient.getQueryData<Todo[]>(['todos'])
      queryClient.setQueryData<Todo[]>(['todos'], (prev = []) =>
        prev.map(t =>
          t.id === todoId
            ? { ...t, subtasks: t.subtasks.map(s => (s.id === subtaskId ? { ...s, completed } : s)) }
            : t
        )
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['todos'], context.previous)
      toast({ title: 'Error', description: 'Failed to toggle subtask.', variant: 'destructive' })
    },
  })

  const reorder = useMutation({
    mutationFn: (reorderedTodos: Todo[]) =>
      todosApi.reorder(reorderedTodos.map(t => t.id)),
    onMutate: async (reorderedTodos) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const previous = queryClient.getQueryData<Todo[]>(['todos'])
      // Merge reordered subset into cache instead of replacing entire cache
      const orderMap = new Map(reorderedTodos.map((t, i) => [t.id, i]))
      queryClient.setQueryData<Todo[]>(['todos'], (old = []) =>
        old.map(t => orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id)! } : t)
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['todos'], context.previous)
      toast({ title: 'Error', description: 'Failed to reorder todos.', variant: 'destructive' })
    },
  })

  return {
    todos: todosQuery.data ?? [],
    completedTodos: completedQuery.data ?? [],
    deletedTodos: deletedQuery.data ?? [],
    isLoading: todosQuery.isLoading,
    isSaving: create.isPending || update.isPending,
    create,
    update,
    updateStatus,
    updatePriority,
    archive,
    restore,
    permanentDelete,
    reorder,
    toggleSubtask,
  }
}
