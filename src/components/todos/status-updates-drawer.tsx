'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Trash2, Send } from 'lucide-react'
import { useStatusUpdates } from '@/hooks/use-status-updates'
import type { Status } from '@/types/todo'

const STATUS_LABELS: Record<Status, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  WAITING: 'Waiting',
  UNDER_REVIEW: 'Under Review',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const STATUS_COLORS: Record<Status, string> = {
  TODO: 'var(--status-todo)',
  IN_PROGRESS: 'var(--status-in-progress)',
  WAITING: 'var(--status-waiting)',
  UNDER_REVIEW: 'var(--status-under-review)',
  ON_HOLD: 'var(--status-on-hold)',
  COMPLETED: 'var(--status-done)',
  CANCELLED: 'var(--status-on-hold)',
}

function formatTimestamp(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface StatusUpdatesDrawerProps {
  todoId: string
  open: boolean
  onClose: () => void
}

export function StatusUpdatesDrawer({
  todoId,
  open,
  onClose,
}: StatusUpdatesDrawerProps) {
  const { updates, isLoading, addUpdate, removeUpdate } = useStatusUpdates(
    todoId,
    open,
  )
  const [newContent, setNewContent] = React.useState('')
  const drawerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  const handleAdd = async () => {
    const text = newContent.trim()
    if (!text) return
    try {
      await addUpdate({ content: text })
      setNewContent('')
    } catch {
      // onError toast handles user feedback
    }
  }

  // Close on click outside
  React.useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (target.closest('.todo-timeline-tab')) return
      if (drawerRef.current && !drawerRef.current.contains(target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  React.useEffect(() => {
    if (!open) {
      setNewContent('')
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={drawerRef}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
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
          <div className="flex h-full w-[280px] flex-col">
            {/* Header */}
            <div
              className="flex shrink-0 items-center justify-between border-b px-3 py-1.5"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center gap-1.5">
                <Clock
                  className="h-3 w-3"
                  style={{ color: 'var(--text-muted)' }}
                />
                <span
                  className="text-[10px] font-semibold tracking-wide uppercase"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Timeline
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded p-0.5 transition-colors hover:bg-black/10"
              >
                <X className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {/* Timeline entries */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {isLoading && (
                <p
                  className="text-[11px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Loading...
                </p>
              )}
              {!isLoading && updates.length === 0 && (
                <p
                  className="text-[11px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  No updates yet.
                </p>
              )}
              {!isLoading && updates.length > 0 && (
                <div className="relative">
                  {/* Vertical line */}
                  <div
                    className="absolute top-2 bottom-2 left-[5px] w-px"
                    style={{ backgroundColor: 'var(--border-color)' }}
                  />
                  <div className="space-y-3">
                    {updates.map((update) => (
                      <div
                        key={update.id}
                        className="group/update relative pl-5"
                      >
                        {/* Dot */}
                        <div
                          className="absolute top-1.5 left-0 h-[11px] w-[11px] rounded-full border-2"
                          style={{
                            borderColor: update.status
                              ? (STATUS_COLORS[update.status as Status] ??
                                'var(--border-color)')
                              : 'var(--border-color)',
                            backgroundColor: update.status
                              ? (STATUS_COLORS[update.status as Status] ??
                                'var(--surface)')
                              : 'var(--surface)',
                          }}
                        />
                        <div className="min-w-0">
                          {/* Status badge */}
                          {update.status && (
                            <span
                              className="mb-1 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase"
                              style={{
                                backgroundColor: `color-mix(in srgb, ${STATUS_COLORS[update.status as Status] ?? 'var(--text-muted)'} 20%, transparent)`,
                                color:
                                  STATUS_COLORS[update.status as Status] ??
                                  'var(--text-muted)',
                              }}
                            >
                              {STATUS_LABELS[update.status as Status] ??
                                update.status}
                            </span>
                          )}
                          {/* Content */}
                          <p
                            className="text-[11px] leading-relaxed break-words"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {update.content}
                          </p>
                          {/* Timestamp + delete */}
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span
                              className="text-[10px]"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              {formatTimestamp(update.createdAt)}
                            </span>
                            <button
                              onClick={() => {
                                removeUpdate(update.id).catch(() => {})
                              }}
                              className="rounded p-0.5 opacity-0 transition-opacity group-hover/update:opacity-100"
                              title="Remove update"
                            >
                              <Trash2
                                className="h-2.5 w-2.5"
                                style={{ color: 'var(--destructive)' }}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Add update */}
            <div
              className="shrink-0 border-t px-3 py-2"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex gap-1.5">
                <textarea
                  ref={inputRef}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Add an update..."
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey))
                      handleAdd()
                  }}
                  className="flex-1 resize-none rounded border bg-transparent px-2 py-1.5 text-[11px] outline-none"
                  style={{
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  onClick={handleAdd}
                  disabled={!newContent.trim()}
                  className="self-end rounded p-1.5 transition-colors disabled:opacity-30"
                  style={{ color: 'var(--primary)' }}
                  title="Add update (⌘+Enter)"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
