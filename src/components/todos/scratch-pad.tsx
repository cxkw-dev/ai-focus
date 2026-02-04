'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { useToast } from '@/components/ui/use-toast'
import type { Note } from '@/types/note'

interface ScratchPadProps {
  className?: string
}

function useScratchPadLogic(initialContent: string) {
  const [content, setContent] = React.useState(initialContent)
  const queryClient = useQueryClient()
  
  const { toast } = useToast()
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
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
      return res.json()
    },
    onSuccess: (savedNote) => {
      queryClient.setQueryData(['note'], savedNote)
      hasUnsavedChangesRef.current = false
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
  const handleChange = (newContent: string) => {
    // Update local state immediately
    setContent(newContent)
    latestContentRef.current = newContent
    hasUnsavedChangesRef.current = true

    // Debounce save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      mutation.mutate(newContent)
    }, 1000) // 1s debounce
  }

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
        }).catch(err => console.error('Unmount save failed:', err))
      }
    }
  }, [])

  return {
    content,
    handleChange,
    status: {
      isSaving: mutation.status === 'pending',
      hasUnsavedChanges: hasUnsavedChangesRef.current,
      saveError: mutation.status === 'error'
    }
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
    if (status.isSaving || status.hasUnsavedChanges) return 'var(--status-in-progress)'
    return 'var(--text-muted)'
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-1 h-4 rounded-full"
            style={{ backgroundColor: 'var(--status-waiting)' }}
          />
          <h2 className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--status-waiting)' }}>Scratch Pad</h2>
        </div>
        <span
          className="text-[10px] italic tracking-wide transition-colors duration-300"
          style={{ color: getStatusColor() }}
        >
          — {getStatusText().toLowerCase()}
        </span>
      </div>
      <div className="group/pad flex-1 min-h-0 relative">
        <div
          className="absolute -inset-px rounded-lg opacity-0 blur-sm transition-opacity duration-300 group-focus-within/pad:opacity-100"
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, var(--primary) 40%, transparent), color-mix(in srgb, var(--accent) 30%, transparent))`,
          }}
        />

        <div
          className="relative h-full rounded-lg overflow-hidden transition-all duration-300"
          style={{
            backgroundColor: 'var(--surface)',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle, var(--text-primary) 1px, transparent 1px)`,
              backgroundSize: '16px 16px',
              backgroundPosition: '8px 8px',
            }}
          />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, transparent 0%, transparent 85%, var(--surface) 100%)`,
            }}
          />

          <div className="relative w-full h-full px-4 py-3">
            <RichTextEditor
              value={content}
              onChange={handleChange}
              placeholder="Jot down quick notes..."
              fullHeight
            />
          </div>
        </div>
      </div>
    </>
  )
}

export function ScratchPad({ className = '' }: ScratchPadProps) {
  const { data: note, isLoading, isError } = useQuery({
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
      <div className={`flex flex-col min-h-0 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-muted animate-pulse" />
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="flex-1 rounded-lg bg-[var(--surface)] animate-pulse" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className={`flex flex-col min-h-0 ${className}`}>
        <div className="flex-1 flex items-center justify-center rounded-lg border border-dashed border-red-200 bg-red-50/10">
          <p className="text-xs text-red-500">Failed to load notes</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col min-h-0 ${className}`}>
      {/* Key forces remount if ID changes, ensuring fresh state */}
      <ScratchPadEditor 
        key={note?.id || 'default'} 
        initialContent={note?.content ?? ''} 
      />
    </div>
  )
}
