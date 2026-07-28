'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Undo2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { todosApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import {
  completedTodosQueryOptions,
  todoBoardQueryOptions,
} from '@/lib/query-options'
import {
  applyReorderedActiveTodos,
  createEmptyCompletedCounts,
  createEmptyTodoBoard,
  findTodoInBoard,
  isTerminalStatus,
  isTerminalTodo,
  placeTodoInBoard,
  removeTodoFromList,
  updateTodoInBoard,
} from '@/lib/todo-board'
import type {
  Priority,
  Status,
  TerminalStatus,
  Todo,
  TodoBoardResponse,
  UpdateTodoInput,
} from '@/types/todo'

const EMPTY_TODOS: Todo[] = []
const EMPTY_COMPLETED_COUNTS = createEmptyCompletedCounts()

/** Finishing a todo is worth an undo; which lane it landed in is the wording. */
const TERMINAL_TOAST_TITLES: Record<TerminalStatus, string> = {
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

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

/**
 * @param withCompleted fetch the finished pile too. Off by default: a board's
 * Done and Cancelled lanes are collapsed until you open one, and nothing else
 * needs the bodies.
 */
export function useTodos({ withCompleted = false } = {}) {
  const queryClient = useQueryClient()
  const { toast, dismiss } = useToast()

  const boardQuery = useQuery(todoBoardQueryOptions())
  const completedQuery = useQuery(completedTodosQueryOptions(withCompleted))

  const setBoardData = React.useCallback(
    (updater: (board: TodoBoardResponse) => TodoBoardResponse) => {
      queryClient.setQueryData<TodoBoardResponse>(
        queryKeys.todoBoard,
        (current) => updater(current ?? createEmptyTodoBoard()),
      )
    },
    [queryClient],
  )

  /**
   * Completing a todo moves it off the board and into the completed list;
   * reopening one moves it back. Both caches have to hear about it or the card
   * shows up twice, or not at all.
   */
  const syncCompletedList = React.useCallback(
    (todo: Todo) => {
      queryClient.setQueryData<Todo[]>(queryKeys.completedTodos, (current) => {
        if (!current) return current
        const without = removeTodoFromList(current, todo.id)
        return isTerminalTodo(todo) ? [todo, ...without] : without
      })
    },
    [queryClient],
  )

  const applyTodo = React.useCallback(
    (todo: Todo) => {
      setBoardData((board) => placeTodoInBoard(board, todo))
      syncCompletedList(todo)
    },
    [setBoardData, syncCompletedList],
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
      applyTodo(newTodo)
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
      applyTodo(updatedTodo)
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
      applyTodo(restoredTodo)
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
      const previousCompleted = queryClient.getQueryData<Todo[]>(
        queryKeys.completedTodos,
      )
      const todo =
        findTodoInBoard(previousBoard, id) ??
        previousCompleted?.find((candidate) => candidate.id === id)
      const previousStatus = todo?.status
      const nextStatusChangedAt = new Date().toISOString()

      const wasTerminal = previousStatus
        ? isTerminalStatus(previousStatus)
        : false

      if (isTerminalStatus(status)) {
        setBoardData((board) => ({
          ...board,
          active: removeTodoFromList(board.active, id),
        }))

        if (todo && wasTerminal) {
          // Already finished, moving between Done and Cancelled: the board has
          // nothing to drop, so the finished list is what has to change.
          syncCompletedList({
            ...todo,
            status,
            statusChangedAt: nextStatusChangedAt,
          })
        }
      } else if (todo) {
        // Dragged back out of a finished lane: put it on the board and take it
        // off the finished list in the same beat, so neither view flickers.
        // The server un-archives on the way out, so mirror that here or the
        // card lands in the trash list until the response arrives.
        applyTodo({
          ...todo,
          status,
          statusChangedAt: nextStatusChangedAt,
          ...(wasTerminal ? { archived: false } : {}),
        })
      }

      return {
        previousBoard,
        previousCompleted,
        previousStatus,
        title: todo?.title,
      }
    },
    onSuccess: (updatedTodo, { id, status }, context) => {
      applyTodo(updatedTodo)

      if (
        isTerminalStatus(status) &&
        context?.previousStatus &&
        !isTerminalStatus(context.previousStatus)
      ) {
        const previousStatus = context.previousStatus

        toast({
          title: TERMINAL_TOAST_TITLES[status],
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
      if (context?.previousCompleted) {
        queryClient.setQueryData(
          queryKeys.completedTodos,
          context.previousCompleted,
        )
      }
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
      applyTodo(updatedTodo)
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
      applyTodo(restoredTodo)
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
      applyTodo(updatedTodo)
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
        deleted: removeTodoFromList(board.deleted, id),
      }))
      queryClient.setQueryData<Todo[]>(queryKeys.completedTodos, (current) =>
        current ? removeTodoFromList(current, id) : current,
      )

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
      applyTodo(updatedTodo)
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
    completedTodos: completedQuery.data ?? EMPTY_TODOS,
    completedCounts: boardQuery.data?.completedCounts ?? EMPTY_COMPLETED_COUNTS,
    isLoadingCompleted: completedQuery.isLoading,
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
