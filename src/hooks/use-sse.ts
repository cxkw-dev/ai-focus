'use client'

import { useEffect } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { pushEvalEntry } from '@/lib/eval-store'
import { queryKeys } from '@/lib/query-keys'
import type { EventEntity } from '@/lib/events'

const SSE_ENTITIES = [
  'todos',
  'people',
  'labels',
  'todoContacts',
  'todoUpdates',
  'notebook',
  'accomplishments',
  'eval',
] as const satisfies readonly EventEntity[]

function getPayloadTodoId(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null

  const todoId = (payload as { todoId?: unknown }).todoId
  return typeof todoId === 'string' && todoId.length > 0 ? todoId : null
}

function getPayloadYear(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null

  const year = (payload as { year?: unknown }).year
  return typeof year === 'number' && Number.isInteger(year) ? year : null
}

function isSseEntity(entity: unknown): entity is EventEntity {
  return (
    typeof entity === 'string' && SSE_ENTITIES.includes(entity as EventEntity)
  )
}

const INITIAL_BACKOFF_MS = 1_000
const MAX_BACKOFF_MS = 60_000

function nextBackoff(currentMs: number) {
  const doubled = Math.min(currentMs * 2, MAX_BACKOFF_MS)
  // Full jitter: random value between 0 and doubled to spread reconnects.
  return Math.floor(Math.random() * doubled)
}

function handleSseEvent(
  queryClient: QueryClient,
  entity: EventEntity,
  payload: unknown,
) {
  if (entity === 'eval' && payload) {
    pushEvalEntry(payload as Parameters<typeof pushEvalEntry>[0])
    return
  }

  if (entity === 'todos') {
    queryClient.invalidateQueries({ queryKey: queryKeys.todoBoard })
    queryClient.invalidateQueries({ queryKey: queryKeys.completedTodos })
  } else if (entity === 'people') {
    queryClient.invalidateQueries({ queryKey: queryKeys.people })
  } else if (entity === 'labels') {
    queryClient.invalidateQueries({ queryKey: queryKeys.labels })
    queryClient.invalidateQueries({ queryKey: queryKeys.todoBoard })
    queryClient.invalidateQueries({ queryKey: queryKeys.completedTodos })
  } else if (entity === 'todoContacts') {
    const todoId = getPayloadTodoId(payload)
    if (todoId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.todoContacts(todoId),
      })
    }
  } else if (entity === 'todoUpdates') {
    const todoId = getPayloadTodoId(payload)
    if (todoId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.todoUpdates(todoId),
      })
    }
  } else if (entity === 'notebook') {
    queryClient.invalidateQueries({ queryKey: queryKeys.notebook })
  } else if (entity === 'accomplishments') {
    const year = getPayloadYear(payload)
    if (year) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accomplishments(year),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.yearStats(year) })
    }
  }
}

export function useSSE() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let isDisposed = false
    let es: EventSource | null = null
    let retryTimeout: ReturnType<typeof setTimeout> | null = null
    let backoffMs = INITIAL_BACKOFF_MS
    let hasConnected = false

    function connect() {
      if (isDisposed) return
      es = new EventSource('/api/events')

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as {
            entity?: unknown
            payload?: unknown
          }
          const { entity, payload } = data

          if (!isSseEntity(entity)) {
            return
          }

          handleSseEvent(queryClient, entity, payload)
        } catch (error) {
          console.warn('[sse] failed to handle event', error)
        }
      }

      es.onopen = () => {
        backoffMs = INITIAL_BACKOFF_MS
        if (retryTimeout) {
          clearTimeout(retryTimeout)
          retryTimeout = null
        }

        // Queries are cached until an event says otherwise, so a gap in the
        // stream is a gap in freshness — anything written while we were
        // disconnected produced an event nobody heard. Resync on reconnect,
        // but not on the first open: that data is already fresh.
        if (hasConnected) {
          queryClient.invalidateQueries()
        }
        hasConnected = true
      }

      es.onerror = () => {
        if (isDisposed) return
        es?.close()
        if (retryTimeout) return

        const delay = nextBackoff(backoffMs)
        backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS)
        retryTimeout = setTimeout(() => {
          retryTimeout = null
          connect()
        }, delay)
      }
    }

    connect()

    return () => {
      isDisposed = true
      es?.close()
      if (retryTimeout) {
        clearTimeout(retryTimeout)
        retryTimeout = null
      }
    }
  }, [queryClient])
}
