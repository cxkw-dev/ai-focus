'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { labelsApi } from '@/lib/api'
import type { Label } from '@/types/todo'

export function useLabels() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const labelsQuery = useQuery({
    queryKey: ['labels'],
    queryFn: labelsApi.list,
  })

  const create = useMutation({
    mutationFn: labelsApi.create,
    onSuccess: (newLabel) => {
      queryClient.setQueryData<Label[]>(['labels'], (prev = []) =>
        [...prev, newLabel].sort((a, b) => a.name.localeCompare(b.name))
      )
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      toast({ title: 'Label created', description: newLabel.name })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create label.', variant: 'destructive' })
    },
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<Label, 'name' | 'color'>> }) =>
      labelsApi.update(id, data),
    onSuccess: (updatedLabel) => {
      queryClient.setQueryData<Label[]>(['labels'], (prev = []) =>
        prev
          .map(l => (l.id === updatedLabel.id ? updatedLabel : l))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      toast({ title: 'Label updated', description: updatedLabel.name })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update label.', variant: 'destructive' })
    },
  })

  const remove = useMutation({
    mutationFn: labelsApi.delete,
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Label[]>(['labels'], (prev = []) =>
        prev.filter(l => l.id !== id)
      )
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      toast({ title: 'Label deleted' })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete label.', variant: 'destructive' })
    },
  })

  const isMutating = create.isPending || update.isPending || remove.isPending

  // Adapter callbacks matching the LabelManager props interface
  const handleCreate = async (data: Pick<Label, 'name' | 'color'>) => {
    try {
      await create.mutateAsync(data)
      return true
    } catch {
      return false
    }
  }

  const handleUpdate = async (id: string, data: Partial<Pick<Label, 'name' | 'color'>>) => {
    try {
      await update.mutateAsync({ id, data })
      return true
    } catch {
      return false
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id)
      return true
    } catch {
      return false
    }
  }

  return {
    labels: labelsQuery.data ?? [],
    isLoading: labelsQuery.isLoading,
    isMutating,
    handleCreate,
    handleUpdate,
    handleDelete,
  }
}
