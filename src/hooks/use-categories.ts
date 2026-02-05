'use client'

import { useQuery } from '@tanstack/react-query'
import { categoriesApi } from '@/lib/api'

export function useCategories() {
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  })

  return {
    categories: categoriesQuery.data ?? [],
    isLoading: categoriesQuery.isLoading,
  }
}
