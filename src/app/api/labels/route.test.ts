import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbMock, resetDbMock } from '@/test/db-mock'
import { makeLabelRow } from '@/test/fixtures'
import { makeRequest } from '@/test/request'

vi.mock('@/lib/db', () => ({ db: dbMock }))
vi.mock('@/lib/events', () => ({
  emit: vi.fn(),
  subscribe: vi.fn(() => () => {}),
}))

beforeEach(() => {
  resetDbMock()
})

describe('GET /api/labels', () => {
  it('returns labels ordered by name', async () => {
    const { GET } = await import('./route')
    dbMock.label.findMany.mockResolvedValue([])
    const res = await GET()
    expect(res.status).toBe(200)
    expect(dbMock.label.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { name: 'asc' } }),
    )
  })
})

describe('POST /api/labels', () => {
  it('creates a label', async () => {
    const { POST } = await import('./route')
    dbMock.label.create.mockResolvedValue(makeLabelRow({ name: 'Focus' }))
    const res = await POST(
      makeRequest({
        method: 'POST',
        url: 'http://localhost/api/labels',
        body: { name: 'Focus', color: '#ff0000' },
      }),
    )
    expect(res.status).toBe(201)
  })

  it('returns 400 for invalid input', async () => {
    const { POST } = await import('./route')
    const res = await POST(
      makeRequest({
        method: 'POST',
        url: 'http://localhost/api/labels',
        body: { name: '' },
      }),
    )
    expect(res.status).toBe(400)
  })
})
