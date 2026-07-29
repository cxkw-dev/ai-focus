'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PenLine } from 'lucide-react'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { useToast } from '@/components/ui/use-toast'
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

  const getStatusText = () => {
    if (status.saveError) return 'Save failed'
    if (status.isSaving) return 'Saving...'
    if (status.hasUnsavedChanges) return 'Unsaved changes...'
    return 'Saved'
  }

  const getStatusColor = () => {
    if (status.saveError) return 'var(--status-urgent)'
    if (status.isSaving || status.hasUnsavedChanges)
      return 'var(--status-in-progress)'
    return 'var(--text-muted)'
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Folder-tab affordance — a single, unmistakable "you are here" marker
          instead of a flat status bar. The status dot lives inside it so
          save-state never needs its own separate label. */}
      <div
        className="ml-3 flex w-fit items-center gap-1.5 rounded-t-md border border-b-0 px-2.5 py-1"
        style={{
          borderColor:
            'color-mix(in srgb, var(--status-waiting) 50%, transparent)',
          backgroundColor:
            'color-mix(in srgb, var(--status-waiting) 18%, transparent)',
          color: 'var(--status-waiting)',
        }}
      >
        <PenLine className="h-3 w-3" />
        <span className="text-[10px] font-bold tracking-widest uppercase">
          Scratch Pad
        </span>
        <span
          className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
          style={{ backgroundColor: getStatusColor() }}
          title={getStatusText()}
        />
      </div>
      <div
        className="relative min-h-0 flex-1 overflow-hidden rounded-tr-lg rounded-b-lg border"
        style={{
          borderColor:
            'color-mix(in srgb, var(--status-waiting) 50%, transparent)',
          backgroundColor: 'var(--surface)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, var(--text-primary) 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
            backgroundPosition: '8px 8px',
          }}
        />

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 0%, transparent 85%, var(--surface) 100%)`,
          }}
        />

        <div className="relative h-full w-full px-4 py-3">
          <RichTextEditor
            value={content}
            onChange={handleChange}
            placeholder="Jot down quick notes..."
            fullHeight
          />
        </div>
      </div>
    </div>
  )
}

export function ScratchPad({ className = '' }: ScratchPadProps) {
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
      <div className={`flex min-h-0 flex-col ${className}`}>
        <div className="bg-muted ml-3 h-6 w-28 animate-pulse rounded-t-md" />
        <div className="bg-muted flex-1 animate-pulse rounded-tr-lg rounded-b-lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className={`flex min-h-0 flex-col ${className}`}>
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-red-200 bg-red-50/10">
          <p className="text-xs text-red-500">Failed to load notes</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      {/* Key forces remount if ID changes, ensuring fresh state */}
      <ScratchPadEditor
        key={note?.id || 'default'}
        initialContent={note?.content ?? ''}
      />
    </div>
  )
}
