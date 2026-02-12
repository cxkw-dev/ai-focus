'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useSSE() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let es: EventSource | null = null
    let retryTimeout: NodeJS.Timeout

    function connect() {
      es = new EventSource('/api/events')

      es.onmessage = (event) => {
        try {
          const { entity } = JSON.parse(event.data)
          if (entity === 'todos') {
            queryClient.invalidateQueries({ queryKey: ['todos'] })
          }
        } catch {
          // ignore malformed events
        }
      }

      es.onerror = () => {
        es?.close()
        // Reconnect after 5s on error
        retryTimeout = setTimeout(connect, 5_000)
      }
    }

    connect()

    return () => {
      es?.close()
      clearTimeout(retryTimeout)
    }
  }, [queryClient])
}
