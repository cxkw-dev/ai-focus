import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbMock, resetDbMock } from '@/test/db-mock'
import { makePersonRow, prismaError } from '@/test/fixtures'
import { makeRequest } from '@/test/request'

vi.mock('@/lib/db', () => ({ db: dbMock }))
vi.mock('@/lib/events', () => ({
  emit: vi.fn(),
  subscribe: vi.fn(() => () => {}),
}))

beforeEach(() => {
  resetDbMock()
})

describe('GET /api/people', () => {
  it('returns people ordered by name', async () => {
    const { GET } = await import('./route')
    dbMock.person.findMany.mockResolvedValue([])
    const res = await GET()
    expect(res.status).toBe(200)
    expect(dbMock.person.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    })
  })
})

describe('POST /api/people', () => {
  it('creates a person', async () => {
    const { POST } = await import('./route')
    dbMock.person.create.mockResolvedValue(makePersonRow())
    const res = await POST(
      makeRequest({
        method: 'POST',
        url: 'http://localhost/api/people',
        body: { name: 'Alice', email: 'alice@example.com' },
      }),
    )
    expect(res.status).toBe(201)
  })

  it('returns 400 for invalid email', async () => {
    const { POST } = await import('./route')
    const res = await POST(
      makeRequest({
        method: 'POST',
        url: 'http://localhost/api/people',
        body: { name: 'Alice', email: 'not-an-email' },
      }),
    )
    expect(res.status).toBe(400)
  })

  it('returns 409 when email is already taken (P2002)', async () => {
    const { POST } = await import('./route')
    dbMock.person.create.mockRejectedValue(prismaError('P2002', 'duplicate'))
    const res = await POST(
      makeRequest({
        method: 'POST',
        url: 'http://localhost/api/people',
        body: { name: 'Alice', email: 'alice@example.com' },
      }),
    )
    expect(res.status).toBe(409)
  })
})
