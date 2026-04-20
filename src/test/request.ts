import { NextRequest } from 'next/server'

interface MakeRequestOptions {
  method?: string
  url?: string
  body?: unknown
  searchParams?: Record<string, string>
  headers?: Record<string, string>
}

export function makeRequest(options: MakeRequestOptions = {}): NextRequest {
  const base = options.url ?? 'http://localhost:4444/api/test'
  const url = new URL(base)
  if (options.searchParams) {
    for (const [k, v] of Object.entries(options.searchParams)) {
      url.searchParams.set(k, v)
    }
  }
  const init: {
    method: string
    headers: Record<string, string>
    body?: string
  } = {
    method: options.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(options.headers ?? {}),
    },
  }
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body)
  }
  return new NextRequest(url, init)
}

export function makeParams<T extends Record<string, string>>(
  value: T,
): { params: Promise<T> } {
  return { params: Promise.resolve(value) }
}
