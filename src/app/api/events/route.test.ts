import { beforeEach, describe, expect, it, vi } from 'vitest'

const unsubscribe = vi.fn()
const subscribe = vi.fn(() => unsubscribe)

vi.mock('@/lib/events', () => ({
  subscribe,
}))

beforeEach(() => {
  unsubscribe.mockReset()
  subscribe.mockReset()
  subscribe.mockReturnValue(unsubscribe)
})

describe('GET /api/events', () => {
  it('unsubscribes when the request is aborted', async () => {
    const { GET } = await import('./route')
    const controller = new AbortController()

    await GET(
      new Request('http://localhost/api/events', {
        signal: controller.signal,
      }),
    )

    expect(subscribe).toHaveBeenCalledTimes(1)

    controller.abort()
    await Promise.resolve()

    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
