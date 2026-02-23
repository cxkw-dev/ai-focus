'use client'

import { useQuery, useQueries } from '@tanstack/react-query'
import { azureApi } from '@/lib/api'
import type { AzureWorkItemStatus } from '@/types/todo'

const RESOLVED_STATES = ['Done', 'Closed', 'Resolved', 'Removed']

const queryOptions = (url: string) => ({
  queryKey: ['azure-workitem', url],
  queryFn: () => azureApi.getWorkItemStatus(url),
  enabled: !!url,
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
})

export function useAzureWorkItemStatus(url: string) {
  return useQuery(queryOptions(url))
}

export function useAzureWorkItemStatuses(urls: string[]) {
  return useQueries({
    queries: urls.map((url) => queryOptions(url)),
    combine: (results) => {
      const statuses: (AzureWorkItemStatus | undefined)[] = results.map(r => r.data)
      const isLoading = results.some(r => r.isLoading)
      const loaded = statuses.filter((s): s is AzureWorkItemStatus => !!s)
      const allLoaded = !isLoading && loaded.length === urls.length
      const allResolved = allLoaded && loaded.every(s => RESOLVED_STATES.includes(s.state))

      return { statuses, isLoading, allResolved }
    },
  })
}
