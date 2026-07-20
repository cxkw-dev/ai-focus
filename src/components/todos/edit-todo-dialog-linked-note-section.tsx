'use client'

import { FileText } from 'lucide-react'
import { Label } from '@/components/ui/label'
import type { NotebookNote } from '@/types/notebook'
import type { Todo } from '@/types/todo'

interface EditTodoDialogLinkedNoteSectionProps {
  todo?: Todo | null
  unlinkedNotes: NotebookNote[]
  onCreateAndLinkNote: () => void
  onLinkExistingNote: (noteId: string) => void
  onUnlinkNote: () => void
}

export function EditTodoDialogLinkedNoteSection({
  todo,
  unlinkedNotes,
  onCreateAndLinkNote,
  onLinkExistingNote,
  onUnlinkNote,
}: EditTodoDialogLinkedNoteSectionProps) {
  return (
    <div className="space-y-2">
      <Label
        className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
        style={{ color: 'var(--text-muted)' }}
      >
        <FileText className="h-3.5 w-3.5" />
        Connected Note
      </Label>
      {todo?.notebookNoteId ? (
        <div className="flex items-center gap-2">
          <span
            className="flex-1 truncate text-[11px]"
            style={{ color: 'var(--text-primary)' }}
          >
            {todo.notebookNote?.title || 'Untitled'}
          </span>
          <button
            type="button"
            onClick={onUnlinkNote}
            className="text-[11px] font-medium underline hover:no-underline"
            style={{ color: 'var(--destructive)' }}
          >
            Unlink
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          <button
            type="button"
            onClick={onCreateAndLinkNote}
            className="w-full rounded border px-2 py-1.5 text-left text-[11px] transition-colors hover:bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)]"
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            + Create new note
          </button>
          {unlinkedNotes.length > 0 && (
            <select
              value=""
              onChange={(e) => onLinkExistingNote(e.target.value)}
              className="w-full rounded border px-1.5 py-1 text-[11px] outline-none"
              style={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--surface)',
              }}
            >
              <option value="">Link existing note...</option>
              {unlinkedNotes.map((note) => (
                <option key={note.id} value={note.id}>
                  {note.title}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  )
}
