'use client'

import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Plus, Search, Trash2, Calendar, Tag } from 'lucide-react'
import type { NotebookNote } from '@/types/notebook'
import type { Status, Priority } from '@/types/todo'

interface NotesSidebarProps {
  notes: NotebookNote[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
  isLoading: boolean
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const STATUS_LABELS: Record<Status, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  WAITING: 'Waiting',
  UNDER_REVIEW: 'Under Review',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
}

const STATUS_COLORS: Record<Status, string> = {
  TODO: 'var(--status-todo)',
  IN_PROGRESS: 'var(--status-in-progress)',
  WAITING: 'var(--status-waiting)',
  UNDER_REVIEW: 'var(--status-in-progress)',
  ON_HOLD: 'var(--status-on-hold)',
  COMPLETED: 'var(--status-done)',
}

const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
}

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: 'var(--priority-low)',
  MEDIUM: 'var(--priority-medium)',
  HIGH: 'var(--priority-high)',
  URGENT: 'var(--priority-urgent)',
}

function TodoPreviewCard({ todo }: { todo: NonNullable<NotebookNote['todo']> }) {
  return (
    <div
      className="w-64 rounded-lg border p-3 shadow-lg"
      style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border-color)' }}
    >
      <p className="text-xs font-semibold mb-2 leading-snug" style={{ color: 'var(--text-primary)' }}>
        #{todo.taskNumber} {todo.title}
      </p>

      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
          style={{ color: STATUS_COLORS[todo.status], backgroundColor: `color-mix(in srgb, ${STATUS_COLORS[todo.status]} 15%, transparent)` }}
        >
          {STATUS_LABELS[todo.status]}
        </span>
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
          style={{ color: PRIORITY_COLORS[todo.priority], backgroundColor: `color-mix(in srgb, ${PRIORITY_COLORS[todo.priority]} 15%, transparent)` }}
        >
          {PRIORITY_LABELS[todo.priority]}
        </span>
      </div>

      {todo.dueDate && (
        <div className="flex items-center gap-1.5 mb-2">
          <Calendar className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {new Date(todo.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      )}

      {todo.labels.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <Tag className="h-3 w-3 shrink-0" style={{ color: 'var(--text-muted)' }} />
          {todo.labels.map(label => (
            <span
              key={label.id}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ color: label.color, backgroundColor: `color-mix(in srgb, ${label.color} 15%, transparent)` }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function TodoBadge({ note }: { note: NotebookNote }) {
  const [open, setOpen] = React.useState(false)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(null)

  if (!note.todo) return null

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 200)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <span
          className="text-[10px] font-medium px-1 rounded cursor-default shrink-0"
          style={{ color: 'var(--primary)', backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => e.stopPropagation()}
        >
          #{note.todo.taskNumber}
        </span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="right"
          sideOffset={8}
          align="start"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <TodoPreviewCard todo={note.todo} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export function NotesSidebar({ notes, selectedId, onSelect, onCreate, onDelete, isLoading }: NotesSidebarProps) {
  const [search, setSearch] = React.useState('')
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null)
  const [showArchived, setShowArchived] = React.useState(false)

  const { activeNotes, archivedNotes } = React.useMemo(() => {
    const active: NotebookNote[] = []
    const archived: NotebookNote[] = []
    for (const n of notes) {
      if (n.archived) archived.push(n)
      else active.push(n)
    }
    return { activeNotes: active, archivedNotes: archived }
  }, [notes])

  const filteredNotes = React.useMemo(() => {
    const source = showArchived ? archivedNotes : activeNotes
    if (!search.trim()) return source
    const q = search.toLowerCase()
    return source.filter(n => n.title.toLowerCase().includes(q))
  }, [activeNotes, archivedNotes, showArchived, search])

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirmDeleteId === id) {
      onDelete(id)
      setConfirmDeleteId(null)
    } else {
      setConfirmDeleteId(id)
    }
  }

  // Reset confirm state when clicking elsewhere
  React.useEffect(() => {
    if (!confirmDeleteId) return
    const handle = () => setConfirmDeleteId(null)
    const timer = setTimeout(handle, 3000)
    return () => clearTimeout(timer)
  }, [confirmDeleteId])

  return (
    <div className="flex flex-col h-full border-r" style={{ borderColor: 'var(--border-color)' }}>
      {/* Header with tabs */}
      <div className="px-3 pt-4 pb-3 flex items-center justify-between">
        <div
          className="flex rounded-lg p-0.5"
          style={{ backgroundColor: 'color-mix(in srgb, var(--text-muted) 10%, transparent)' }}
        >
          <button
            type="button"
            onClick={() => setShowArchived(false)}
            className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
            style={{
              color: !showArchived ? 'var(--text-primary)' : 'var(--text-muted)',
              backgroundColor: !showArchived ? 'var(--surface-2)' : 'transparent',
            }}
          >
            Notes
          </button>
          <button
            type="button"
            onClick={() => setShowArchived(true)}
            className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
            style={{
              color: showArchived ? 'var(--text-primary)' : 'var(--text-muted)',
              backgroundColor: showArchived ? 'var(--surface-2)' : 'transparent',
            }}
          >
            Archived
          </button>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="p-1.5 rounded-md transition-colors"
          style={{ color: 'var(--primary)' }}
          title="New note"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--background)' }}
        >
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-2">
        {isLoading ? (
          <div className="space-y-2 px-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-md animate-pulse" style={{ backgroundColor: 'var(--surface-2)' }} />
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {search ? 'No notes found' : showArchived ? 'No archived notes' : 'No notes yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredNotes.map(note => {
              const isSelected = note.id === selectedId
              const preview = stripHtml(note.content).slice(0, 60)
              return (
                <div
                  key={note.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(note.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(note.id) } }}
                  className="group w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 relative cursor-pointer overflow-hidden"
                  style={{
                    backgroundColor: isSelected ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'transparent',
                    boxShadow: isSelected ? '0 0 12px color-mix(in srgb, var(--primary) 8%, transparent)' : 'none',
                    opacity: note.archived ? 0.6 : 1,
                  }}
                >
                  {/* Gradient glow on selected */}
                  {isSelected && (
                    <div
                      className="absolute inset-0 pointer-events-none opacity-[0.07]"
                      style={{
                        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                      }}
                    />
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p
                          className="text-xs font-medium truncate"
                          style={isSelected ? {
                            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          } : { color: 'var(--text-primary)' }}
                        >
                          {(note.title || 'Untitled').toUpperCase()}
                        </p>
                        <TodoBadge note={note} />
                      </div>
                      {preview && (
                        <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {preview}
                        </p>
                      )}
                      <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                        {formatRelativeTime(note.updatedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, note.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all shrink-0"
                      style={{
                        color: confirmDeleteId === note.id ? 'var(--destructive)' : 'var(--text-muted)',
                        backgroundColor: confirmDeleteId === note.id ? 'color-mix(in srgb, var(--destructive) 15%, transparent)' : 'transparent',
                      }}
                      title={confirmDeleteId === note.id ? 'Click again to confirm' : 'Delete note'}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
