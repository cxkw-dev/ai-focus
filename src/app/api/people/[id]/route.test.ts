import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbMock, resetDbMock } from '@/test/db-mock'
import { makePersonRow, prismaError } from '@/test/fixtures'
import { makeParams, makeRequest } from '@/test/request'

vi.mock('@/lib/db', () => ({ db: dbMock }))
vi.mock('@/lib/events', () => ({
  emit: vi.fn(),
  subscribe: vi.fn(() => () => {}),
}))

beforeEach(() => {
  resetDbMock()
})

describe('PATCH /api/people/[id]', () => {
  it('updates and returns the person', async () => {
    const { PATCH } = await import('./route')
    dbMock.person.update.mockResolvedValue(makePersonRow({ name: 'Renamed' }))
    const res = await PATCH(
      makeRequest({
        method: 'PATCH',
        url: 'http://localhost/api/people/p-1',
        body: { name: 'Renamed' },
      }),
      makeParams({ id: 'p-1' }),
    )
    expect(res.status).toBe(200)
  })

  it('returns 404 when person does not exist (P2025)', async () => {
    const { PATCH } = await import('./route')
    dbMock.person.update.mockRejectedValue(prismaError('P2025', 'not found'))
    const res = await PATCH(
      makeRequest({
        method: 'PATCH',
        url: 'http://localhost/api/people/x',
        body: { name: 'Nobody' },
      }),
      makeParams({ id: 'x' }),
    )
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid email', async () => {
    const { PATCH } = await import('./route')
    const res = await PATCH(
      makeRequest({
        method: 'PATCH',
        url: 'http://localhost/api/people/p-1',
        body: { email: 'not-an-email' },
      }),
      makeParams({ id: 'p-1' }),
    )
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/people/[id]', () => {
  it('deletes and returns success', async () => {
    const { DELETE } = await import('./route')
    dbMock.person.delete.mockResolvedValue(makePersonRow())
    const res = await DELETE(
      makeRequest({
        method: 'DELETE',
        url: 'http://localhost/api/people/p-1',
      }),
      makeParams({ id: 'p-1' }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })

  it('returns 404 when person does not exist (P2025)', async () => {
    const { DELETE } = await import('./route')
    dbMock.person.delete.mockRejectedValue(prismaError('P2025', 'not found'))
    const res = await DELETE(
      makeRequest({
        method: 'DELETE',
        url: 'http://localhost/api/people/x',
      }),
      makeParams({ id: 'x' }),
    )
    expect(res.status).toBe(404)
  })
})
