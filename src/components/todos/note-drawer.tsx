'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Unlink } from 'lucide-react'
import { notebookApi } from '@/lib/api'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { useQuery, useQueryClient } from '@tanstack/react-query'

interface NoteDrawerProps {
  noteId: string | null
  todoTitle?: string
  open: boolean
  onClose: () => void
  onUnlink: () => void
}

export function NoteDrawer({
  noteId,
  todoTitle,
  open,
  onClose,
  onUnlink,
}: NoteDrawerProps) {
  const drawerRef = React.useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const [title, setTitle] = React.useState('')
  const [content, setContent] = React.useState('')
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const noteQuery = useQuery({
    queryKey: ['notebook', noteId],
    queryFn: () => notebookApi.get(noteId as string),
    enabled: Boolean(open && noteId),
  })
  const isLoading = noteQuery.isLoading || noteQuery.isFetching

  // Seed local edit state when the fetched note changes.
  const loadedId = noteQuery.data?.id ?? null
  const [lastLoadedId, setLastLoadedId] = React.useState<string | null>(null)
  if (noteQuery.data && loadedId !== lastLoadedId) {
    setLastLoadedId(loadedId)
    setTitle(noteQuery.data.title)
    setContent(noteQuery.data.content)
  }

  // Debounced auto-save
  const saveNote = React.useCallback(
    (updates: { title?: string; content?: string }) => {
      if (!noteId) return
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(async () => {
        await notebookApi.update(noteId, updates)
        queryClient.invalidateQueries({ queryKey: ['notebook'] })
      }, 500)
    },
    [noteId, queryClient],
  )

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    saveNote({ title: newTitle })
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    saveNote({ content: newContent })
  }

  // Close on Escape
  React.useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && noteId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60]"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            onClick={onClose}
          />
          {/* Drawer panel */}
          <motion.div
            ref={drawerRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 right-0 bottom-0 z-[61] flex w-[720px] max-w-[90vw] flex-col"
            style={{
              backgroundColor: 'var(--surface)',
              borderLeft: '1px solid var(--border-color)',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
            }}
          >
            {/* Header */}
            <div
              className="flex shrink-0 items-center justify-between border-b px-5 py-3"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileText
                  className="h-4 w-4 shrink-0"
                  style={{ color: 'var(--primary)' }}
                />
                <span
                  className="truncate text-xs font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {todoTitle || 'Note'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onUnlink}
                  className="rounded-md p-1.5 transition-colors hover:bg-white/5"
                  title="Unlink note"
                >
                  <Unlink
                    className="h-3.5 w-3.5"
                    style={{ color: 'var(--text-muted)' }}
                  />
                </button>
                <button
                  onClick={onClose}
                  className="rounded-md p-1.5 transition-colors hover:bg-white/5"
                >
                  <X
                    className="h-3.5 w-3.5"
                    style={{ color: 'var(--text-muted)' }}
                  />
                </button>
              </div>
            </div>

            {/* Title */}
            <div
              className="border-b px-5 py-3"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold outline-none"
                style={{ color: 'var(--text-primary)' }}
                placeholder="Note title..."
              />
            </div>

            {/* Editor */}
            <div className="flex min-h-0 flex-1 flex-col px-5 py-4">
              {isLoading ? (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Loading...
                </p>
              ) : (
                <RichTextEditor
                  value={content}
                  onChange={handleContentChange}
                  fullHeight
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
