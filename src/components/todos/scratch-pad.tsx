'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Icon } from '@/components/ui/icon'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import type { Note } from '@/types/note'

interface ScratchPadProps {
  className?: string
}

function pickNewestNote(current: Note, incoming: Note) {
  const currentUpdatedAt = current.updatedAt
    ? new Date(current.updatedAt).getTime()
    : 0
  const incomingUpdatedAt = incoming.updatedAt
    ? new Date(incoming.updatedAt).getTime()
    : 0
  return incomingUpdatedAt >= currentUpdatedAt ? incoming : current
}

function useScratchPadLogic(initialContent: string) {
  const [content, setContent] = React.useState(initialContent)
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const latestContentRef = React.useRef(initialContent)
  const hasUnsavedChangesRef = React.useRef(false)

  // 3. Save Mutation
  const mutation = useMutation({
    mutationFn: async (newContent: string) => {
      const res = await fetch('/api/note', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
        keepalive: true,
      })
      if (!res.ok) throw new Error('Failed to save')
      return res.json() as Promise<Note>
    },
    onSuccess: (savedNote) => {
      queryClient.setQueryData<Note>(['note'], (previous) => {
        if (!previous) return savedNote
        return pickNewestNote(previous, savedNote)
      })
      hasUnsavedChangesRef.current = false
      setHasUnsavedChanges(false)
    },
    onError: (error) => {
      console.error('Save error:', error)
      toast({
        title: 'Error',
        description: 'Failed to save note.',
        variant: 'destructive',
      })
    },
  })

  // 4. Handle Change (Debounced Save)
  const handleChange = React.useCallback(
    (newContent: string) => {
      // Update local state immediately
      setContent(newContent)
      latestContentRef.current = newContent
      hasUnsavedChangesRef.current = true
      setHasUnsavedChanges(true)

      // Debounce save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        mutation.mutate(newContent)
      }, 1000) // 1s debounce
    },
    [mutation],
  )

  // 5. Save on Unmount (if dirty)
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (hasUnsavedChangesRef.current) {
        // Force an immediate save on unmount
        fetch('/api/note', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: latestContentRef.current }),
          keepalive: true,
        }).catch((err) => console.error('Unmount save failed:', err))
      }
    }
  }, [])

  return {
    content,
    handleChange,
    status: {
      isSaving: mutation.status === 'pending',
      hasUnsavedChanges,
      saveError: mutation.status === 'error',
    },
  }
}

function ScratchPadEditor({ initialContent }: { initialContent: string }) {
  const { content, handleChange, status } = useScratchPadLogic(initialContent)

  const saveState = status.saveError
    ? { text: 'Save failed', dot: 'dd-status-dot--error' }
    : status.isSaving
      ? { text: 'Saving…', dot: 'dd-status-dot--info' }
      : status.hasUnsavedChanges
        ? { text: 'Unsaved changes', dot: 'dd-status-dot--info' }
        : { text: 'Saved', dot: 'dd-status-dot--online' }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center gap-3 px-1">
        <p className="dd-eyebrow inline-flex items-center gap-1.5">
          <Icon name="edit" />
          Scratch pad
        </p>
        <span
          className={cn(
            'dd-status-dot dd-status-dot--sm dd-status-dot--muted ml-auto',
            saveState.dot,
          )}
          role="status"
        >
          {saveState.text}
        </span>
      </div>
      {/* Sits straight on its pane (the notes panel or a drawer): no inner box. */}
      <div className="min-h-0 flex-1 overflow-hidden px-1">
        <RichTextEditor
          value={content}
          onChange={handleChange}
          placeholder="Jot down quick notes"
          fullHeight
        />
      </div>
    </div>
  )
}

export function ScratchPad({ className }: ScratchPadProps) {
  const {
    data: note,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['note'],
    queryFn: async () => {
      const res = await fetch('/api/note')
      if (!res.ok) throw new Error('Failed to fetch note')
      return res.json() as Promise<Note>
    },
    refetchOnWindowFocus: false,
  })

  if (isLoading) {
    return (
      <div
        className={cn('flex min-h-0 flex-col gap-2', className)}
        aria-busy="true"
      >
        <span className="dd-skeleton dd-skeleton--text ml-1 w-28" />
        <span className="dd-skeleton rounded-box min-h-0 flex-1" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className={cn('flex min-h-0 flex-col', className)}>
        <div className="dd-empty-state dd-empty-state--compact">
          <div className="dd-empty-state__icon">
            <Icon name="error" />
          </div>
          <p className="dd-empty-state__title">Couldn’t load the scratch pad</p>
          <p className="dd-empty-state__text">Reload the page to try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      {/* Key forces remount if ID changes, ensuring fresh state */}
      <ScratchPadEditor
        key={note?.id || 'default'}
        initialContent={note?.content ?? ''}
      />
    </div>
  )
}
