'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { notebookApi } from '@/lib/api'
import type { NotebookNote, CreateNotebookNoteInput, UpdateNotebookNoteInput } from '@/types/notebook'

export function useNotebook() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const notesQuery = useQuery({
    queryKey: ['notebook'],
    queryFn: () => notebookApi.list(),
  })

  const create = useMutation({
    mutationFn: (data: CreateNotebookNoteInput | void) => notebookApi.create(data ?? undefined),
    onSuccess: (newNote) => {
      queryClient.setQueryData<NotebookNote[]>(['notebook'], (prev = []) =>
        [newNote, ...prev]
      )
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create note.', variant: 'destructive' })
    },
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNotebookNoteInput }) =>
      notebookApi.update(id, data),
    onSuccess: (updatedNote) => {
      queryClient.setQueryData<NotebookNote[]>(['notebook'], (prev = []) =>
        prev.map(n => (n.id === updatedNote.id ? updatedNote : n))
      )
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update note.', variant: 'destructive' })
    },
  })

  // Silent content save — no toast, used for auto-save
  const saveContent = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      notebookApi.update(id, { content }),
    onSuccess: (updatedNote) => {
      queryClient.setQueryData<NotebookNote[]>(['notebook'], (prev = []) =>
        prev.map(n => (n.id === updatedNote.id ? updatedNote : n))
      )
    },
  })

  const remove = useMutation({
    mutationFn: notebookApi.delete,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notebook'] })
      const prev = queryClient.getQueryData<NotebookNote[]>(['notebook'])
      queryClient.setQueryData<NotebookNote[]>(['notebook'], (old = []) =>
        old.filter(n => n.id !== id)
      )
      return { prev }
    },
    onError: (_err, _id, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['notebook'], context.prev)
      }
      toast({ title: 'Error', description: 'Failed to delete note.', variant: 'destructive' })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notebook'] })
    },
  })

  return {
    notes: notesQuery.data ?? [],
    isLoading: notesQuery.isLoading,
    create,
    update,
    saveContent,
    remove,
  }
}
