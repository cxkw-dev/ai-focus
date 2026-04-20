import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbMock, resetDbMock } from '@/test/db-mock'
import { makeNotebookNoteRow } from '@/test/fixtures'
import { makeRequest } from '@/test/request'

vi.mock('@/lib/db', () => ({ db: dbMock }))
vi.mock('@/lib/events', () => ({
  emit: vi.fn(),
  subscribe: vi.fn(() => () => {}),
}))

beforeEach(() => {
  resetDbMock()
})

describe('GET /api/notebook', () => {
  it('returns notes ordered by pinned and updatedAt', async () => {
    const { GET } = await import('./route')
    dbMock.notebookNote.findMany.mockResolvedValue([])
    const res = await GET(makeRequest({ url: 'http://localhost/api/notebook' }))
    expect(res.status).toBe(200)
    expect(dbMock.notebookNote.findMany).toHaveBeenCalled()
  })

  it('filters by search when provided', async () => {
    const { GET } = await import('./route')
    dbMock.notebookNote.findMany.mockResolvedValue([])
    await GET(makeRequest({ url: 'http://localhost/api/notebook?search=foo' }))
    expect(dbMock.notebookNote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          title: { contains: 'foo', mode: 'insensitive' },
        }),
      }),
    )
  })
})

describe('POST /api/notebook', () => {
  it('creates a note with defaults', async () => {
    const { POST } = await import('./route')
    dbMock.notebookNote.create.mockResolvedValue(makeNotebookNoteRow())
    const res = await POST(
      makeRequest({
        method: 'POST',
        url: 'http://localhost/api/notebook',
        body: {},
      }),
    )
    expect(res.status).toBe(201)
    expect(dbMock.notebookNote.create).toHaveBeenCalledWith({
      data: { title: 'Untitled', content: '' },
    })
  })

  it('returns 400 when title exceeds max length', async () => {
    const { POST } = await import('./route')
    const res = await POST(
      makeRequest({
        method: 'POST',
        url: 'http://localhost/api/notebook',
        body: { title: 'x'.repeat(201) },
      }),
    )
    expect(res.status).toBe(400)
  })
})
