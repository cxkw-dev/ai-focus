'use client'

import * as React from 'react'
import { Plus, Search, Trash2 } from 'lucide-react'
import type { NotebookNote } from '@/types/notebook'

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

export function NotesSidebar({ notes, selectedId, onSelect, onCreate, onDelete, isLoading }: NotesSidebarProps) {
  const [search, setSearch] = React.useState('')
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null)

  const filteredNotes = React.useMemo(() => {
    if (!search.trim()) return notes
    const q = search.toLowerCase()
    return notes.filter(n => n.title.toLowerCase().includes(q))
  }, [notes, search])

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
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notes</h2>
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
              {search ? 'No notes found' : 'No notes yet'}
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
                      <p
                        className="text-xs font-medium truncate"
                        style={isSelected ? {
                          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        } : { color: 'var(--text-primary)' }}
                      >
                        {note.title || 'Untitled'}
                      </p>
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
