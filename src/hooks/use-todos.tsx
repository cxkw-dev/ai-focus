'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Undo2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { todosApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import type { Priority, Status, Todo, TodoBoardResponse, UpdateTodoInput } from '@/types/todo'

function emptyBoard(): TodoBoardResponse {
  return { active: [], completed: [], deleted: [] }
}

function removeTodo(todos: Todo[], todoId: string) {
  return todos.filter((todo) => todo.id !== todoId)
}

function findTodo(board: TodoBoardResponse | undefined, todoId: string) {
  if (!board) return undefined
  return [...board.active, ...board.completed, ...board.deleted].find((todo) => todo.id === todoId)
}

function updateBoardTodo(
  board: TodoBoardResponse,
  todoId: string,
  updater: (todo: Todo) => Todo
): TodoBoardResponse {
  return {
    active: board.active.map((todo) => (todo.id === todoId ? updater(todo) : todo)),
    completed: board.completed.map((todo) => (todo.id === todoId ? updater(todo) : todo)),
    deleted: board.deleted.map((todo) => (todo.id === todoId ? updater(todo) : todo)),
  }
}

function insertTodo(todos: Todo[], todo: Todo) {
  return [todo, ...removeTodo(todos, todo.id)]
}

function placeTodo(board: TodoBoardResponse, todo: Todo): TodoBoardResponse {
  const nextBoard = {
    active: removeTodo(board.active, todo.id),
    completed: removeTodo(board.completed, todo.id),
    deleted: removeTodo(board.deleted, todo.id),
  }

  if (todo.status === 'COMPLETED') {
    return { ...nextBoard, completed: insertTodo(nextBoard.completed, todo) }
  }

  if (todo.archived) {
    return { ...nextBoard, deleted: insertTodo(nextBoard.deleted, todo) }
  }

  return { ...nextBoard, active: insertTodo(nextBoard.active, todo) }
}

function sortActiveTodos(todos: Todo[]) {
  return [...todos].sort((left, right) => {
    if (left.order !== right.order) return left.order - right.order
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  })
}

