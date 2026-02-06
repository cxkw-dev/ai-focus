'use client'

import { useQuery } from '@tanstack/react-query'
import { statsApi } from '@/lib/api'

export function useYearStats(year: number) {
  return useQuery({
    queryKey: ['stats', 'year', year],
    queryFn: () => statsApi.yearReview(year),
  })
}
