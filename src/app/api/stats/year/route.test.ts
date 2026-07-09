import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbMock, resetDbMock } from '@/test/db-mock'
import { makeRequest } from '@/test/request'

vi.mock('@/lib/db', () => ({ db: dbMock }))

beforeEach(() => {
  resetDbMock()
})

describe('GET /api/stats/year', () => {
  it('returns empty-state stats when no todos exist', async () => {
    const { GET } = await import('./route')
    dbMock.todo.findMany.mockResolvedValue([])
    dbMock.accomplishment.findMany.mockResolvedValue([])
    const res = await GET(
      makeRequest({ url: 'http://localhost/api/stats/year?year=2026' }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      summary: {
        totalCreated: 0,
        totalCompleted: 0,
        completionRate: 0,
        avgCompletionDays: 0,
      },
      monthly: expect.any(Array),
      byStatus: expect.any(Array),
      byPriority: expect.any(Array),
      topLabels: [],
      accomplishments: { total: 0, byCategory: expect.any(Array) },
    })
    expect(body.monthly).toHaveLength(12)
  })

  it('returns 400 for invalid year', async () => {
    const { GET } = await import('./route')
    const res = await GET(
      makeRequest({ url: 'http://localhost/api/stats/year?year=99999' }),
    )
    expect(res.status).toBe(400)
  })

  it('rejects a year with trailing characters', async () => {
    const { GET } = await import('./route')
    const res = await GET(
      makeRequest({ url: 'http://localhost/api/stats/year?year=2026oops' }),
    )

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: 'Validation failed' })
    expect(dbMock.todo.findMany).not.toHaveBeenCalled()
  })

  it('returns a standardized error when a query fails', async () => {
    const { GET } = await import('./route')
    const error = new Error('database unavailable')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    dbMock.todo.findMany.mockRejectedValueOnce(error)

    const res = await GET(
      makeRequest({ url: 'http://localhost/api/stats/year?year=2026' }),
    )

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Failed to fetch stats' })
    expect(consoleError).toHaveBeenCalledWith(
      'Error fetching year stats:',
      error,
    )

    consoleError.mockRestore()
  })
})
