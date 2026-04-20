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

describe('POST /api/todos/reorder', () => {
  it('reorders todos and returns success', async () => {
    const { POST } = await import('./route')
    dbMock.todo.count.mockResolvedValue(2)
    dbMock.todo.update.mockResolvedValue({})
    const res = await POST(
      makeRequest({
        method: 'POST',
        url: 'http://localhost/api/todos/reorder',
        body: { orderedIds: ['a', 'b'] },
      }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })

  it('returns 400 when ids are invalid or archived', async () => {
    const { POST } = await import('./route')
    dbMock.todo.count.mockResolvedValue(1)
    const res = await POST(
      makeRequest({
        method: 'POST',
        url: 'http://localhost/api/todos/reorder',
        body: { orderedIds: ['a', 'b'] },
      }),
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid body shape', async () => {
    const { POST } = await import('./route')
    const res = await POST(
      makeRequest({
        method: 'POST',
        url: 'http://localhost/api/todos/reorder',
        body: {},
      }),
    )
    expect(res.status).toBe(400)
  })
})
