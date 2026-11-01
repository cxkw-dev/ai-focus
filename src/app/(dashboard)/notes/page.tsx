'use client'

import * as React from 'react'
import { NotesSidebar } from '@/components/notes/notes-sidebar'
import { NoteEditor } from '@/components/notes/note-editor'
import { ScratchPad } from '@/components/todos/scratch-pad'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { useNotebook } from '@/hooks/use-notebook'
import { cn } from '@/lib/utils'

/**
 * The notebook: a two-pane workspace. The list sits on the page; the open note (or the scratch pad) sits on a tonal
 * surface beside it. Under `lg` the panes take turns: the list, or the open note with a way back.
 */
export default function NotesPage() {
  const { notes, isLoading, create, update, saveContent, remove } =
    useNotebook()
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [showScratchPad, setShowScratchPad] = React.useState(true)
  const [mobileShowEditor, setMobileShowEditor] = React.useState(true)

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null
  // Small screens show the open pane only while there is something in it; otherwise the list.
  const showPaneOnMobile =
    mobileShowEditor && (showScratchPad || selectedNote !== null)

  const handleCreate = async () => {
    try {
      const newNote = await create.mutateAsync()
      setShowScratchPad(false)
      setSelectedId(newNote.id)
      setMobileShowEditor(true)
    } catch {
      // Error toast is handled in the mutation.
    }
  }

  const handleSelect = (id: string) => {
    setShowScratchPad(false)
    setSelectedId(id)
    setMobileShowEditor(true)
  }

  const handleOpenScratchPad = () => {
    setShowScratchPad(true)
    setSelectedId(null)
    setMobileShowEditor(true)
  }

  const handleSaveContent = (id: string, content: string) => {
    saveContent.mutate({ id, content })
  }

  const handleSaveTitle = (id: string, title: string) => {
    update.mutate({ id, data: { title } })
  }

  return (
    <div className="flex min-h-0 flex-1 gap-4 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
      <NotesSidebar
        className={cn('flex-1 lg:pt-1', showPaneOnMobile && 'max-lg:hidden')}
        notes={notes}
        selectedId={selectedId}
        isScratchPadActive={showScratchPad}
        onSelect={handleSelect}
        onCreate={handleCreate}
        onDelete={(id) => remove.mutate(id)}
        onOpenScratchPad={handleOpenScratchPad}
        isLoading={isLoading}
      />

      <section
        aria-label={
          showScratchPad ? 'Scratch pad' : (selectedNote?.title ?? 'Note')
        }
        className={cn(
          'bg-surface flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg',
          !showPaneOnMobile && 'max-lg:hidden',
        )}
      >
        <div className="px-2 pt-2 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileShowEditor(false)}
          >
            <Icon name="arrow-left" />
            Back to notes
          </Button>
        </div>

        <div className="min-h-0 flex-1">
          {showScratchPad ? (
            <div className="flex h-full min-h-0 flex-col p-3">
              <ScratchPad className="h-full" />
            </div>
          ) : selectedNote ? (
            <NoteEditor
              key={selectedNote.id}
              note={selectedNote}
              onSaveContent={handleSaveContent}
              onSaveTitle={handleSaveTitle}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-4">
              <div className="dd-empty-state">
                <div className="dd-empty-state__icon">
                  <Icon name="file" />
                </div>
                <h2 className="dd-empty-state__title">No note selected</h2>
                <p className="dd-empty-state__text">
                  Pick a note from the list or create a new one.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
