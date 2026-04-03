'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { todoContactsApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import type { TodoContact } from '@/types/todo'

export function useTodoContacts(todoId: string, enabled = true) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const contactsQuery = useQuery({
    queryKey: queryKeys.todoContacts(todoId),
    queryFn: () => todoContactsApi.list(todoId),
    enabled,
  })

  const add = useMutation({
    mutationFn: (data: { personId: string; role: string }) =>
      todoContactsApi.add(todoId, data),
    onSuccess: (newContact) => {
      queryClient.setQueryData<TodoContact[]>(
        queryKeys.todoContacts(todoId),
        (prev = []) => [...prev, newContact],
      )
      toast({ title: 'Contact added', description: newContact.person.name })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add contact.',
        variant: 'destructive',
      })
    },
  })

  const update = useMutation({
    mutationFn: ({
      contactId,
      data,
    }: {
      contactId: string
      data: { role?: string; order?: number }
    }) => todoContactsApi.update(todoId, contactId, data),
    onSuccess: (updatedContact) => {
      queryClient.setQueryData<TodoContact[]>(
        queryKeys.todoContacts(todoId),
        (prev = []) =>
          prev.map((c) => (c.id === updatedContact.id ? updatedContact : c)),
      )
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update contact.',
        variant: 'destructive',
      })
    },
  })

  const remove = useMutation({
    mutationFn: (contactId: string) =>
      todoContactsApi.remove(todoId, contactId),
    onSuccess: (_data, contactId) => {
      queryClient.setQueryData<TodoContact[]>(
        queryKeys.todoContacts(todoId),
        (prev = []) => prev.filter((c) => c.id !== contactId),
      )
      toast({ title: 'Contact removed' })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove contact.',
        variant: 'destructive',
      })
    },
  })

  return {
    contacts: contactsQuery.data ?? [],
    isLoading: contactsQuery.isLoading,
    isMutating: add.isPending || update.isPending || remove.isPending,
    addContact: add.mutateAsync,
    updateContact: update.mutateAsync,
    removeContact: remove.mutateAsync,
  }
}
