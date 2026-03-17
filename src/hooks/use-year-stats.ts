'use client'

import { useQuery } from '@tanstack/react-query'
import { statsApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

export function useYearStats(year: number) {
  return useQuery({
    queryKey: queryKeys.yearStats(year),
    queryFn: () => statsApi.yearReview(year),
  })
}
