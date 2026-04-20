'use client'

import * as React from 'react'
import { ArrowLeft, FileText } from 'lucide-react'
import { NotesSidebar } from '@/components/notes/notes-sidebar'
import { NoteEditor } from '@/components/notes/note-editor'
import { useNotebook } from '@/hooks/use-notebook'

export default function NotesPage() {
  const { notes, isLoading, create, update, saveContent, remove } =
    useNotebook()
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [mobileShowEditor, setMobileShowEditor] = React.useState(false)

  const selectedNote = React.useMemo(
    () => notes.find((n) => n.id === selectedId) ?? null,
    [notes, selectedId],
  )

  const handleCreate = React.useCallback(async () => {
    try {
      const newNote = await create.mutateAsync()
      setSelectedId(newNote.id)
      setMobileShowEditor(true)
    } catch {
      // Error toast is handled in the mutation.
    }
  }, [create])

  const handleSelect = React.useCallback((id: string) => {
    setSelectedId(id)
    setMobileShowEditor(true)
  }, [])

  const handleDelete = React.useCallback(
    (id: string) => {
      remove.mutate(id)
    },
    [remove],
  )

  const handleSaveContent = React.useCallback(
    (id: string, content: string) => {
      saveContent.mutate({ id, content })
    },
    [saveContent],
  )

  const handleSaveTitle = React.useCallback(
    (id: string, title: string) => {
      update.mutate({ id, data: { title } })
    },
    [update],
  )

  const handleBack = React.useCallback(() => {
    setMobileShowEditor(false)
  }, [])

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col">
      {/* Desktop layout */}
      <div
        className="hidden h-full overflow-hidden rounded-lg border lg:grid lg:grid-cols-[280px_1fr]"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'var(--surface)',
        }}
      >
        <NotesSidebar
          notes={notes}
          selectedId={selectedId}
          onSelect={handleSelect}
          onCreate={handleCreate}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
        <div className="h-full min-h-0">
          {selectedNote ? (
            <NoteEditor
              key={selectedNote.id}
              note={selectedNote}
              onSaveContent={handleSaveContent}
              onSaveTitle={handleSaveTitle}
            />
          ) : (
            <div
              className="flex h-full flex-col items-center justify-center gap-4"
              style={{ color: 'var(--text-muted)' }}
            >
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor:
                    'color-mix(in srgb, var(--primary) 8%, transparent)',
                }}
              >
                <FileText
                  className="h-7 w-7"
                  style={{ color: 'var(--primary)', opacity: 0.6 }}
                />
              </div>
              <div className="text-center">
                <p
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)', opacity: 0.6 }}
                >
                  No note selected
                </p>
                <p className="mt-1 text-xs">
                  Pick a note from the sidebar or create a new one
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex h-full flex-col lg:hidden">
        {mobileShowEditor && selectedNote ? (
          <div
            className="flex h-full flex-col overflow-hidden rounded-lg border"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--surface)',
            }}
          >
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 border-b px-4 py-2.5 text-xs font-medium"
              style={{
                color: 'var(--primary)',
                borderColor: 'var(--border-color)',
              }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to notes
            </button>
            <div className="min-h-0 flex-1">
              <NoteEditor
                key={selectedNote.id}
                note={selectedNote}
                onSaveContent={handleSaveContent}
                onSaveTitle={handleSaveTitle}
              />
            </div>
          </div>
        ) : (
          <div
            className="h-full overflow-hidden rounded-lg border"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--surface)',
            }}
          >
            <NotesSidebar
              notes={notes}
              selectedId={selectedId}
              onSelect={handleSelect}
              onCreate={handleCreate}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  )
}
