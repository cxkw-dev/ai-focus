import * as React from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient } from '@/test/react-query'
import { makeTodoRow } from '@/test/fixtures'
import { queryKeys } from '@/lib/query-keys'
import { createEmptyCompletedCounts } from '@/lib/todo-board'
import type { Todo, TodoBoardResponse } from '@/types/todo'

vi.mock('@/lib/api', () => ({
  todosApi: {
    board: vi.fn(),
    completed: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    reorder: vi.fn(),
    toggleSubtask: vi.fn(),
    list: vi.fn(),
    listPaginated: vi.fn(),
    createSession: vi.fn(),
    deleteSession: vi.fn(),
  },
}))

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn(), dismiss: vi.fn() }),
}))

import { useTodos } from '@/hooks/use-todos'
import { todosApi } from '@/lib/api'

function seedBoard(): TodoBoardResponse {
  return {
    active: [
      makeTodoRow({
        id: 't-1',
        status: 'TODO',
      }) as unknown as TodoBoardResponse['active'][number],
    ],
    deleted: [],
    completedCounts: createEmptyCompletedCounts(),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

function setup(completedTodos?: Todo[]) {
  const client = createTestQueryClient()
  client.setQueryData(queryKeys.todoBoard, seedBoard())
  if (completedTodos) {
    client.setQueryData(queryKeys.completedTodos, completedTodos)
  }
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => useTodos(), { wrapper })
  return { result, client }
}

describe('useTodos.updateStatus', () => {
  it('optimistically removes a COMPLETED todo from active and resolves on success', async () => {
    ;(todosApi.update as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeTodoRow({ id: 't-1', status: 'COMPLETED', archived: true }),
    )
    const { result, client } = setup()

    await act(async () => {
      await result.current.updateStatus.mutateAsync({
        id: 't-1',
        status: 'COMPLETED',
      })
    })

    const board = client.getQueryData<TodoBoardResponse>(queryKeys.todoBoard)
    expect(board?.active.some((todo) => todo.id === 't-1')).toBe(false)

    // Finished todos live in their own cache entry, and only when it has been
    // loaded — here it has not, so there is nothing to keep in sync.
    expect(client.getQueryData(queryKeys.completedTodos)).toBeUndefined()
  })

  it('drops a card straight into its new lane when dragged out of a finished one', async () => {
    // Finished todos are archived, and the board routes archived todos to the
    // trash list — so pulling one back has to clear the flag optimistically or
    // the card visibly detours through Trash until the response lands.
    const cancelled = makeTodoRow({
      id: 't-2',
      status: 'CANCELLED',
      archived: true,
    }) as unknown as Todo
    ;(todosApi.update as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}),
    )
    const { result, client } = setup([cancelled])

    act(() => {
      result.current.updateStatus.mutate({ id: 't-2', status: 'TODO' })
    })

    await waitFor(() => {
      const board = client.getQueryData<TodoBoardResponse>(queryKeys.todoBoard)
      expect(board?.active.some((todo) => todo.id === 't-2')).toBe(true)
      expect(board?.deleted.some((todo) => todo.id === 't-2')).toBe(false)
    })
    expect(
      client
        .getQueryData<Todo[]>(queryKeys.completedTodos)
        ?.some((todo) => todo.id === 't-2'),
    ).toBe(false)
  })

  it('rolls back the board when the mutation fails', async () => {
    ;(todosApi.update as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('boom'),
    )
    const { result, client } = setup()

    await act(async () => {
      try {
        await result.current.updateStatus.mutateAsync({
          id: 't-1',
          status: 'COMPLETED',
        })
      } catch {
        // expected — we're asserting rollback
      }
    })

    await waitFor(() => {
      const board = client.getQueryData<TodoBoardResponse>(queryKeys.todoBoard)
      expect(
        board?.active.some((t) => t.id === 't-1' && t.status === 'TODO'),
      ).toBe(true)
    })
  })
})
