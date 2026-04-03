'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { accomplishmentsApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import type {
  Accomplishment,
  CreateAccomplishmentInput,
  UpdateAccomplishmentInput,
} from '@/types/accomplishment'

export function useAccomplishments(year: number) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const query = useQuery({
    queryKey: queryKeys.accomplishments(year),
    queryFn: () => accomplishmentsApi.list(year),
  })

  const create = useMutation({
    mutationFn: (data: CreateAccomplishmentInput) =>
      accomplishmentsApi.create(data),
    onSuccess: (newItem) => {
      queryClient.setQueryData<Accomplishment[]>(
        queryKeys.accomplishments(year),
        (prev = []) =>
          [newItem, ...prev].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          ),
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.yearStats(year) })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create accomplishment.',
        variant: 'destructive',
      })
    },
  })

  const update = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateAccomplishmentInput
    }) => accomplishmentsApi.update(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<Accomplishment[]>(
        queryKeys.accomplishments(year),
        (prev = []) =>
          prev
            .map((a) => (a.id === updated.id ? updated : a))
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            ),
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.yearStats(year) })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update accomplishment.',
        variant: 'destructive',
      })
    },
  })

  const remove = useMutation({
    mutationFn: accomplishmentsApi.delete,
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.accomplishments(year),
      })
      const prev = queryClient.getQueryData<Accomplishment[]>(
        queryKeys.accomplishments(year),
      )
      queryClient.setQueryData<Accomplishment[]>(
        queryKeys.accomplishments(year),
        (old = []) => old.filter((a) => a.id !== id),
      )
      return { prev }
    },
    onError: (_err, _id, context) => {
      if (context?.prev) {
        queryClient.setQueryData(queryKeys.accomplishments(year), context.prev)
      }
      toast({
        title: 'Error',
        description: 'Failed to delete accomplishment.',
        variant: 'destructive',
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accomplishments(year),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.yearStats(year) })
    },
  })

  return {
    accomplishments: query.data ?? [],
    isLoading: query.isLoading,
    create,
    update,
    remove,
  }
}
