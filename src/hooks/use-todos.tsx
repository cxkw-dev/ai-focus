'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Undo2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { todosApi } from '@/lib/api'
import type { Todo, CreateTodoInput, UpdateTodoInput, Status, Priority } from '@/types/todo'

export function useTodos() {
  const queryClient = useQueryClient()
  const { toast, dismiss } = useToast()

  const todosQuery = useQuery({
    queryKey: ['todos'],
    queryFn: () => todosApi.list(),
  })

  const archivedQuery = useQuery({
    queryKey: ['todos', 'archived'],
    queryFn: () => todosApi.list({ archived: true }),
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
      queryClient.setQueryData<Todo[]>(['todos'], (prev = []) =>
        prev.map(t => (t.id === updatedTodo.id ? updatedTodo : t))
      )
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update todo.', variant: 'destructive' })
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) =>
      todosApi.update(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const previous = queryClient.getQueryData<Todo[]>(['todos'])
      queryClient.setQueryData<Todo[]>(['todos'], (prev = []) =>
        prev.map(t => (t.id === id ? { ...t, status } : t))
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['todos'], context.previous)
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
      await queryClient.cancelQueries({ queryKey: ['todos', 'archived'] })

      const previousTodos = queryClient.getQueryData<Todo[]>(['todos'])
      const previousArchived = queryClient.getQueryData<Todo[]>(['todos', 'archived'])
      const todoToArchive = previousTodos?.find(t => t.id === id)

      if (todoToArchive) {
        queryClient.setQueryData<Todo[]>(['todos'], (prev = []) =>
          prev.filter(t => t.id !== id)
        )
        const archivedTodo = { ...todoToArchive, archived: true }
        queryClient.setQueryData<Todo[]>(['todos', 'archived'], (prev = []) =>
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

      return { previousTodos, previousArchived }
    },
    onError: (_err, _id, context) => {
      if (context?.previousTodos) queryClient.setQueryData(['todos'], context.previousTodos)
      if (context?.previousArchived) queryClient.setQueryData(['todos', 'archived'], context.previousArchived)
      toast({ title: 'Error', description: 'Failed to delete todo.', variant: 'destructive' })
    },
  })

  const restore = useMutation({
    mutationFn: (id: string) => todosApi.update(id, { archived: false }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      await queryClient.cancelQueries({ queryKey: ['todos', 'archived'] })

      const previousTodos = queryClient.getQueryData<Todo[]>(['todos'])
      const previousArchived = queryClient.getQueryData<Todo[]>(['todos', 'archived'])
      const todoToRestore = previousArchived?.find(t => t.id === id)

      if (todoToRestore) {
        queryClient.setQueryData<Todo[]>(['todos', 'archived'], (prev = []) =>
          prev.filter(t => t.id !== id)
        )
        const restoredTodo = { ...todoToRestore, archived: false }
        queryClient.setQueryData<Todo[]>(['todos'], (prev = []) =>
          [restoredTodo, ...prev]
        )
      }

      return { previousTodos, previousArchived }
    },
    onSuccess: (_data, _id) => {
      toast({ title: 'Restored' })
    },
    onError: (_err, _id, context) => {
      if (context?.previousTodos) queryClient.setQueryData(['todos'], context.previousTodos)
      if (context?.previousArchived) queryClient.setQueryData(['todos', 'archived'], context.previousArchived)
      toast({ title: 'Error', description: 'Failed to restore todo.', variant: 'destructive' })
    },
  })

  const permanentDelete = useMutation({
    mutationFn: (id: string) => todosApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['todos', 'archived'] })
      const previous = queryClient.getQueryData<Todo[]>(['todos', 'archived'])
      queryClient.setQueryData<Todo[]>(['todos', 'archived'], (prev = []) =>
        prev.filter(t => t.id !== id)
      )
      return { previous }
    },
    onSuccess: () => {
      toast({ title: 'Permanently deleted' })
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['todos', 'archived'], context.previous)
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
      queryClient.setQueryData<Todo[]>(['todos'], reorderedTodos)
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['todos'], context.previous)
      toast({ title: 'Error', description: 'Failed to reorder todos.', variant: 'destructive' })
    },
  })

  return {
    todos: todosQuery.data ?? [],
    archivedTodos: archivedQuery.data ?? [],
    isLoading: todosQuery.isLoading || archivedQuery.isLoading,
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
