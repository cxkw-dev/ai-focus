'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Unlink } from 'lucide-react'
import { notebookApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import type { NotebookNote, UpdateNotebookNoteInput } from '@/types/notebook'

interface NoteDrawerProps {
  noteId: string | null
  todoTitle?: string
  open: boolean
  onClose: () => void
  onUnlink: () => void
}

function pickNewestNote(current: NotebookNote, incoming: NotebookNote) {
  return new Date(incoming.updatedAt).getTime() >=
    new Date(current.updatedAt).getTime()
    ? incoming
    : current
}

function updateCachedNote(queryClient: QueryClient, updatedNote: NotebookNote) {
  queryClient.setQueryData<NotebookNote>(
    queryKeys.notebookNote(updatedNote.id),
    (current) => (current ? pickNewestNote(current, updatedNote) : updatedNote),
  )
  queryClient.setQueryData<NotebookNote[]>(
    queryKeys.notebook,
    (currentNotes) => {
      if (!currentNotes) return currentNotes
      return currentNotes.map((note) =>
        note.id === updatedNote.id ? pickNewestNote(note, updatedNote) : note,
      )
    },
  )
}

function NoteDrawerEditor({ note }: { note: NotebookNote }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = React.useState(note.title)
  const [content, setContent] = React.useState(note.content)
  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const pendingUpdatesRef = React.useRef<UpdateNotebookNoteInput>({})

  const { mutate: saveUpdates } = useMutation({
    mutationFn: (updates: UpdateNotebookNoteInput) =>
      notebookApi.update(note.id, updates),
    onSuccess: (updatedNote) => {
      updateCachedNote(queryClient, updatedNote)
    },
    onError: (error) => {
      console.error('Failed to save note:', error)
    },
  })
  const saveUpdatesRef = React.useRef(saveUpdates)

  React.useEffect(() => {
    saveUpdatesRef.current = saveUpdates
  }, [saveUpdates])

  const flushPendingSave = React.useCallback(() => {
    const updates = pendingUpdatesRef.current
    pendingUpdatesRef.current = {}
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    if (Object.keys(updates).length > 0) {
      saveUpdatesRef.current(updates)
    }
  }, [])

  const saveNote = React.useCallback(
    (updates: UpdateNotebookNoteInput) => {
      pendingUpdatesRef.current = {
        ...pendingUpdatesRef.current,
        ...updates,
      }
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(flushPendingSave, 500)
    },
    [flushPendingSave],
  )

  React.useEffect(() => flushPendingSave, [flushPendingSave])

  const handleTitleChange = React.useCallback(
    (newTitle: string) => {
      setTitle(newTitle)
      saveNote({ title: newTitle })
    },
    [saveNote],
  )

  const handleContentChange = React.useCallback(
    (newContent: string) => {
      setContent(newContent)
      saveNote({ content: newContent })
    },
    [saveNote],
  )

  return (
    <>
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

      <div className="flex min-h-0 flex-1 flex-col px-5 py-4">
        <RichTextEditor
          value={content}
          onChange={handleContentChange}
          fullHeight
        />
      </div>
    </>
  )
}

export function NoteDrawer({
  noteId,
  todoTitle,
  open,
  onClose,
  onUnlink,
}: NoteDrawerProps) {
  const drawerRef = React.useRef<HTMLDivElement>(null)

  const noteQuery = useQuery({
    queryKey: queryKeys.notebookNote(noteId ?? '__idle__'),
    queryFn: () => notebookApi.get(noteId as string),
    enabled: Boolean(open && noteId),
  })
  const isInitialLoading = noteQuery.isLoading && !noteQuery.data

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

            {isInitialLoading ? (
              <div className="flex min-h-0 flex-1 flex-col px-5 py-4">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Loading...
                </p>
              </div>
            ) : noteQuery.data ? (
              <NoteDrawerEditor key={noteQuery.data.id} note={noteQuery.data} />
            ) : (
              <div className="flex min-h-0 flex-1 flex-col px-5 py-4">
                <p className="text-xs text-red-500">Failed to load note.</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
