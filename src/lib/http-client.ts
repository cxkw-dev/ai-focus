type QueryValue = boolean | number | string | null | undefined

function normalizeQueryValue(value: QueryValue) {
  if (value === undefined || value === null || value === '') {
    return null
  }

  return String(value)
}

export function buildUrl(
  pathname: string,
  params?: Record<string, QueryValue>,
) {
  if (!params) {
    return pathname
  }

  const searchParams = new URLSearchParams()

  for (const [key, rawValue] of Object.entries(params)) {
    const value = normalizeQueryValue(rawValue)
    if (value !== null) {
      searchParams.set(key, value)
    }
  }

  const queryString = searchParams.toString()
  return queryString ? `${pathname}?${queryString}` : pathname
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init)

  if (!response.ok) {
    let message = `API error: ${response.status}`

    try {
      const payload = (await response.json()) as { error?: string }
      if (payload?.error) {
        message = payload.error
      }
    } catch {
      // Ignore JSON parsing errors and surface the status-based message instead.
    }

    throw new Error(message)
  }

  return (await response.json()) as T
}

export function withJsonBody(
  body: unknown,
  init: RequestInit = {},
): RequestInit {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')

  return {
    ...init,
    headers,
    body: JSON.stringify(body),
  }
}
