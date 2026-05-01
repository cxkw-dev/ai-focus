import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbMock, resetDbMock } from '@/test/db-mock'
import { makeTodoRow, prismaError } from '@/test/fixtures'
import { makeParams, makeRequest } from '@/test/request'
import { evaluateAccomplishment } from '@/lib/accomplishment-agent'

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
  vi.mocked(evaluateAccomplishment).mockReset()
})

describe('GET /api/todos/[id]', () => {
  it('returns the todo when found', async () => {
    const { GET } = await import('./route')
    dbMock.todo.findUnique.mockResolvedValue(makeTodoRow({ id: 't-1' }))
    const res = await GET(
      makeRequest({ url: 'http://localhost/api/todos/t-1' }),
      makeParams({ id: 't-1' }),
    )
    expect(res.status).toBe(200)
  })

  it('returns 404 when not found', async () => {
    const { GET } = await import('./route')
    dbMock.todo.findUnique.mockResolvedValue(null)
    const res = await GET(
      makeRequest({ url: 'http://localhost/api/todos/x' }),
      makeParams({ id: 'x' }),
    )
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/todos/[id]', () => {
  it('updates and returns the todo', async () => {
    const { PATCH } = await import('./route')
    const existing = {
      id: 't-1',
      status: 'TODO',
      notebookNoteId: null,
      subtasks: [],
    }
    dbMock.todo.findUnique.mockResolvedValue(existing)
    dbMock.todo.update.mockResolvedValue(
      makeTodoRow({ id: 't-1', title: 'new' }),
    )
    const res = await PATCH(
      makeRequest({
        method: 'PATCH',
        url: 'http://localhost/api/todos/t-1',
        body: { title: 'new' },
      }),
      makeParams({ id: 't-1' }),
    )
    expect(res.status).toBe(200)
  })

  it('returns 400 for invalid body', async () => {
    const { PATCH } = await import('./route')
    const res = await PATCH(
      makeRequest({
        method: 'PATCH',
        url: 'http://localhost/api/todos/t-1',
        body: { priority: 'INVALID' },
      }),
      makeParams({ id: 't-1' }),
    )
    expect(res.status).toBe(400)
  })

  it('returns 404 when todo does not exist', async () => {
    const { PATCH } = await import('./route')
    dbMock.todo.findUnique.mockResolvedValue(null)
    const res = await PATCH(
      makeRequest({
        method: 'PATCH',
        url: 'http://localhost/api/todos/x',
        body: { title: 'new' },
      }),
      makeParams({ id: 'x' }),
    )
    expect(res.status).toBe(404)
  })

  it('evaluates accomplishments when transitioning to completed', async () => {
    const { PATCH } = await import('./route')
    const completedAt = new Date('2026-05-01T16:00:00.000Z')
    dbMock.todo.findUnique.mockResolvedValue({
      id: 't-1',
      status: 'TODO',
      notebookNoteId: null,
      subtasks: [],
    })
    dbMock.todo.update.mockResolvedValue(
      makeTodoRow({
        id: 't-1',
        title: 'Ship fix',
        status: 'COMPLETED',
        archived: true,
        completedAt,
      }),
    )

    const res = await PATCH(
      makeRequest({
        method: 'PATCH',
        url: 'http://localhost/api/todos/t-1',
        body: { status: 'COMPLETED' },
      }),
      makeParams({ id: 't-1' }),
    )

    expect(res.status).toBe(200)
    expect(evaluateAccomplishment).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 't-1',
        title: 'Ship fix',
        completedAt,
      }),
    )
  })

  it('does not evaluate accomplishments when already completed', async () => {
    const { PATCH } = await import('./route')
    dbMock.todo.findUnique.mockResolvedValue({
      id: 't-1',
      status: 'COMPLETED',
      notebookNoteId: null,
      subtasks: [],
    })
    dbMock.todo.update.mockResolvedValue(
      makeTodoRow({
        id: 't-1',
        status: 'COMPLETED',
        archived: true,
        completedAt: new Date('2026-05-01T16:00:00.000Z'),
      }),
    )

    const res = await PATCH(
      makeRequest({
        method: 'PATCH',
        url: 'http://localhost/api/todos/t-1',
        body: { status: 'COMPLETED' },
      }),
      makeParams({ id: 't-1' }),
    )

    expect(res.status).toBe(200)
    expect(evaluateAccomplishment).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/todos/[id]', () => {
  it('deletes and returns success', async () => {
    const { DELETE } = await import('./route')
    dbMock.todo.findUnique.mockResolvedValue({
      id: 't-1',
      notebookNoteId: null,
    })
    dbMock.accomplishment.deleteMany.mockResolvedValue({ count: 0 })
    dbMock.todo.delete.mockResolvedValue(makeTodoRow({ id: 't-1' }))
    const res = await DELETE(
      makeRequest({
        method: 'DELETE',
        url: 'http://localhost/api/todos/t-1',
      }),
      makeParams({ id: 't-1' }),
    )
    expect(res.status).toBe(200)
  })

  it('returns 404 when todo does not exist', async () => {
    const { DELETE } = await import('./route')
    dbMock.todo.findUnique.mockResolvedValue(null)
    const res = await DELETE(
      makeRequest({
        method: 'DELETE',
        url: 'http://localhost/api/todos/x',
      }),
      makeParams({ id: 'x' }),
    )
    expect(res.status).toBe(404)
  })

  it('returns 404 when prisma signals P2025', async () => {
    const { DELETE } = await import('./route')
    dbMock.todo.findUnique.mockResolvedValue({
      id: 't-1',
      notebookNoteId: null,
    })
    dbMock.accomplishment.deleteMany.mockResolvedValue({ count: 0 })
    dbMock.todo.delete.mockRejectedValue(prismaError('P2025', 'not found'))
    const res = await DELETE(
      makeRequest({
        method: 'DELETE',
        url: 'http://localhost/api/todos/t-1',
      }),
      makeParams({ id: 't-1' }),
    )
    expect(res.status).toBe(404)
  })
})
