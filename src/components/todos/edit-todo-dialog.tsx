'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { openLabelsRoute } from '@/lib/labels'
import { EditTodoLinks } from './edit-todo-links'
import { EditTodoSubtasks } from './edit-todo-subtasks'
import { EditTodoDialogPrimaryFields } from './edit-todo-dialog-primary-fields'
import { EditTodoDialogMetaFields } from './edit-todo-dialog-meta-fields'
import { EditTodoDialogLabelsSection } from './edit-todo-dialog-labels-section'
import { EditTodoDialogLinkedNoteSection } from './edit-todo-dialog-linked-note-section'
import { EditTodoDialogSessionsSection } from './edit-todo-dialog-sessions-section'
import { EditTodoDialogContactsSection } from './edit-todo-dialog-contacts-section'
import { useLabels } from '@/hooks/use-labels'
import { useTodoContacts } from '@/hooks/use-todo-contacts'
import { useTodoForm } from '@/hooks/use-todo-form'
import { todosApi, notebookApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Todo, UpdateTodoInput } from '@/types/todo'
import type { Person } from '@/types/person'

interface EditTodoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (
    data: UpdateTodoInput,
    options?: { silent?: boolean; close?: boolean },
  ) => void
  todo?: Todo | null
  isLoading?: boolean
  people: Person[]
}

