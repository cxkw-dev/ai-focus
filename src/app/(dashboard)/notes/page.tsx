'use client'

import * as React from 'react'
import { ArrowLeft, FileText } from 'lucide-react'
import { NotesSidebar } from '@/components/notes/notes-sidebar'
import { NoteEditor } from '@/components/notes/note-editor'
import { useNotebook } from '@/hooks/use-notebook'

export default function NotesPage() {
  const { notes, isLoading, create, update, saveContent, remove } = useNotebook()
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [mobileShowEditor, setMobileShowEditor] = React.useState(false)

  const selectedNote = React.useMemo(
    () => notes.find(n => n.id === selectedId) ?? null,
    [notes, selectedId]
  )

  // Clear selection if note was deleted
  React.useEffect(() => {
    if (selectedId && !notes.find(n => n.id === selectedId)) {
      setSelectedId(null)
      setMobileShowEditor(false)
    }
  }, [notes, selectedId])

  const handleCreate = React.useCallback(async () => {
    const newNote = await create.mutateAsync()
    setSelectedId(newNote.id)
    setMobileShowEditor(true)
  }, [create])

  const handleSelect = React.useCallback((id: string) => {
    setSelectedId(id)
    setMobileShowEditor(true)
  }, [])

  const handleDelete = React.useCallback((id: string) => {
    remove.mutate(id)
  }, [remove])

  const handleSaveContent = React.useCallback((id: string, content: string) => {
    saveContent.mutate({ id, content })
  }, [saveContent])

  const handleSaveTitle = React.useCallback((id: string, title: string) => {
    update.mutate({ id, data: { title } })
  }, [update])

  const handleBack = React.useCallback(() => {
    setMobileShowEditor(false)
  }, [])

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Desktop layout */}
      <div className="hidden lg:grid lg:grid-cols-[280px_1fr] h-full rounded-lg border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--surface)' }}>
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
            <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--text-muted)' }}>
              <FileText className="h-10 w-10 opacity-30" />
              <p className="text-sm">Select or create a note</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex flex-col h-full lg:hidden">
        {mobileShowEditor && selectedNote ? (
          <div className="flex flex-col h-full rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--surface)' }}>
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b"
              style={{ color: 'var(--primary)', borderColor: 'var(--border-color)' }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to notes
            </button>
            <div className="flex-1 min-h-0">
              <NoteEditor
                key={selectedNote.id}
                note={selectedNote}
                onSaveContent={handleSaveContent}
                onSaveTitle={handleSaveTitle}
              />
            </div>
          </div>
        ) : (
          <div className="h-full rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--surface)' }}>
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
