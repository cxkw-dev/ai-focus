'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { labelsApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import {
  activeLabelsQueryOptions,
  archivedLabelsQueryOptions,
} from '@/lib/query-options'
import type { CreateLabelInput, Label, UpdateLabelInput } from '@/types/todo'

export function useLabels() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const labelsQuery = useQuery(activeLabelsQueryOptions())
  const archivedLabelsQuery = useQuery(archivedLabelsQueryOptions())

  const create = useMutation({
    mutationFn: labelsApi.create,
    onSuccess: (newLabel) => {
      queryClient.setQueryData<Label[]>(queryKeys.labels, (prev = []) =>
        [...prev, newLabel].sort((a, b) => a.name.localeCompare(b.name)),
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.todoBoard })
      toast({ title: 'Created', description: newLabel.name })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create it.',
        variant: 'destructive',
      })
    },
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLabelInput }) =>
      labelsApi.update(id, data),
    onSuccess: (updatedLabel) => {
      queryClient.setQueryData<Label[]>(queryKeys.labels, (prev = []) =>
        prev
          .map((l) => (l.id === updatedLabel.id ? updatedLabel : l))
          .sort((a, b) => a.name.localeCompare(b.name)),
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.todoBoard })
      toast({ title: 'Updated', description: updatedLabel.name })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update it.',
        variant: 'destructive',
      })
    },
  })

  const remove = useMutation({
    mutationFn: labelsApi.delete,
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Label[]>(queryKeys.labels, (prev = []) =>
        prev.filter((l) => l.id !== id),
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.archivedLabels })
      queryClient.invalidateQueries({ queryKey: queryKeys.todoBoard })
      toast({
        title: 'Archived',
        description: 'Its history stays intact. Restore it anytime.',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to archive it.',
        variant: 'destructive',
      })
    },
  })

  const restore = useMutation({
    mutationFn: labelsApi.restore,
    onSuccess: (restored) => {
      queryClient.setQueryData<Label[]>(queryKeys.archivedLabels, (prev = []) =>
        prev.filter((l) => l.id !== restored.id),
      )
      queryClient.setQueryData<Label[]>(queryKeys.labels, (prev = []) =>
        [...prev, restored].sort((a, b) => a.name.localeCompare(b.name)),
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.todoBoard })
      toast({ title: 'Restored', description: restored.name })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to restore it.',
        variant: 'destructive',
      })
    },
  })

  const purge = useMutation({
    mutationFn: labelsApi.purge,
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Label[]>(queryKeys.archivedLabels, (prev = []) =>
        prev.filter((l) => l.id !== id),
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.todoBoard })
      toast({ title: 'Permanently deleted' })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete it permanently.',
        variant: 'destructive',
      })
    },
  })

  const isMutating =
    create.isPending ||
    update.isPending ||
    remove.isPending ||
    restore.isPending ||
    purge.isPending

  // Adapter callbacks matching the LabelManager props interface
  const handleCreate = async (data: CreateLabelInput) => {
    try {
      await create.mutateAsync(data)
      return true
    } catch {
      return false
    }
  }

  const handleUpdate = async (id: string, data: UpdateLabelInput) => {
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

  const handleRestore = async (id: string) => {
    try {
      await restore.mutateAsync(id)
      return true
    } catch {
      return false
    }
  }

  const handlePurge = async (id: string) => {
    try {
      await purge.mutateAsync(id)
      return true
    } catch {
      return false
    }
  }

  return {
    labels: labelsQuery.data ?? [],
    archivedLabels: archivedLabelsQuery.data ?? [],
    isLoading: labelsQuery.isLoading,
    isLoadingArchived: archivedLabelsQuery.isLoading,
    isMutating,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleRestore,
    handlePurge,
  }
}