export function EditTodoDialog({
  open,
  onOpenChange,
  onSubmit,
  todo,
  isLoading,
  people,
}: EditTodoDialogProps) {
  const { labels } = useLabels()
  const form = useTodoForm(todo)
  const [newMyPrUrl, setNewMyPrUrl] = React.useState('')
  const [newPrUrl, setNewPrUrl] = React.useState('')
  const [newAzureDepUrl, setNewAzureDepUrl] = React.useState('')
  const [newMyIssueUrl, setNewMyIssueUrl] = React.useState('')
  const [newIssueUrl, setNewIssueUrl] = React.useState('')
  const handleManageLabels = React.useCallback(() => {
    openLabelsRoute()
  }, [])
  const { contacts, addContact, updateContact, removeContact } =
    useTodoContacts(todo?.id ?? '', !!todo)
  const [newContactPersonId, setNewContactPersonId] = React.useState('')
  const [newContactRole, setNewContactRole] = React.useState('')
  const [editingContactId, setEditingContactId] = React.useState<string | null>(
    null,
  )
  const [editingContactRole, setEditingContactRole] = React.useState('')
  const queryClient = useQueryClient()
  const isEditing = !!todo
  const shouldLoadNotebookNotes = open && isEditing
  const { data: allNotes } = useQuery({
    queryKey: queryKeys.notebook,
    queryFn: () => notebookApi.list(),
    enabled: shouldLoadNotebookNotes,
  })
  const unlinkedNotes = React.useMemo(
    () => (allNotes ?? []).filter((n) => !n.todo),
    [allNotes],
  )

  const handleCreateAndLinkNote = React.useCallback(async () => {
    if (!todo) return
    const note = await notebookApi.create({
      title: `Note for #${todo.taskNumber}`,
    })
    await todosApi.update(todo.id, { notebookNoteId: note.id })
    queryClient.invalidateQueries({ queryKey: queryKeys.todoBoard })
    queryClient.invalidateQueries({ queryKey: queryKeys.notebook })
  }, [todo, queryClient])

  const handleLinkExistingNote = React.useCallback(
    async (noteId: string) => {
      if (!noteId || !todo) return
      await todosApi.update(todo.id, { notebookNoteId: noteId })
      queryClient.invalidateQueries({ queryKey: queryKeys.todoBoard })
      queryClient.invalidateQueries({ queryKey: queryKeys.notebook })
    },
    [todo, queryClient],
  )

  const handleUnlinkNote = React.useCallback(async () => {
    if (!todo) return
    await todosApi.update(todo.id, { notebookNoteId: null })
    queryClient.invalidateQueries({ queryKey: queryKeys.todoBoard })
    queryClient.invalidateQueries({ queryKey: queryKeys.notebook })
  }, [todo, queryClient])

  const handleDeleteSession = React.useCallback(
    async (sessionId: string) => {
      await todosApi.deleteSession(sessionId)
      queryClient.invalidateQueries({ queryKey: queryKeys.todoBoard })
    },
    [queryClient],
  )

  const subtaskMentions = React.useMemo(
    () =>
      people.map((person) => ({
        id: person.id,
        name: person.name,
        email: person.email,
      })),
    [people],
  )
  const normalizeDescription = React.useCallback(
    (value: string | null | undefined) => {
      const trimmed = value?.trim()
      return trimmed ? trimmed : null
    },
    [],
  )

  // Save changes when dialog closes (escape, overlay click, close button)
  const handleClose = React.useCallback(() => {
    if (isEditing && todo && form.title.trim()) {
      const payload = {
        ...form.toPayload(),
        description: normalizeDescription(form.description),
      }
      // Include pending URLs that weren't explicitly added
      const pendingMyPr = newMyPrUrl.trim()
      if (pendingMyPr && !payload.myPrUrls.includes(pendingMyPr)) {
        payload.myPrUrls = [...payload.myPrUrls, pendingMyPr]
      }
      const pendingPr = newPrUrl.trim()
      if (pendingPr && !payload.githubPrUrls.includes(pendingPr)) {
        payload.githubPrUrls = [...payload.githubPrUrls, pendingPr]
      }
      const pendingAzure = newAzureDepUrl.trim()
      if (pendingAzure && !payload.azureDepUrls.includes(pendingAzure)) {
        payload.azureDepUrls = [...payload.azureDepUrls, pendingAzure]
      }
      const pendingMyIssue = newMyIssueUrl.trim()
      if (pendingMyIssue && !payload.myIssueUrls.includes(pendingMyIssue)) {
        payload.myIssueUrls = [...payload.myIssueUrls, pendingMyIssue]
      }
      const pendingIssue = newIssueUrl.trim()
      if (pendingIssue && !payload.githubIssueUrls.includes(pendingIssue)) {
        payload.githubIssueUrls = [...payload.githubIssueUrls, pendingIssue]
      }
      const original = JSON.stringify({
        title: todo.title.trim(),
        description: normalizeDescription(todo.description),
        priority: todo.priority,
        status: todo.status,
        dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString() : null,
        labelIds: todo.labels?.map((l) => l.id) ?? [],
        subtasks:
          todo.subtasks?.map((s, i) => ({
            id: s.id,
            title: s.title,
            completed: s.completed,
            order: i,
          })) ?? [],
        myPrUrls: todo.myPrUrls ?? [],
        githubPrUrls: todo.githubPrUrls ?? [],
        azureWorkItemUrl: todo.azureWorkItemUrl || null,
        azureDepUrls: todo.azureDepUrls ?? [],
        myIssueUrls: todo.myIssueUrls ?? [],
        githubIssueUrls: todo.githubIssueUrls ?? [],
      })
      if (JSON.stringify(payload) !== original) {
        onSubmit(payload)
        return
      }
    }
    onOpenChange(false)
  }, [
    isEditing,
    todo,
    form,
    onSubmit,
    onOpenChange,
    newMyPrUrl,
    newPrUrl,
    newAzureDepUrl,
    newMyIssueUrl,
    newIssueUrl,
    normalizeDescription,
  ])

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        handleClose()
      }
    },
    [handleClose],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[95vh] w-[98vw] max-w-[1320px] flex-col overflow-hidden p-0 sm:max-h-[90vh] sm:w-[96vw]">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* Header */}
          <div
            className="shrink-0 border-b px-4 py-4 pr-12 sm:px-6 sm:py-5 sm:pr-14"
            style={{
              borderColor: 'var(--border-color)',
              background:
                'linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, transparent), color-mix(in srgb, var(--accent) 8%, transparent))',
            }}
          >
            <DialogHeader className="min-w-0 space-y-1.5">
              <DialogTitle className="truncate text-lg sm:text-xl">
                Edit Task
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Changes are saved when you close this dialog
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-0">
              {/* Left column - Content */}
              <div className="min-w-0 space-y-4 lg:pr-6">
                <EditTodoDialogPrimaryFields
                  form={form}
                  people={people}
                  isLoading={isLoading}
                />

                <EditTodoSubtasks
                  subtasks={form.subtasks}
                  mentions={subtaskMentions}
                  onAddSubtask={form.addSubtask}
                  onMoveSubtask={form.moveSubtask}
                  onToggleSubtask={form.toggleSubtask}
                  onUpdateSubtaskTitle={form.updateSubtaskTitle}
                  onRemoveSubtask={form.removeSubtask}
                />

                <EditTodoLinks
                  form={form}
                  disabled={isLoading}
                  newAzureDepUrl={newAzureDepUrl}
                  setNewAzureDepUrl={setNewAzureDepUrl}
                  newMyPrUrl={newMyPrUrl}
                  setNewMyPrUrl={setNewMyPrUrl}
                  newPrUrl={newPrUrl}
                  setNewPrUrl={setNewPrUrl}
                  newMyIssueUrl={newMyIssueUrl}
                  setNewMyIssueUrl={setNewMyIssueUrl}
                  newIssueUrl={newIssueUrl}
                  setNewIssueUrl={setNewIssueUrl}
                />
              </div>

              {/* Right column - Meta */}
              <div
                className="min-w-0 space-y-4 border-t pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <EditTodoDialogMetaFields form={form} isLoading={isLoading} />

                <EditTodoDialogLabelsSection
                  labels={labels}
                  form={form}
                  onManageLabels={handleManageLabels}
                  disabled={isLoading}
                />

                <EditTodoDialogLinkedNoteSection
                  todo={todo}
                  unlinkedNotes={unlinkedNotes}
                  onCreateAndLinkNote={handleCreateAndLinkNote}
                  onLinkExistingNote={handleLinkExistingNote}
                  onUnlinkNote={handleUnlinkNote}
                />

                <EditTodoDialogSessionsSection
                  sessions={todo?.sessions}
                  onDeleteSession={handleDeleteSession}
                />

                <EditTodoDialogContactsSection
                  contacts={contacts}
                  people={people}
                  addContact={addContact}
                  updateContact={updateContact}
                  removeContact={removeContact}
                  newContactPersonId={newContactPersonId}
                  setNewContactPersonId={setNewContactPersonId}
                  newContactRole={newContactRole}
                  setNewContactRole={setNewContactRole}
                  editingContactId={editingContactId}
                  setEditingContactId={setEditingContactId}
                  editingContactRole={editingContactRole}
                  setEditingContactRole={setEditingContactRole}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="shrink-0 border-t px-4 py-3 sm:px-6 sm:py-4"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="h-10 px-5"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
