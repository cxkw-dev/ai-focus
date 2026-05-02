import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  generateLocalAiText,
  getLocalAiConfig,
  getLocalAiStatus,
} from '@/lib/local-ai'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('local AI provider config', () => {
  it('defaults to Ollama compatibility', () => {
    expect(getLocalAiConfig()).toMatchObject({
      provider: 'ollama',
      model: 'gemma3:latest',
      url: 'http://localhost:11434',
    })
  })

  it('normalizes oMLX URLs to the OpenAI-compatible /v1 base', () => {
    vi.stubEnv('AI_PROVIDER', 'omlx')
    vi.stubEnv('AI_URL', 'http://localhost:8000')
    vi.stubEnv('AI_MODEL', 'test-model')

    expect(getLocalAiConfig()).toMatchObject({
      provider: 'omlx',
      model: 'test-model',
      url: 'http://localhost:8000/v1',
    })
  })
})

describe('local AI provider requests', () => {
  it('checks oMLX models through the OpenAI-compatible models endpoint', async () => {
    vi.stubEnv('AI_PROVIDER', 'omlx')
    vi.stubEnv('AI_URL', 'http://localhost:8000')
    vi.stubEnv('AI_MODEL', 'test-model')

    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        data: [{ id: 'test-model' }],
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(getLocalAiStatus()).resolves.toMatchObject({
      connected: true,
      modelLoaded: true,
      provider: 'omlx',
      url: 'http://localhost:8000/v1',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/v1/models',
      expect.any(Object),
    )
  })

  it('streams oMLX chat completions text', async () => {
    vi.stubEnv('AI_PROVIDER', 'omlx')
    vi.stubEnv('AI_URL', 'http://localhost:8000')
    vi.stubEnv('AI_MODEL', 'test-model')

    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          streamFrom(
            [
              'data: {"choices":[{"delta":{"content":"{\\"accomplishment\\":"}}]}',
              'data: {"choices":[{"delta":{"content":"false}"}}]}',
              'data: [DONE]',
              '',
            ].join('\n'),
          ),
        ),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(generateLocalAiText('classify this')).resolves.toBe(
      '{"accomplishment":false}',
    )
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/v1/chat/completions',
      expect.any(Object),
    )

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit
    expect(JSON.parse(requestInit.body as string)).toMatchObject({
      model: 'test-model',
      messages: [{ role: 'user', content: 'classify this' }],
      stream: true,
    })
  })
})

function streamFrom(text: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text))
      controller.close()
    },
  })
}
