'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { pushEvalEntry } from '@/lib/eval-store'
import { queryKeys } from '@/lib/query-keys'

function getPayloadTodoId(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null

  const todoId = (payload as { todoId?: unknown }).todoId
  return typeof todoId === 'string' && todoId.length > 0 ? todoId : null
}

const INITIAL_BACKOFF_MS = 1_000
const MAX_BACKOFF_MS = 60_000

function nextBackoff(currentMs: number) {
  const doubled = Math.min(currentMs * 2, MAX_BACKOFF_MS)
  // Full jitter: random value between 0 and doubled to spread reconnects.
  return Math.floor(Math.random() * doubled)
}

export function useSSE() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let isDisposed = false
    let es: EventSource | null = null
    let retryTimeout: ReturnType<typeof setTimeout> | null = null
    let backoffMs = INITIAL_BACKOFF_MS

    function connect() {
      if (isDisposed) return
      es = new EventSource('/api/events')

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const { entity, payload } = data

          // Forward eval events to the shared store
          if (entity === 'eval' && payload) {
            pushEvalEntry(payload as Parameters<typeof pushEvalEntry>[0])
          }

          // Invalidate React Query caches for data entities
          if (entity === 'todos') {
            queryClient.invalidateQueries({ queryKey: queryKeys.todoBoard })
          } else if (entity === 'people') {
            queryClient.invalidateQueries({ queryKey: queryKeys.people })
          } else if (entity === 'labels') {
            queryClient.invalidateQueries({ queryKey: queryKeys.labels })
            queryClient.invalidateQueries({ queryKey: queryKeys.todoBoard })
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
          }
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
