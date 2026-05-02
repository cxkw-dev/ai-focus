'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

interface LocalAiStatus {
  connected: boolean
  provider: 'ollama' | 'omlx'
  label: string
  model: string
  url: string
  modelLoaded?: boolean
}

export function useLocalAiStatus() {
  return useQuery<LocalAiStatus>({
    queryKey: queryKeys.localAiStatus,
    queryFn: async () => {
      const res = await fetch('/api/local-ai')
      if (!res.ok) {
        return {
          connected: false,
          provider: 'omlx',
          label: 'Local AI',
          model: '',
          url: '',
        }
      }
      return res.json()
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  })
}
