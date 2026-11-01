'use client'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Select } from '@/components/ui/select'
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
    <div className="dd-field dd-field--above">
      <span className="dd-field__label">Connected note</span>
      {todo?.notebookNoteId ? (
        <div className="rounded-ctl bg-wash flex items-center gap-2 py-1 pr-1 pl-2.5">
          <Icon name="file" className="text-muted" />
          <span className="text-text min-w-0 flex-1 truncate text-sm">
            {todo.notebookNote?.title || 'Untitled'}
          </span>
          <Button variant="ghost" size="sm" onClick={onUnlinkNote}>
            Unlink
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Button onClick={onCreateAndLinkNote} className="justify-start">
            <Icon name="plus" />
            Create note
          </Button>
          {unlinkedNotes.length > 0 && (
            <Select
              value=""
              onChange={(e) => onLinkExistingNote(e.target.value)}
              aria-label="Link an existing note"
            >
              <option value="">Link an existing note…</option>
              {unlinkedNotes.map((note) => (
                <option key={note.id} value={note.id}>
                  {note.title}
                </option>
              ))}
            </Select>
          )}
        </div>
      )}
    </div>
  )
}
