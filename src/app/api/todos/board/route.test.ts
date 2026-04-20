import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbMock, resetDbMock } from '@/test/db-mock'
import { makeRequest } from '@/test/request'

vi.mock('@/lib/db', () => ({ db: dbMock }))
vi.mock('@/lib/events', () => ({
  emit: vi.fn(),
  subscribe: vi.fn(() => () => {}),
}))

beforeEach(() => {
  resetDbMock()
})

describe('GET /api/todos/board', () => {
  it('returns active, completed, and deleted buckets', async () => {
    const { GET } = await import('./route')
    dbMock.todo.findMany.mockResolvedValue([])
    const res = await GET(
      makeRequest({ url: 'http://localhost/api/todos/board' }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      active: [],
      completed: [],
      deleted: [],
    })
    expect(dbMock.todo.findMany).toHaveBeenCalledTimes(3)
  })
})
