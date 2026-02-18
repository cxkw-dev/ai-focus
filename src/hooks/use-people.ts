'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { peopleApi } from '@/lib/api'
import type { Person } from '@/types/person'

export function usePeople() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const peopleQuery = useQuery({
    queryKey: ['people'],
    queryFn: peopleApi.list,
  })

  const create = useMutation({
    mutationFn: peopleApi.create,
    onSuccess: (newPerson) => {
      queryClient.setQueryData<Person[]>(['people'], (prev = []) =>
        [...prev, newPerson].sort((a, b) => a.name.localeCompare(b.name))
      )
      toast({ title: 'Person added', description: newPerson.name })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add person.', variant: 'destructive' })
    },
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<Person, 'name' | 'email'>> }) =>
      peopleApi.update(id, data),
    onSuccess: (updatedPerson) => {
      queryClient.setQueryData<Person[]>(['people'], (prev = []) =>
        prev
          .map(p => (p.id === updatedPerson.id ? updatedPerson : p))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      toast({ title: 'Person updated', description: updatedPerson.name })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update person.', variant: 'destructive' })
    },
  })

  const remove = useMutation({
    mutationFn: peopleApi.delete,
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Person[]>(['people'], (prev = []) =>
        prev.filter(p => p.id !== id)
      )
      toast({ title: 'Person removed' })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to remove person.', variant: 'destructive' })
    },
  })

  const isMutating = create.isPending || update.isPending || remove.isPending

  const handleCreate = async (data: Pick<Person, 'name' | 'email'>) => {
    try {
      await create.mutateAsync(data)
      return true
    } catch {
      return false
    }
  }

  const handleUpdate = async (id: string, data: Partial<Pick<Person, 'name' | 'email'>>) => {
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
    people: peopleQuery.data ?? [],
    isLoading: peopleQuery.isLoading,
    isMutating,
    handleCreate,
    handleUpdate,
    handleDelete,
  }
}
