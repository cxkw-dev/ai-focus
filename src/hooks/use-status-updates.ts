'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { statusUpdatesApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import type { StatusUpdate } from '@/types/todo'

export function useStatusUpdates(todoId: string, enabled = true) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const updatesQuery = useQuery({
    queryKey: queryKeys.todoUpdates(todoId),
    queryFn: () => statusUpdatesApi.list(todoId),
    enabled,
  })

  const add = useMutation({
    mutationFn: (data: { content: string; status?: string }) =>
      statusUpdatesApi.create(todoId, data),
    onSuccess: (newUpdate) => {
      queryClient.setQueryData<StatusUpdate[]>(
        queryKeys.todoUpdates(todoId),
        (prev = []) => [newUpdate, ...prev],
      )
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add update.',
        variant: 'destructive',
      })
    },
  })

  const remove = useMutation({
    mutationFn: (updateId: string) => statusUpdatesApi.remove(todoId, updateId),
    onSuccess: (_data, updateId) => {
      queryClient.setQueryData<StatusUpdate[]>(
        queryKeys.todoUpdates(todoId),
        (prev = []) => prev.filter((u) => u.id !== updateId),
      )
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove update.',
        variant: 'destructive',
      })
    },
  })

  return {
    updates: updatesQuery.data ?? [],
    isLoading: updatesQuery.isLoading,
    addUpdate: add.mutateAsync,
    removeUpdate: remove.mutateAsync,
  }
}
