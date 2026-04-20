import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildUrl, requestJson, withJsonBody } from '@/lib/http-client'

describe('buildUrl', () => {
  it('returns pathname when no params', () => {
    expect(buildUrl('/api/todos')).toBe('/api/todos')
  })
  it('returns pathname when params are empty-after-stripping', () => {
    expect(buildUrl('/api/todos', { q: '', x: null, y: undefined })).toBe(
      '/api/todos',
    )
  })
  it('coerces non-string primitives', () => {
    expect(buildUrl('/api/todos', { limit: 10, archived: true })).toBe(
      '/api/todos?limit=10&archived=true',
    )
  })
  it('url-encodes string values', () => {
    expect(buildUrl('/api/search', { q: 'foo bar&baz' })).toBe(
      '/api/search?q=foo+bar%26baz',
    )
  })
})

describe('withJsonBody', () => {
  it('sets JSON content-type and stringifies body', () => {
    const init = withJsonBody({ a: 1 }, { method: 'POST' })
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"a":1}')
    const headers = new Headers(init.headers)
    expect(headers.get('content-type')).toBe('application/json')
  })
  it('preserves caller-provided headers', () => {
    const init = withJsonBody(
      { a: 1 },
      { headers: { 'x-custom': 'v' }, method: 'POST' },
    )
    const headers = new Headers(init.headers)
    expect(headers.get('x-custom')).toBe('v')
    expect(headers.get('content-type')).toBe('application/json')
  })
})

describe('requestJson', () => {
  const originalFetch = globalThis.fetch
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })
  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns parsed JSON on success', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ ok: 1 }), { status: 200 }),
    )
    await expect(requestJson('/x')).resolves.toEqual({ ok: 1 })
  })

  it('throws with server-provided error message when present', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Boom' }), { status: 400 }),
    )
    await expect(requestJson('/x')).rejects.toThrow('Boom')
  })

  it('falls back to status-based message when body is not JSON', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response('<html>500</html>', { status: 500 }),
    )
    await expect(requestJson('/x')).rejects.toThrow('API error: 500')
  })
})
