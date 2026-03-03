'use client'

import { useQuery } from '@tanstack/react-query'

interface OllamaStatus {
  connected: boolean
  model: string
  url: string
  modelLoaded?: boolean
}

export function useOllamaStatus() {
  return useQuery<OllamaStatus>({
    queryKey: ['ollama', 'status'],
    queryFn: async () => {
      const res = await fetch('/api/ollama')
      if (!res.ok) return { connected: false, model: '', url: '' }
      return res.json()
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  })
}
