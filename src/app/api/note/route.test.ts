import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
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

describe('GET /api/note', () => {
  it('returns empty content when no record exists', async () => {
    const { GET } = await import('./route')
    dbMock.note.findUnique.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      id: 'default',
      content: '',
      updatedAt: null,
    })
  })

  it('returns existing note content', async () => {
    const { GET } = await import('./route')
    const updatedAt = new Date('2026-04-20T10:00:00Z')
    dbMock.note.findUnique.mockResolvedValue({
      id: 'default',
      content: 'hi',
      createdAt: updatedAt,
      updatedAt,
    })
    const res = await GET()
    expect(await res.json()).toEqual({
      id: 'default',
      content: 'hi',
      updatedAt: updatedAt.toISOString(),
    })
  })
})

describe('PUT /api/note', () => {
  it('upserts and returns the note', async () => {
    const { PUT } = await import('./route')
    const now = new Date()
    dbMock.note.upsert.mockResolvedValue({
      id: 'default',
      content: 'x',
      createdAt: now,
      updatedAt: now,
    })
    const res = await PUT(
      makeRequest({
        method: 'PUT',
        url: 'http://localhost/api/note',
        body: { content: 'x' },
      }),
    )
    expect(res.status).toBe(200)
    expect(dbMock.note.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'default' },
        update: { content: 'x' },
        create: { id: 'default', content: 'x' },
      }),
    )
  })

  it('returns 400 when content is missing', async () => {
    const { PUT } = await import('./route')
    const res = await PUT(
      makeRequest({
        method: 'PUT',
        url: 'http://localhost/api/note',
        body: {},
      }),
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when content exceeds max length', async () => {
    const { PUT } = await import('./route')
    const res = await PUT(
      makeRequest({
        method: 'PUT',
        url: 'http://localhost/api/note',
        body: { content: 'x'.repeat(20001) },
      }),
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 for malformed JSON', async () => {
    const { PUT } = await import('./route')
    const res = await PUT(
      new NextRequest('http://localhost/api/note', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: '{"content"',
      }),
    )

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual(
      expect.objectContaining({
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            message: 'Request body must be valid JSON',
          }),
        ]),
      }),
    )
  })
})
