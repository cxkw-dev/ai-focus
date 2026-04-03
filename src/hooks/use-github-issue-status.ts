'use client'

import { useQuery, useQueries } from '@tanstack/react-query'
import { githubApi } from '@/lib/api'
import type { GitHubIssueStatus } from '@/types/todo'

const queryOptions = (url: string) => ({
  queryKey: ['github-issue', url],
  queryFn: () => githubApi.getIssueStatus(url),
  enabled: !!url,
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
})

export function useGithubIssueStatus(url: string) {
  return useQuery(queryOptions(url))
}

export function useGithubIssueStatuses(urls: string[]) {
  return useQueries({
    queries: urls.map((url) => queryOptions(url)),
    combine: (results) => {
      const statuses: (GitHubIssueStatus | undefined)[] = results.map(
        (r) => r.data,
      )
      const isLoading = results.some((r) => r.isLoading)
      const loaded = statuses.filter((s): s is GitHubIssueStatus => !!s)
      const allLoaded = !isLoading && loaded.length === urls.length
      const allClosed = allLoaded && loaded.every((s) => s.state === 'closed')

      return { statuses, isLoading, allClosed }
    },
  })
}
