'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { pushEvalEntry } from '@/lib/eval-store'

export function useSSE() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let isDisposed = false
    let es: EventSource | null = null
    let retryTimeout: ReturnType<typeof setTimeout> | null = null

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
            queryClient.invalidateQueries({ queryKey: ['todos'] })
          } else if (entity === 'people') {
            queryClient.invalidateQueries({ queryKey: ['people'] })
          }
        } catch {
          // ignore malformed events
        }
      }

      es.onopen = () => {
        if (retryTimeout) {
          clearTimeout(retryTimeout)
          retryTimeout = null
        }
      }

      es.onerror = () => {
        if (isDisposed) return
        es?.close()
        // Reconnect after 5s on error (single scheduled retry only).
        if (!retryTimeout) {
          retryTimeout = setTimeout(() => {
            retryTimeout = null
            connect()
          }, 5_000)
        }
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
