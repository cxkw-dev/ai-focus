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
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
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
  BLOCKED: 'Blocked',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const STATUS_COLORS: Record<Status, string> = {
  TODO: 'var(--status-todo)',
  IN_PROGRESS: 'var(--status-in-progress)',
  WAITING: 'var(--status-waiting)',
  UNDER_REVIEW: 'var(--status-in-progress)',
  ON_HOLD: 'var(--status-on-hold)',
  BLOCKED: 'var(--status-blocked)',
  COMPLETED: 'var(--status-done)',
  CANCELLED: 'var(--status-on-hold)',
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

function TodoPreviewCard({
  todo,
}: {
  todo: NonNullable<NotebookNote['todo']>
}) {
  return (
    <div
      className="w-64 rounded-lg border p-3 shadow-lg"
      style={{
        backgroundColor: 'var(--surface-2)',
        borderColor: 'var(--border-color)',
      }}
    >
      <p
        className="mb-2 text-xs leading-snug font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        #{todo.taskNumber} {todo.title}
      </p>

      <div className="mb-2 flex items-center gap-2">
        <span
          className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
          style={{
            color: STATUS_COLORS[todo.status],
            backgroundColor: `color-mix(in srgb, ${STATUS_COLORS[todo.status]} 15%, transparent)`,
          }}
        >
          {STATUS_LABELS[todo.status]}
        </span>
        <span
          className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
          style={{
            color: PRIORITY_COLORS[todo.priority],
            backgroundColor: `color-mix(in srgb, ${PRIORITY_COLORS[todo.priority]} 15%, transparent)`,
          }}
        >
          {PRIORITY_LABELS[todo.priority]}
        </span>
      </div>

      {todo.dueDate && (
        <div className="mb-2 flex items-center gap-1.5">
          <Calendar
            className="h-3 w-3"
            style={{ color: 'var(--text-muted)' }}
          />
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {new Date(todo.dueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      )}

      {todo.labels.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <Tag
            className="h-3 w-3 shrink-0"
            style={{ color: 'var(--text-muted)' }}
          />
          {todo.labels.map((label) => (
            <span
              key={label.id}
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                color: label.color,
                backgroundColor: `color-mix(in srgb, ${label.color} 15%, transparent)`,
              }}
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
          className="shrink-0 cursor-default rounded px-1 text-[10px] font-medium"
          style={{
            color: 'var(--primary)',
            backgroundColor:
              'color-mix(in srgb, var(--primary) 12%, transparent)',
          }}
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

export function NotesSidebar({
  notes,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  isLoading,
}: NotesSidebarProps) {
  const [search, setSearch] = React.useState('')
  const [activeTab, setActiveTab] = React.useState<
    'notes' | 'tasks' | 'archived'
  >('notes')

  const { standaloneNotes, taskNotes, archivedNotes } = React.useMemo(() => {
    const standalone: NotebookNote[] = []
    const tasks: NotebookNote[] = []
    const archived: NotebookNote[] = []
    for (const n of notes) {
      if (
        n.todo &&
        (n.todo.status === 'COMPLETED' || n.todo.status === 'CANCELLED')
      ) {
        continue
      }
      if (n.archived) {
        archived.push(n)
      } else if (n.todo) {
        tasks.push(n)
      } else {
        standalone.push(n)
      }
    }
    return {
      standaloneNotes: standalone,
      taskNotes: tasks,
      archivedNotes: archived,
    }
  }, [notes])

  const filteredNotes = React.useMemo(() => {
    const source =
      activeTab === 'archived'
        ? archivedNotes
        : activeTab === 'tasks'
          ? taskNotes
          : standaloneNotes
    if (!search.trim()) return source
    const q = search.toLowerCase()
    return source.filter((n) => n.title.toLowerCase().includes(q))
  }, [standaloneNotes, taskNotes, archivedNotes, activeTab, search])

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    onDelete(id)
  }

  return (
    <div
      className="flex h-full flex-col border-r"
      style={{ borderColor: 'var(--border-color)' }}
    >
      {/* Header with tabs */}
      <div className="flex items-center justify-between gap-2 px-3 pt-4 pb-3">
        <div
          className="flex min-w-0 rounded-lg p-0.5"
          style={{
            backgroundColor:
              'color-mix(in srgb, var(--text-muted) 10%, transparent)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            style={{
              color:
                activeTab === 'notes'
                  ? 'var(--text-primary)'
                  : 'var(--text-muted)',
              backgroundColor:
                activeTab === 'notes' ? 'var(--surface-2)' : 'transparent',
            }}
          >
            Notes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            style={{
              color:
                activeTab === 'tasks'
                  ? 'var(--text-primary)'
                  : 'var(--text-muted)',
              backgroundColor:
                activeTab === 'tasks' ? 'var(--surface-2)' : 'transparent',
            }}
          >
            Tasks
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('archived')}
            className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            style={{
              color:
                activeTab === 'archived'
                  ? 'var(--text-primary)'
                  : 'var(--text-muted)',
              backgroundColor:
                activeTab === 'archived' ? 'var(--surface-2)' : 'transparent',
            }}
          >
            Archived
          </button>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="shrink-0 rounded-md p-1.5 transition-colors"
          style={{ color: 'var(--primary)' }}
          title="New note"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div
          className="flex items-center gap-2 rounded-md border px-2.5 py-1.5"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--background)',
          }}
        >
          <Search
            className="h-3.5 w-3.5 shrink-0"
            style={{ color: 'var(--text-muted)' }}
          />
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
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-md"
                style={{ backgroundColor: 'var(--surface-2)' }}
              />
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {search
                ? 'No notes found'
                : activeTab === 'archived'
                  ? 'No archived notes'
                  : activeTab === 'tasks'
                    ? 'No task notes yet'
                    : 'No notes yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredNotes.map((note) => {
              const isSelected = note.id === selectedId
              const preview = stripHtml(note.content).slice(0, 60)
              return (
                <div
                  key={note.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(note.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect(note.id)
                    }
                  }}
                  className="group relative w-full cursor-pointer overflow-hidden rounded-lg px-3 py-2.5 text-left transition-all duration-200"
                  style={{
                    backgroundColor: isSelected
                      ? 'color-mix(in srgb, var(--primary) 8%, transparent)'
                      : 'transparent',
                    boxShadow: isSelected
                      ? '0 0 12px color-mix(in srgb, var(--primary) 8%, transparent)'
                      : 'none',
                    opacity: note.archived ? 0.6 : 1,
                  }}
                >
                  {/* Gradient glow on selected */}
                  {isSelected && (
                    <div
                      className="pointer-events-none absolute inset-0 opacity-[0.07]"
                      style={{
                        background:
                          'linear-gradient(135deg, var(--primary), var(--accent))',
                      }}
                    />
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p
                          className="truncate text-xs font-medium"
                          style={
                            isSelected
                              ? {
                                  background:
                                    'linear-gradient(135deg, var(--primary), var(--accent))',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  backgroundClip: 'text',
                                }
                              : { color: 'var(--text-primary)' }
                          }
                        >
                          {(note.title || 'Untitled').toUpperCase()}
                        </p>
                        <TodoBadge note={note} />
                      </div>
                      {preview && (
                        <p
                          className="mt-0.5 truncate text-[11px]"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {preview}
                        </p>
                      )}
                      <p
                        className="mt-1 text-[10px]"
                        style={{ color: 'var(--text-muted)', opacity: 0.6 }}
                      >
                        {formatRelativeTime(note.updatedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, note.id)}
                      className="flex shrink-0 items-center justify-center rounded p-1 opacity-0 transition-all group-hover:opacity-100"
                      style={{ color: 'var(--text-muted)' }}
                      title="Delete note"
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
