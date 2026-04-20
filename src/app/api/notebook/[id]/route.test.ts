import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbMock, resetDbMock } from '@/test/db-mock'
import { makeNotebookNoteRow } from '@/test/fixtures'
import { makeParams, makeRequest } from '@/test/request'

vi.mock('@/lib/db', () => ({ db: dbMock }))
vi.mock('@/lib/events', () => ({
  emit: vi.fn(),
  subscribe: vi.fn(() => () => {}),
}))

beforeEach(() => {
  resetDbMock()
})

describe('GET /api/notebook/[id]', () => {
  it('returns the note when found', async () => {
    const { GET } = await import('./route')
    dbMock.notebookNote.findUnique.mockResolvedValue(makeNotebookNoteRow())
    const res = await GET(
      makeRequest({ url: 'http://localhost/api/notebook/n-1' }),
      makeParams({ id: 'n-1' }),
    )
    expect(res.status).toBe(200)
  })

  it('returns 404 when not found', async () => {
    const { GET } = await import('./route')
    dbMock.notebookNote.findUnique.mockResolvedValue(null)
    const res = await GET(
      makeRequest({ url: 'http://localhost/api/notebook/x' }),
      makeParams({ id: 'x' }),
    )
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/notebook/[id]', () => {
  it('updates and returns the note', async () => {
    const { PATCH } = await import('./route')
    dbMock.notebookNote.update.mockResolvedValue(makeNotebookNoteRow())
    const res = await PATCH(
      makeRequest({
        method: 'PATCH',
        url: 'http://localhost/api/notebook/n-1',
        body: { title: 'new' },
      }),
      makeParams({ id: 'n-1' }),
    )
    expect(res.status).toBe(200)
  })

  it('returns 400 for invalid input', async () => {
    const { PATCH } = await import('./route')
    const res = await PATCH(
      makeRequest({
        method: 'PATCH',
        url: 'http://localhost/api/notebook/n-1',
        body: { pinned: 'yes' },
      }),
      makeParams({ id: 'n-1' }),
    )
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/notebook/[id]', () => {
  it('deletes and returns success', async () => {
    const { DELETE } = await import('./route')
    dbMock.notebookNote.delete.mockResolvedValue(makeNotebookNoteRow())
    const res = await DELETE(
      makeRequest({
        method: 'DELETE',
        url: 'http://localhost/api/notebook/n-1',
      }),
      makeParams({ id: 'n-1' }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })
})
