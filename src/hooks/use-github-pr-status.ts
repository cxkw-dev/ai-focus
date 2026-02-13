'use client'

import { useQuery, useQueries } from '@tanstack/react-query'
import { githubApi } from '@/lib/api'
import type { GitHubPrStatus } from '@/types/todo'

const queryOptions = (url: string) => ({
  queryKey: ['github-pr', url],
  queryFn: () => githubApi.getPrStatus(url),
  enabled: !!url,
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
})

export function useGithubPrStatus(url: string) {
  return useQuery(queryOptions(url))
}

export function useGithubPrStatuses(urls: string[]) {
  return useQueries({
    queries: urls.map((url) => queryOptions(url)),
    combine: (results) => {
      const statuses: (GitHubPrStatus | undefined)[] = results.map(r => r.data)
      const isLoading = results.some(r => r.isLoading)
      const loaded = statuses.filter((s): s is GitHubPrStatus => !!s)
      const allLoaded = !isLoading && loaded.length === urls.length
      const allMergedOrClosed = allLoaded && loaded.every(s => s.state === 'merged' || s.state === 'closed')
      const allMerged = allLoaded && loaded.every(s => s.state === 'merged')

      return { statuses, isLoading, allMergedOrClosed, allMerged }
    },
  })
}
