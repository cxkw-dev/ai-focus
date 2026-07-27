'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { Plus } from 'lucide-react'
import type { useTodoNoteDrawer } from '@/hooks/use-todo-note-drawer'
import type { Project } from '@/lib/projects'
import type { CreateTodoInput, Todo, UpdateTodoInput } from '@/types/todo'
import type { Person } from '@/types/person'

const EditTodoDialog = dynamic(
  () => import('./edit-todo-dialog').then((mod) => mod.EditTodoDialog),
  { ssr: false },
)

const CreateTodoModal = dynamic(
  () => import('./create-todo-modal').then((mod) => mod.CreateTodoModal),
  { ssr: false },
)

const NoteDrawer = dynamic(
  () => import('./note-drawer').then((mod) => mod.NoteDrawer),
  { ssr: false },
)

interface TodoDialogsProps {
  editingTodo: Todo | null
  isEditOpen: boolean
  onEditOpenChange: (open: boolean) => void
  onUpdate: (
    data: UpdateTodoInput,
    options?: { silent?: boolean; close?: boolean },
  ) => void
  /**
   * Omit the create trio on surfaces that don't create tasks (the overview).
   * Creation is always scoped to a project, so `createProject` comes with it.
   */
  isCreateOpen?: boolean
  onCreateOpenChange?: (open: boolean) => void
  onCreate?: (data: CreateTodoInput) => Promise<boolean>
  createProject?: Project
  isSaving?: boolean
  people: Person[]
  noteDrawer: ReturnType<typeof useTodoNoteDrawer>
}

/** Shared edit / create / note-drawer surfaces for any todo workspace. */
export function TodoDialogs({
  editingTodo,
  isEditOpen,
  onEditOpenChange,
  onUpdate,
  isCreateOpen,
  onCreateOpenChange,
  onCreate,
  createProject,
  isSaving,
  people,
  noteDrawer,
}: TodoDialogsProps) {
  return (
    <>
      {isEditOpen && editingTodo && (
        <EditTodoDialog
          open={isEditOpen}
          onOpenChange={onEditOpenChange}
          onSubmit={onUpdate}
          todo={editingTodo}
          isLoading={isSaving}
          people={people}
        />
      )}

      {isCreateOpen && onCreateOpenChange && onCreate && createProject && (
        <CreateTodoModal
          open={isCreateOpen}
          onOpenChange={onCreateOpenChange}
          onSubmit={onCreate}
          isLoading={isSaving}
          project={createProject}
          people={people}
        />
      )}

      {noteDrawer.openNote && (
        <NoteDrawer
          noteId={noteDrawer.openNote.noteId}
          todoTitle={noteDrawer.openNote.todoTitle}
          open={true}
          onClose={noteDrawer.closeNote}
          onUnlink={noteDrawer.handleUnlinkNote}
        />
      )}
    </>
  )
}

/** Floating "add task" button shared by the general list and project boards. */
export function AddTaskButton({
  onClick,
  label = 'Add Task',
}: {
  onClick: () => void
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group fixed right-4 bottom-4 z-50 flex items-center rounded-full transition-transform active:scale-95 sm:right-6 sm:bottom-6"
      style={{
        backgroundColor: 'var(--surface-2)',
        boxShadow:
          '0 4px 20px color-mix(in srgb, var(--background) 70%, transparent)',
      }}
      aria-label={label}
    >
      <span
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: 'var(--primary)',
          border: '3px solid var(--surface-2)',
        }}
      >
        <Plus
          className="h-5 w-5 group-hover:animate-[spin_0.5s_ease-in-out]"
          strokeWidth={2.5}
          style={{ color: 'var(--primary-foreground)' }}
        />
      </span>
      <span
        className="hidden pr-4 pl-2 text-xs font-semibold tracking-wide sm:inline"
        style={{ color: 'var(--text-primary)' }}
      >
        {label}
      </span>
    </button>
  )
}
