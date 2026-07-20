'use client'

import * as React from 'react'
import { todosApi } from '@/lib/api'
import type { Todo } from '@/types/todo'

interface OpenNote {
  todoId: string
  noteId: string
  todoTitle: string
}

interface UseTodoNoteDrawerParams {
  todos: Todo[]
  completedTodos: Todo[]
  deletedTodos: Todo[]
}

interface UseTodoNoteDrawerResult {
  openNote: OpenNote | null
  handleOpenNote: (todoId: string, noteId: string) => void
  handleUnlinkNote: () => Promise<void>
  closeNote: () => void
}

/**
 * Owns the note-drawer open/close state and the title lookup used to label it.
 * Unlinking clears the todo's notebook link, then closes the drawer.
 */
export function useTodoNoteDrawer({
  todos,
  completedTodos,
  deletedTodos,
}: UseTodoNoteDrawerParams): UseTodoNoteDrawerResult {
  const [openNote, setOpenNote] = React.useState<OpenNote | null>(null)

  const todoTitleById = React.useMemo(
    () =>
      new Map(
        [...todos, ...completedTodos, ...deletedTodos].map((todo) => [
          todo.id,
          todo.title,
        ]),
      ),
    [todos, completedTodos, deletedTodos],
  )

  const handleOpenNote = React.useCallback(
    (todoId: string, noteId: string) => {
      setOpenNote({
        todoId,
        noteId,
        todoTitle: todoTitleById.get(todoId) ?? 'Note',
      })
    },
    [todoTitleById],
  )

  const handleUnlinkNote = React.useCallback(async () => {
    if (!openNote) return
    await todosApi.update(openNote.todoId, { notebookNoteId: null })
    setOpenNote(null)
  }, [openNote])

  const closeNote = () => setOpenNote(null)

  return { openNote, handleOpenNote, handleUnlinkNote, closeNote }
}
