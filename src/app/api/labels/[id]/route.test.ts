import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbMock, resetDbMock } from '@/test/db-mock'
import { makeLabelRow, prismaError } from '@/test/fixtures'
import { makeParams, makeRequest } from '@/test/request'

vi.mock('@/lib/db', () => ({ db: dbMock }))
vi.mock('@/lib/events', () => ({
  emit: vi.fn(),
  subscribe: vi.fn(() => () => {}),
}))

beforeEach(() => {
  resetDbMock()
})

describe('PATCH /api/labels/[id]', () => {
  it('updates and returns the label', async () => {
    const { PATCH } = await import('./route')
    dbMock.label.update.mockResolvedValue(makeLabelRow({ id: 'l-1' }))
    dbMock.label.findUniqueOrThrow.mockResolvedValue(
      makeLabelRow({ id: 'l-1', name: 'Renamed' }),
    )
    const res = await PATCH(
      makeRequest({
        method: 'PATCH',
        url: 'http://localhost/api/labels/l-1',
        body: { name: 'Renamed' },
      }),
      makeParams({ id: 'l-1' }),
    )
    expect(res.status).toBe(200)
  })

  it('returns 404 when label does not exist (P2025)', async () => {
    const { PATCH } = await import('./route')
    dbMock.label.update.mockRejectedValue(prismaError('P2025', 'not found'))
    const res = await PATCH(
      makeRequest({
        method: 'PATCH',
        url: 'http://localhost/api/labels/x',
        body: { name: 'Renamed' },
      }),
      makeParams({ id: 'x' }),
    )
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid input', async () => {
    const { PATCH } = await import('./route')
    const res = await PATCH(
      makeRequest({
        method: 'PATCH',
        url: 'http://localhost/api/labels/l-1',
        body: { color: 'not-a-hex' },
      }),
      makeParams({ id: 'l-1' }),
    )
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/labels/[id]', () => {
  it('deletes and returns success', async () => {
    const { DELETE } = await import('./route')
    dbMock.label.delete.mockResolvedValue(makeLabelRow({ id: 'l-1' }))
    const res = await DELETE(
      makeRequest({
        method: 'DELETE',
        url: 'http://localhost/api/labels/l-1',
      }),
      makeParams({ id: 'l-1' }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })

  it('returns 404 when label does not exist (P2025)', async () => {
    const { DELETE } = await import('./route')
    dbMock.label.delete.mockRejectedValue(prismaError('P2025', 'not found'))
    const res = await DELETE(
      makeRequest({
        method: 'DELETE',
        url: 'http://localhost/api/labels/x',
      }),
      makeParams({ id: 'x' }),
    )
    expect(res.status).toBe(404)
  })
})
