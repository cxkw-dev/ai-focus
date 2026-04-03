'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Undo2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { todosApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import {
  applyReorderedActiveTodos,
  createEmptyTodoBoard,
  findTodoInBoard,
  placeTodoInBoard,
  removeTodoFromList,
  updateTodoInBoard,
} from '@/lib/todo-board'
import type {
  Priority,
  Status,
  Todo,
  TodoBoardResponse,
  UpdateTodoInput,
} from '@/types/todo'

function UndoToastAction({ onUndo }: { onUndo: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onUndo()
      }}
      className="bg-primary text-primary-foreground ring-offset-background hover:bg-primary/90 focus:ring-ring inline-flex h-8 shrink-0 items-center justify-center rounded-lg px-3 text-sm font-medium transition-all focus:ring-2 focus:ring-offset-2 focus:outline-none active:scale-95"
    >
      <Undo2 className="mr-1.5 h-4 w-4" strokeWidth={2} />
      Undo
    </button>
  )
}

export function useTodos() {
  const queryClient = useQueryClient()
  const { toast, dismiss } = useToast()

  const boardQuery = useQuery({
    queryKey: queryKeys.todoBoard,
    queryFn: todosApi.board,
  })

  const setBoardData = React.useCallback(
    (updater: (board: TodoBoardResponse) => TodoBoardResponse) => {
      queryClient.setQueryData<TodoBoardResponse>(
        queryKeys.todoBoard,
        (current) => updater(current ?? createEmptyTodoBoard()),
      )
    },
    [queryClient],
  )

  const restoreBoardSnapshot = React.useCallback(
    (previousBoard?: TodoBoardResponse) => {
      if (previousBoard) {
        queryClient.setQueryData(queryKeys.todoBoard, previousBoard)
      }
    },
    [queryClient],
  )

  const create = useMutation({
    mutationFn: todosApi.create,
    onSuccess: (newTodo) => {
      setBoardData((board) => placeTodoInBoard(board, newTodo))
      toast({ title: 'Added', description: newTodo.title })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create todo.',
        variant: 'destructive',
      })
    },
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTodoInput }) =>
      todosApi.update(id, data),
    onSuccess: (updatedTodo) => {
      setBoardData((board) => placeTodoInBoard(board, updatedTodo))
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update todo.',
        variant: 'destructive',
      })
    },
  })

  const undoComplete = useMutation({
    mutationFn: ({
      id,
      previousStatus,
    }: {
      id: string
      previousStatus: Status
    }) => todosApi.update(id, { status: previousStatus }),
    onSuccess: (restoredTodo) => {
      setBoardData((board) => placeTodoInBoard(board, restoredTodo))
      toast({ title: 'Restored' })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to undo completion.',
        variant: 'destructive',
      })
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) =>
      todosApi.update(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todoBoard })

      const previousBoard = queryClient.getQueryData<TodoBoardResponse>(
        queryKeys.todoBoard,
      )
      const todo = findTodoInBoard(previousBoard, id)
      const previousStatus = todo?.status
      const nextStatusChangedAt = new Date().toISOString()

      if (status === 'COMPLETED') {
        setBoardData((board) => ({
          ...board,
          active: removeTodoFromList(board.active, id),
        }))
      } else {
        setBoardData((board) =>
          updateTodoInBoard(board, id, (currentTodo) => ({
            ...currentTodo,
            status,
            statusChangedAt:
              currentTodo.status === status
                ? currentTodo.statusChangedAt
                : nextStatusChangedAt,
          })),
        )
      }

      return { previousBoard, previousStatus, title: todo?.title }
    },
    onSuccess: (updatedTodo, { id, status }, context) => {
      setBoardData((board) => placeTodoInBoard(board, updatedTodo))

      if (status === 'COMPLETED' && context?.previousStatus) {
        const previousStatus = context.previousStatus

        toast({
          title: 'Completed',
          description: context.title,
          action: (
            <UndoToastAction
              onUndo={() => {
                undoComplete.mutate({ id, previousStatus })
                dismiss()
              }}
            />
          ),
          duration: 5000,
        })
      }
    },
    onError: (_error, _variables, context) => {
      restoreBoardSnapshot(context?.previousBoard)
      toast({
        title: 'Error',
        description: 'Failed to update todo.',
        variant: 'destructive',
      })
    },
  })

  const updatePriority = useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: Priority }) =>
      todosApi.update(id, { priority }),
    onMutate: async ({ id, priority }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todoBoard })

      const previousBoard = queryClient.getQueryData<TodoBoardResponse>(
        queryKeys.todoBoard,
      )

      setBoardData((board) =>
        updateTodoInBoard(board, id, (todo) => ({ ...todo, priority })),
      )

      return { previousBoard }
    },
    onSuccess: (updatedTodo) => {
      setBoardData((board) => placeTodoInBoard(board, updatedTodo))
    },
    onError: (_error, _variables, context) => {
      restoreBoardSnapshot(context?.previousBoard)
      toast({
        title: 'Error',
        description: 'Failed to update todo.',
        variant: 'destructive',
      })
    },
  })

  const restore = useMutation({
    mutationFn: (id: string) => todosApi.update(id, { archived: false }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todoBoard })

      const previousBoard = queryClient.getQueryData<TodoBoardResponse>(
        queryKeys.todoBoard,
      )
      const todoToRestore = previousBoard?.deleted.find(
        (todo) => todo.id === id,
      )

      if (todoToRestore) {
        setBoardData((board) =>
          placeTodoInBoard(board, { ...todoToRestore, archived: false }),
        )
      }

      return { previousBoard }
    },
    onSuccess: (restoredTodo) => {
      setBoardData((board) => placeTodoInBoard(board, restoredTodo))
      toast({ title: 'Restored' })
    },
    onError: (_error, _variables, context) => {
      restoreBoardSnapshot(context?.previousBoard)
      toast({
        title: 'Error',
        description: 'Failed to restore todo.',
        variant: 'destructive',
      })
    },
  })

  const archive = useMutation({
    mutationFn: (id: string) => todosApi.update(id, { archived: true }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todoBoard })

      const previousBoard = queryClient.getQueryData<TodoBoardResponse>(
        queryKeys.todoBoard,
      )
      const todoToArchive = previousBoard?.active.find((todo) => todo.id === id)

      if (todoToArchive) {
        setBoardData((board) =>
          placeTodoInBoard(board, { ...todoToArchive, archived: true }),
        )

        toast({
          title: 'Deleted',
          description: todoToArchive.title,
          action: (
            <UndoToastAction
              onUndo={() => {
                restore.mutate(id)
                dismiss()
              }}
            />
          ),
          duration: 5000,
        })
      }

      return { previousBoard }
    },
    onSuccess: (updatedTodo) => {
      setBoardData((board) => placeTodoInBoard(board, updatedTodo))
    },
    onError: (_error, _variables, context) => {
      restoreBoardSnapshot(context?.previousBoard)
      toast({
        title: 'Error',
        description: 'Failed to delete todo.',
        variant: 'destructive',
      })
    },
  })

  const permanentDelete = useMutation({
    mutationFn: (id: string) => todosApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todoBoard })

      const previousBoard = queryClient.getQueryData<TodoBoardResponse>(
        queryKeys.todoBoard,
      )

      setBoardData((board) => ({
        ...board,
        completed: removeTodoFromList(board.completed, id),
        deleted: removeTodoFromList(board.deleted, id),
      }))

      return { previousBoard }
    },
    onSuccess: () => {
      toast({ title: 'Permanently deleted' })
    },
    onError: (_error, _variables, context) => {
      restoreBoardSnapshot(context?.previousBoard)
      toast({
        title: 'Error',
        description: 'Failed to delete todo.',
        variant: 'destructive',
      })
    },
  })

  const toggleSubtask = useMutation({
    mutationFn: ({
      todoId,
      subtaskId,
      completed,
    }: {
      todoId: string
      subtaskId: string
      completed: boolean
    }) => todosApi.toggleSubtask(todoId, subtaskId, completed),
    onMutate: async ({ todoId, subtaskId, completed }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todoBoard })

      const previousBoard = queryClient.getQueryData<TodoBoardResponse>(
        queryKeys.todoBoard,
      )

      setBoardData((board) =>
        updateTodoInBoard(board, todoId, (todo) => ({
          ...todo,
          subtasks: todo.subtasks.map((subtask) =>
            subtask.id === subtaskId ? { ...subtask, completed } : subtask,
          ),
        })),
      )

      return { previousBoard }
    },
    onSuccess: (updatedTodo) => {
      setBoardData((board) => placeTodoInBoard(board, updatedTodo))
    },
    onError: (_error, _variables, context) => {
      restoreBoardSnapshot(context?.previousBoard)
      toast({
        title: 'Error',
        description: 'Failed to toggle subtask.',
        variant: 'destructive',
      })
    },
  })

  const reorder = useMutation({
    mutationFn: (reorderedTodos: Todo[]) =>
      todosApi.reorder(reorderedTodos.map((todo) => todo.id)),
    onMutate: async (reorderedTodos) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todoBoard })

      const previousBoard = queryClient.getQueryData<TodoBoardResponse>(
        queryKeys.todoBoard,
      )

      setBoardData((board) => applyReorderedActiveTodos(board, reorderedTodos))

      return { previousBoard }
    },
    onError: (_error, _variables, context) => {
      restoreBoardSnapshot(context?.previousBoard)
      toast({
        title: 'Error',
        description: 'Failed to reorder todos.',
        variant: 'destructive',
      })
    },
  })

  return {
    todos: boardQuery.data?.active ?? [],
    completedTodos: boardQuery.data?.completed ?? [],
    deletedTodos: boardQuery.data?.deleted ?? [],
    isLoading: boardQuery.isLoading,
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
