export type LocalAiProvider = 'ollama' | 'omlx'

export interface LocalAiConfig {
  provider: LocalAiProvider
  label: string
  model: string
  url: string
}

export interface LocalAiStatus extends LocalAiConfig {
  connected: boolean
  modelLoaded?: boolean
}

interface GenerateOptions {
  maxTokens?: number
  temperature?: number
}

const DEFAULT_OLLAMA_URL = 'http://localhost:11434'
const DEFAULT_OLLAMA_MODEL = 'gemma3:latest'
const DEFAULT_OMLX_URL = 'http://localhost:11435/v1'
const DEFAULT_OMLX_MODEL = 'gemma-3-text-4b-it-4bit'

export function getLocalAiConfig(): LocalAiConfig {
  const provider = getProvider()

  if (provider === 'omlx') {
    return {
      provider,
      label: 'oMLX',
      model: env('AI_MODEL') ?? env('OMLX_MODEL') ?? DEFAULT_OMLX_MODEL,
      url: normalizeOmlxUrl(
        env('AI_URL') ?? env('OMLX_URL') ?? DEFAULT_OMLX_URL,
      ),
    }
  }

  return {
    provider,
    label: 'Ollama',
    model: env('AI_MODEL') ?? env('OLLAMA_MODEL') ?? DEFAULT_OLLAMA_MODEL,
    url: normalizeBaseUrl(
      env('AI_URL') ?? env('OLLAMA_URL') ?? DEFAULT_OLLAMA_URL,
    ),
  }
}

export async function getLocalAiStatus(): Promise<LocalAiStatus> {
  const config = getLocalAiConfig()

  try {
    if (config.provider === 'omlx') {
      return await getOmlxStatus(config)
    }

    return await getOllamaStatus(config)
  } catch {
    return {
      ...config,
      connected: false,
      modelLoaded: false,
    }
  }
}

export async function generateLocalAiText(
  prompt: string,
  options: GenerateOptions = {},
): Promise<string> {
  const config = getLocalAiConfig()

  if (config.provider === 'omlx') {
    return generateOmlxText(config, prompt, options)
  }

  return generateOllamaText(config, prompt, options)
}

async function getOllamaStatus(config: LocalAiConfig): Promise<LocalAiStatus> {
  const res = await fetch(joinUrl(config.url, '/api/tags'), {
    signal: AbortSignal.timeout(3000),
  })

  if (!res.ok) {
    return { ...config, connected: false, modelLoaded: false }
  }

  const data = (await res.json()) as { models?: { name: string }[] }
  const modelBase = config.model.split(':')[0]
  const modelLoaded =
    data.models?.some((model) => model.name.startsWith(modelBase)) ?? false

  return {
    ...config,
    connected: true,
    modelLoaded,
  }
}

async function getOmlxStatus(config: LocalAiConfig): Promise<LocalAiStatus> {
  const res = await fetch(joinUrl(config.url, '/models'), {
    headers: getAuthHeaders(),
    signal: AbortSignal.timeout(3000),
  })

  if (!res.ok) {
    return { ...config, connected: false, modelLoaded: false }
  }

  const data = (await res.json()) as { data?: { id?: string }[] }
  const modelLoaded =
    data.data?.some((model) => {
      if (!model.id) return false
      return model.id === config.model || model.id.startsWith(config.model)
    }) ?? false

  return {
    ...config,
    connected: true,
    modelLoaded,
  }
}

async function generateOllamaText(
  config: LocalAiConfig,
  prompt: string,
  options: GenerateOptions,
): Promise<string> {
  const response = await fetch(joinUrl(config.url, '/api/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      prompt,
      stream: true,
      options: { temperature: options.temperature ?? 0.1 },
    }),
  })

  if (!response.ok || !response.body) {
    throw new Error(`${config.label} returned ${response.status}`)
  }

  return streamOllamaResponse(response.body)
}

async function generateOmlxText(
  config: LocalAiConfig,
  prompt: string,
  options: GenerateOptions,
): Promise<string> {
  const response = await fetch(joinUrl(config.url, '/chat/completions'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature: options.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? 700,
    }),
  })

  if (!response.ok || !response.body) {
    throw new Error(`${config.label} returned ${response.status}`)
  }

  return streamOpenAiChatResponse(response.body)
}

async function streamOllamaResponse(
  body: ReadableStream<Uint8Array>,
): Promise<string> {
  let fullText = ''

  await readStreamLines(body, (line) => {
    if (!line.trim()) return

    try {
      const obj = JSON.parse(line) as { response?: string }
      if (obj.response) {
        fullText += obj.response
      }
    } catch {
      // Skip malformed NDJSON lines.
    }
  })

  return fullText.trim()
}

async function streamOpenAiChatResponse(
  body: ReadableStream<Uint8Array>,
): Promise<string> {
  let fullText = ''

  await readStreamLines(body, (line) => {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data:')) return

    const data = trimmed.slice('data:'.length).trim()
    if (!data || data === '[DONE]') return

    try {
      const obj = JSON.parse(data) as {
        choices?: {
          delta?: { content?: string }
          message?: { content?: string }
          text?: string
        }[]
      }
      const choice = obj.choices?.[0]
      const content =
        choice?.delta?.content ?? choice?.message?.content ?? choice?.text
      if (typeof content === 'string') {
        fullText += content
      }
    } catch {
      // Skip malformed SSE payloads.
    }
  })

  return fullText.trim()
}

async function readStreamLines(
  body: ReadableStream<Uint8Array>,
  onLine: (line: string) => void,
): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let pending = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      pending += decoder.decode(value, { stream: true })
      const lines = pending.split(/\r?\n/)
      pending = lines.pop() ?? ''

      for (const line of lines) {
        onLine(line)
      }
    }

    pending += decoder.decode()
    if (pending) onLine(pending)
  } finally {
    reader.releaseLock()
  }
}

function getProvider(): LocalAiProvider {
  const provider = env('AI_PROVIDER')?.toLowerCase()
  if (provider === 'omlx' || provider === 'mlx') return 'omlx'

  if (env('OMLX_URL') || env('OMLX_MODEL')) return 'omlx'

  return 'ollama'
}

function env(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

function getAuthHeaders(): Record<string, string> {
  const apiKey = env('AI_API_KEY') ?? env('OMLX_API_KEY')
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

function normalizeOmlxUrl(url: string): string {
  const baseUrl = normalizeBaseUrl(url)
  return baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl}/v1`
}

function joinUrl(baseUrl: string, path: string): string {
  return `${normalizeBaseUrl(baseUrl)}/${path.replace(/^\/+/, '')}`
}
