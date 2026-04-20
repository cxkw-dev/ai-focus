import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbMock, resetDbMock } from '@/test/db-mock'
import { makeTodoRow } from '@/test/fixtures'
import { makeRequest } from '@/test/request'

vi.mock('@/lib/db', () => ({ db: dbMock }))
vi.mock('@/lib/events', () => ({
  emit: vi.fn(),
  subscribe: vi.fn(() => () => {}),
}))
vi.mock('@/lib/accomplishment-agent', () => ({
  evaluateAccomplishment: vi.fn(),
}))

beforeEach(() => {
  resetDbMock()
})

describe('GET /api/todos', () => {
  it('returns active todos by default', async () => {
    const { GET } = await import('./route')
    dbMock.todo.findMany.mockResolvedValue([])
    const res = await GET(makeRequest({ url: 'http://localhost/api/todos' }))
    expect(res.status).toBe(200)
    expect(dbMock.todo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ archived: false }),
      }),
    )
  })

  it('returns paginated shape when limit is provided', async () => {
    const { GET } = await import('./route')
    dbMock.todo.findMany.mockResolvedValue([])
    dbMock.todo.count.mockResolvedValue(0)
    const res = await GET(
      makeRequest({ url: 'http://localhost/api/todos?limit=20&offset=0' }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ todos: [], total: 0 })
  })
})

describe('POST /api/todos', () => {
  it('creates a todo and returns 201', async () => {
    const { POST } = await import('./route')
    dbMock.todo.findFirst.mockResolvedValue(null)
    dbMock.todo.create.mockResolvedValue(makeTodoRow({ title: 'hi' }))
    const res = await POST(
      makeRequest({
        method: 'POST',
        url: 'http://localhost/api/todos',
        body: { title: 'hi' },
      }),
    )
    expect(res.status).toBe(201)
    expect(dbMock.todo.create).toHaveBeenCalled()
  })

  it('returns 400 for invalid input', async () => {
    const { POST } = await import('./route')
    const res = await POST(
      makeRequest({
        method: 'POST',
        url: 'http://localhost/api/todos',
        body: { title: '' },
      }),
    )
    expect(res.status).toBe(400)
  })
})
