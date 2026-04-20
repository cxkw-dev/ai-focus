import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbMock, resetDbMock } from '@/test/db-mock'
import { makeTodoRow } from '@/test/fixtures'
import { makeParams, makeRequest } from '@/test/request'

vi.mock('@/lib/db', () => ({ db: dbMock }))
vi.mock('@/lib/events', () => ({
  emit: vi.fn(),
  subscribe: vi.fn(() => () => {}),
}))

beforeEach(() => {
  resetDbMock()
})

describe('PATCH /api/todos/[id]/subtasks/[subtaskId]', () => {
  it('toggles a subtask and returns the updated todo', async () => {
    const { PATCH } = await import('./route')
    dbMock.todo.findUnique.mockResolvedValue({ id: 't-1' })
    dbMock.subtask.updateMany.mockResolvedValue({ count: 1 })
    dbMock.todo.findUniqueOrThrow.mockResolvedValue(makeTodoRow({ id: 't-1' }))
    const res = await PATCH(
      makeRequest({
        method: 'PATCH',
        url: 'http://localhost/api/todos/t-1/subtasks/s-1',
        body: { completed: true },
      }),
      makeParams({ id: 't-1', subtaskId: 's-1' }),
    )
    expect(res.status).toBe(200)
  })

  it('returns 404 when todo does not exist', async () => {
    const { PATCH } = await import('./route')
    dbMock.todo.findUnique.mockResolvedValue(null)
    const res = await PATCH(
      makeRequest({
        method: 'PATCH',
        url: 'http://localhost/api/todos/x/subtasks/s-1',
        body: { completed: true },
      }),
      makeParams({ id: 'x', subtaskId: 's-1' }),
    )
    expect(res.status).toBe(404)
  })

  it('returns 404 when subtask does not belong to todo', async () => {
    const { PATCH } = await import('./route')
    dbMock.todo.findUnique.mockResolvedValue({ id: 't-1' })
    dbMock.subtask.updateMany.mockResolvedValue({ count: 0 })
    const res = await PATCH(
      makeRequest({
        method: 'PATCH',
        url: 'http://localhost/api/todos/t-1/subtasks/wrong',
        body: { completed: true },
      }),
      makeParams({ id: 't-1', subtaskId: 'wrong' }),
    )
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid body', async () => {
    const { PATCH } = await import('./route')
    const res = await PATCH(
      makeRequest({
        method: 'PATCH',
        url: 'http://localhost/api/todos/t-1/subtasks/s-1',
        body: { completed: 'yes' },
      }),
      makeParams({ id: 't-1', subtaskId: 's-1' }),
    )
    expect(res.status).toBe(400)
  })
})
