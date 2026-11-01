'use client'

import * as React from 'react'
import { IconButton } from '@/components/ui/button'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
} from '@/components/ui/drawer'
import { Icon } from '@/components/ui/icon'
import { notebookApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import type { NotebookNote, UpdateNotebookNoteInput } from '@/types/notebook'

interface NoteDrawerProps {
  noteId: string | null
  todoTitle?: string
  open: boolean
  onClose: () => void
  onUnlink: () => void
}

function pickNewestNote(current: NotebookNote, incoming: NotebookNote) {
  return new Date(incoming.updatedAt).getTime() >=
    new Date(current.updatedAt).getTime()
    ? incoming
    : current
}

function updateCachedNote(queryClient: QueryClient, updatedNote: NotebookNote) {
  queryClient.setQueryData<NotebookNote>(
    queryKeys.notebookNote(updatedNote.id),
    (current) => (current ? pickNewestNote(current, updatedNote) : updatedNote),
  )
  queryClient.setQueryData<NotebookNote[]>(
    queryKeys.notebook,
    (currentNotes) => {
      if (!currentNotes) return currentNotes
      return currentNotes.map((note) =>
        note.id === updatedNote.id ? pickNewestNote(note, updatedNote) : note,
      )
    },
  )
}

function NoteDrawerEditor({ note }: { note: NotebookNote }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = React.useState(note.title)
  const [content, setContent] = React.useState(note.content)
  const saveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  const pendingUpdatesRef = React.useRef<UpdateNotebookNoteInput>({})

  const { mutate: saveUpdates } = useMutation({
    mutationFn: (updates: UpdateNotebookNoteInput) =>
      notebookApi.update(note.id, updates),
    onSuccess: (updatedNote) => {
      updateCachedNote(queryClient, updatedNote)
    },
    onError: (error) => {
      console.error('Failed to save note:', error)
    },
  })
  const saveUpdatesRef = React.useRef(saveUpdates)

  React.useEffect(() => {
    saveUpdatesRef.current = saveUpdates
  }, [saveUpdates])

  const flushPendingSave = React.useCallback(() => {
    const updates = pendingUpdatesRef.current
    pendingUpdatesRef.current = {}
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    if (Object.keys(updates).length > 0) {
      saveUpdatesRef.current(updates)
    }
  }, [])

  const saveNote = React.useCallback(
    (updates: UpdateNotebookNoteInput) => {
      pendingUpdatesRef.current = {
        ...pendingUpdatesRef.current,
        ...updates,
      }
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(flushPendingSave, 500)
    },
    [flushPendingSave],
  )

  React.useEffect(() => flushPendingSave, [flushPendingSave])

  const handleTitleChange = React.useCallback(
    (newTitle: string) => {
      setTitle(newTitle)
      saveNote({ title: newTitle })
    },
    [saveNote],
  )

  const handleContentChange = React.useCallback(
    (newContent: string) => {
      setContent(newContent)
      saveNote({ content: newContent })
    },
    [saveNote],
  )

  return (
    <>
      <input
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        className="dd-h3 text-text placeholder:text-quiet w-full flex-none bg-transparent text-lg leading-tight normal-case outline-none"
        placeholder="Note title"
        aria-label="Note title"
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <RichTextEditor
          value={content}
          onChange={handleContentChange}
          fullHeight
        />
      </div>
    </>
  )
}

export function NoteDrawer({
  noteId,
  todoTitle,
  open,
  onClose,
  onUnlink,
}: NoteDrawerProps) {
  const noteQuery = useQuery({
    queryKey: queryKeys.notebookNote(noteId ?? '__idle__'),
    queryFn: () => notebookApi.get(noteId as string),
    enabled: Boolean(open && noteId),
  })
  const isInitialLoading = noteQuery.isLoading && !noteQuery.data

  return (
    <Drawer
      open={open && Boolean(noteId)}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <DrawerContent
        size="lg"
        onOpenAutoFocus={(event) => {
          // Start on the panel itself, not on "Unlink note" (its first button).
          event.preventDefault()
          if (event.currentTarget instanceof HTMLElement) {
            event.currentTarget.focus()
          }
        }}
      >
        <DrawerHeader
          eyebrow="Linked note"
          title={<span className="line-clamp-2">{todoTitle || 'note'}</span>}
          actions={
            <IconButton icon="link" label="Unlink note" onClick={onUnlink} />
          }
        />
        <DrawerBody className="flex flex-col gap-3">
          {isInitialLoading ? (
            <span className="dd-loading" role="status">
              <span className="dd-spinner" aria-hidden="true" />
              Loading note
            </span>
          ) : noteQuery.data ? (
            <NoteDrawerEditor key={noteQuery.data.id} note={noteQuery.data} />
          ) : (
            <div className="dd-empty-state dd-empty-state--compact">
              <div className="dd-empty-state__icon">
                <Icon name="error" />
              </div>
              <p className="dd-empty-state__title">Couldn’t load the note</p>
              <p className="dd-empty-state__text">
                Close the drawer and open it again.
              </p>
            </div>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}