function applyReorderedActiveTodos(board: TodoBoardResponse, reorderedTodos: Todo[]) {
  const orderMap = new Map(reorderedTodos.map((todo, index) => [todo.id, index]))

  return {
    ...board,
    active: sortActiveTodos(
      board.active.map((todo) =>
        orderMap.has(todo.id) ? { ...todo, order: orderMap.get(todo.id)! } : todo
      )
    ),
  }
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
        (current) => updater(current ?? emptyBoard())
      )
    },
    [queryClient]
  )

  const create = useMutation({
    mutationFn: todosApi.create,
    onSuccess: (newTodo) => {
      setBoardData((board) => placeTodo(board, newTodo))
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
      setBoardData((board) => placeTodo(board, updatedTodo))
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update todo.', variant: 'destructive' })
    },
  })

  const undoComplete = useMutation({
    mutationFn: ({ id, previousStatus }: { id: string; previousStatus: Status }) =>
      todosApi.update(id, { status: previousStatus }),
    onSuccess: (restoredTodo) => {
      setBoardData((board) => placeTodo(board, restoredTodo))
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
      await queryClient.cancelQueries({ queryKey: queryKeys.todoBoard })

      const previousBoard = queryClient.getQueryData<TodoBoardResponse>(queryKeys.todoBoard)
      const todo = findTodo(previousBoard, id)
      const previousStatus = todo?.status
      const nextStatusChangedAt = new Date().toISOString()

      if (status === 'COMPLETED') {
        setBoardData((board) => ({
          ...board,
          active: removeTodo(board.active, id),
        }))
      } else {
        setBoardData((board) =>
          updateBoardTodo(board, id, (currentTodo) => ({
            ...currentTodo,
            status,
            statusChangedAt: currentTodo.status === status ? currentTodo.statusChangedAt : nextStatusChangedAt,
          }))
        )
      }

      return { previousBoard, previousStatus, title: todo?.title }
    },
    onSuccess: (updatedTodo, { id, status }, context) => {
      setBoardData((board) => placeTodo(board, updatedTodo))

      if (status === 'COMPLETED' && context?.previousStatus) {
        toast({
          title: 'Completed',
          description: context.title,
          action: (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
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
      if (context?.previousBoard) {
        queryClient.setQueryData(queryKeys.todoBoard, context.previousBoard)
      }
      toast({ title: 'Error', description: 'Failed to update todo.', variant: 'destructive' })
    },
  })

  const updatePriority = useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: Priority }) =>
      todosApi.update(id, { priority }),
    onMutate: async ({ id, priority }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todoBoard })
      const previousBoard = queryClient.getQueryData<TodoBoardResponse>(queryKeys.todoBoard)
      setBoardData((board) =>
        updateBoardTodo(board, id, (todo) => ({ ...todo, priority }))
      )
      return { previousBoard }
    },
    onSuccess: (updatedTodo) => {
      setBoardData((board) => placeTodo(board, updatedTodo))
    },
    onError: (_err, _vars, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(queryKeys.todoBoard, context.previousBoard)
      }
      toast({ title: 'Error', description: 'Failed to update todo.', variant: 'destructive' })
    },
  })

  const archive = useMutation({
    mutationFn: (id: string) => todosApi.update(id, { archived: true }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todoBoard })

      const previousBoard = queryClient.getQueryData<TodoBoardResponse>(queryKeys.todoBoard)
      const todoToArchive = previousBoard?.active.find((todo) => todo.id === id)

      if (todoToArchive) {
        setBoardData((board) => placeTodo(board, { ...todoToArchive, archived: true }))

        toast({
          title: 'Deleted',
          description: todoToArchive.title,
          action: (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
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

      return { previousBoard }
    },
    onSuccess: (updatedTodo) => {
      setBoardData((board) => placeTodo(board, updatedTodo))
    },
    onError: (_err, _id, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(queryKeys.todoBoard, context.previousBoard)
      }
      toast({ title: 'Error', description: 'Failed to delete todo.', variant: 'destructive' })
    },
  })

  const restore = useMutation({
    mutationFn: (id: string) => todosApi.update(id, { archived: false }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todoBoard })

      const previousBoard = queryClient.getQueryData<TodoBoardResponse>(queryKeys.todoBoard)
      const todoToRestore = previousBoard?.deleted.find((todo) => todo.id === id)

      if (todoToRestore) {
        setBoardData((board) => placeTodo(board, { ...todoToRestore, archived: false }))
      }

      return { previousBoard }
    },
    onSuccess: (restoredTodo) => {
      setBoardData((board) => placeTodo(board, restoredTodo))
      toast({ title: 'Restored' })
    },
    onError: (_err, _id, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(queryKeys.todoBoard, context.previousBoard)
      }
      toast({ title: 'Error', description: 'Failed to restore todo.', variant: 'destructive' })
    },
  })

  const permanentDelete = useMutation({
    mutationFn: (id: string) => todosApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todoBoard })
      const previousBoard = queryClient.getQueryData<TodoBoardResponse>(queryKeys.todoBoard)
      setBoardData((board) => ({
        ...board,
        completed: removeTodo(board.completed, id),
        deleted: removeTodo(board.deleted, id),
      }))
      return { previousBoard }
    },
    onSuccess: () => {
      toast({ title: 'Permanently deleted' })
    },
    onError: (_err, _id, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(queryKeys.todoBoard, context.previousBoard)
      }
      toast({ title: 'Error', description: 'Failed to delete todo.', variant: 'destructive' })
    },
  })

  const toggleSubtask = useMutation({
    mutationFn: ({ todoId, subtaskId, completed }: { todoId: string; subtaskId: string; completed: boolean }) =>
      todosApi.toggleSubtask(todoId, subtaskId, completed),
    onMutate: async ({ todoId, subtaskId, completed }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todoBoard })
      const previousBoard = queryClient.getQueryData<TodoBoardResponse>(queryKeys.todoBoard)
      setBoardData((board) =>
        updateBoardTodo(board, todoId, (todo) => ({
          ...todo,
          subtasks: todo.subtasks.map((subtask) =>
            subtask.id === subtaskId ? { ...subtask, completed } : subtask
          ),
        }))
      )
      return { previousBoard }
    },
    onSuccess: (updatedTodo) => {
      setBoardData((board) => placeTodo(board, updatedTodo))
    },
    onError: (_err, _vars, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(queryKeys.todoBoard, context.previousBoard)
      }
      toast({ title: 'Error', description: 'Failed to toggle subtask.', variant: 'destructive' })
    },
  })

  const reorder = useMutation({
    mutationFn: (reorderedTodos: Todo[]) =>
      todosApi.reorder(reorderedTodos.map((todo) => todo.id)),
    onMutate: async (reorderedTodos) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todoBoard })
      const previousBoard = queryClient.getQueryData<TodoBoardResponse>(queryKeys.todoBoard)
      setBoardData((board) => applyReorderedActiveTodos(board, reorderedTodos))
      return { previousBoard }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(queryKeys.todoBoard, context.previousBoard)
      }
      toast({ title: 'Error', description: 'Failed to reorder todos.', variant: 'destructive' })
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
