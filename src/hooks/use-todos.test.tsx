import * as React from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient } from '@/test/react-query'
import { makeTodoRow } from '@/test/fixtures'
import { queryKeys } from '@/lib/query-keys'
import type { TodoBoardResponse } from '@/types/todo'

vi.mock('@/lib/api', () => ({
  todosApi: {
    board: vi.fn(),
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
    completed: [],
    deleted: [],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

function setup() {
  const client = createTestQueryClient()
  client.setQueryData(queryKeys.todoBoard, seedBoard())
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
    expect(board?.active.some((t) => t.id === 't-1')).toBe(false)
    expect(board?.completed.some((t) => t.id === 't-1')).toBe(true)
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
