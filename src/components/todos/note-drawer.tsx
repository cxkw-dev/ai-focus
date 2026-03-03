'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Unlink } from 'lucide-react'
import { notebookApi } from '@/lib/api'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { useQueryClient } from '@tanstack/react-query'

interface NoteDrawerProps {
  noteId: string
  open: boolean
  onClose: () => void
  onUnlink: () => void
}

export function NoteDrawer({ noteId, open, onClose, onUnlink }: NoteDrawerProps) {
  const drawerRef = React.useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const [title, setTitle] = React.useState('')
  const [content, setContent] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Fetch note content when opened
  React.useEffect(() => {
    if (!open || !noteId) return
    setIsLoading(true)
    notebookApi.get(noteId).then((note) => {
      setTitle(note.title)
      setContent(note.content)
      setIsLoading(false)
    })
  }, [open, noteId])

  // Debounced auto-save
  const saveNote = React.useCallback((updates: { title?: string; content?: string }) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      await notebookApi.update(noteId, updates)
      queryClient.invalidateQueries({ queryKey: ['notebook'] })
    }, 500)
  }, [noteId, queryClient])

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

  // Close on click outside
  React.useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (target.closest('.todo-note-tab')) return
      if (drawerRef.current && !drawerRef.current.contains(target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={drawerRef}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="absolute top-0 right-0 bottom-0 z-30 overflow-hidden rounded-r-lg"
          style={{
            backgroundColor: 'var(--surface)',
            borderLeft: '1px solid var(--border-color)',
            boxShadow: '-4px 0 16px rgba(0,0,0,0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full w-[320px]">
            {/* Header */}
            <div
              className="flex items-center justify-between px-3 py-1.5 border-b shrink-0"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center gap-1.5">
                <FileText className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Note
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={onUnlink}
                  className="p-0.5 rounded transition-colors hover:bg-black/10"
                  title="Unlink note"
                >
                  <Unlink className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
                </button>
                <button
                  onClick={onClose}
                  className="p-0.5 rounded transition-colors hover:bg-black/10"
                >
                  <X className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="px-3 py-1.5 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full text-xs font-semibold bg-transparent outline-none"
                style={{ color: 'var(--text-primary)' }}
                placeholder="Note title..."
              />
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {isLoading ? (
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Loading...</p>
              ) : (
                <RichTextEditor
                  value={content}
                  onChange={handleContentChange}
                />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
