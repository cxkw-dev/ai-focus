import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbMock, resetDbMock } from '@/test/db-mock'

vi.mock('@/lib/db', () => ({ db: dbMock }))
vi.mock('@/lib/events', () => ({
  emit: vi.fn(),
  subscribe: vi.fn(() => () => {}),
}))

beforeEach(() => {
  resetDbMock()
})

describe('GET /api/todos/board', () => {
  it('returns the active and deleted buckets', async () => {
    const { GET } = await import('./route')
    dbMock.todo.findMany.mockResolvedValue([])
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      active: [],
      deleted: [],
      completedCounts: {
        COMPLETED: { total: 0, byProject: {} },
        CANCELLED: { total: 0, byProject: {} },
      },
    })
    expect(dbMock.todo.findMany).toHaveBeenCalledTimes(3)
  })

  it('tallies finished work per project instead of shipping the cards', async () => {
    const { GET } = await import('./route')
    dbMock.todo.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { status: 'COMPLETED', labels: [{ id: 'amex' }] },
        { status: 'COMPLETED', labels: [{ id: 'amex' }, { id: 'kaf' }] },
        { status: 'CANCELLED', labels: [{ id: 'kaf' }] },
      ])

    const res = await GET()

    // Done and Cancelled are separate rails, so their tallies stay separate.
    expect(await res.json()).toEqual({
      active: [],
      deleted: [],
      completedCounts: {
        COMPLETED: { total: 2, byProject: { amex: 2, kaf: 1 } },
        CANCELLED: { total: 1, byProject: { kaf: 1 } },
      },
    })
  })
})
