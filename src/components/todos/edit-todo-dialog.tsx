'use client'

import * as React from 'react'
import {
  CalendarDays,
  Flame,
  Plus,
  Tags,
  TrendingUp,
  Users,
  Trash2,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { openLabelsRoute } from '@/lib/labels'
import { LabelMultiSelect } from './label-multi-select'
import { SessionList } from './session-list'
import { PrioritySelector } from './priority-selector'
import { EditTodoLinks } from './edit-todo-links'
import { EditTodoSubtasks } from './edit-todo-subtasks'
import { useLabels } from '@/hooks/use-labels'
import { useTodoContacts } from '@/hooks/use-todo-contacts'
import { useTodoForm } from '@/hooks/use-todo-form'
import { todosApi, notebookApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Todo, UpdateTodoInput, Status } from '@/types/todo'
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
  const { data: allNotes } = useQuery({
    queryKey: queryKeys.notebook,
    queryFn: () => notebookApi.list(),
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

  const isEditing = !!todo

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
      <DialogContent className="flex max-h-[90vh] w-[98vw] max-w-[1320px] flex-col overflow-hidden p-0 sm:max-h-[85vh] sm:w-[96vw]">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          {/* Header */}
          <div
            className="shrink-0 border-b px-4 py-4 sm:px-6 sm:py-5"
            style={{
              borderColor: 'var(--border-color)',
              background:
                'linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, transparent), color-mix(in srgb, var(--accent) 8%, transparent))',
            }}
          >
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-lg sm:text-xl">
                Edit Task
              </DialogTitle>
              <DialogDescription className="text-sm">
                Changes are saved when you close this dialog
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
            <div className="grid grid-cols-1 gap-0 md:grid-cols-[1fr_300px] md:gap-0">
              {/* Left column - Content */}
              <div className="space-y-4 md:pr-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="title"
                    className="text-xs font-semibold tracking-wide uppercase"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Task Title
                  </Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => form.setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    autoFocus
                    className="h-12 text-base font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    className="text-xs font-semibold tracking-wide uppercase"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Description
                  </Label>
                  <RichTextEditor
                    value={form.description}
                    onChange={form.setDescription}
                    placeholder="Add more details, links, or notes..."
                    disabled={isLoading}
                    mentions={people.map((p) => ({
                      id: p.id,
                      name: p.name,
                      email: p.email,
                    }))}
                  />
                </div>

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
                className="space-y-4 pt-6 md:border-l md:pt-0 md:pl-6"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {/* Status */}
                <div className="space-y-2">
                  <Label
                    htmlFor="status"
                    className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Status
                  </Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => form.setStatus(v as Status)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="WAITING">Waiting</SelectItem>
                      <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="BLOCKED">Blocked</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label
                    className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Flame className="h-3.5 w-3.5" />
                    Priority
                  </Label>
                  <PrioritySelector
                    value={form.priority}
                    onChange={(next) => form.setPriority(next)}
                    disabled={isLoading}
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label
                    htmlFor="dueDate"
                    className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    Due Date
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => form.setDueDate(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>

                {/* Labels */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Tags className="h-3.5 w-3.5" />
                      Labels
                    </Label>
                    <button
                      type="button"
                      onClick={handleManageLabels}
                      className="text-[11px] font-medium underline transition-all hover:no-underline"
                      style={{ color: 'var(--primary)' }}
                    >
                      Manage
                    </button>
                  </div>
                  <LabelMultiSelect
                    labels={labels}
                    value={form.labelIds}
                    onChange={form.setLabelIds}
                    onManage={handleManageLabels}
                    disabled={isLoading}
                    showQuickPick
                  />
                </div>

                {/* Connected Note */}
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
                        onClick={handleUnlinkNote}
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
                        onClick={handleCreateAndLinkNote}
                        className="w-full rounded border px-2 py-1.5 text-left text-[11px] transition-colors hover:bg-white/5"
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
                          onChange={(e) =>
                            handleLinkExistingNote(e.target.value)
                          }
                          className="w-full rounded border bg-transparent px-1.5 py-1 text-[11px] outline-none"
                          style={{
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-primary)',
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

                {/* Sessions */}
                {todo?.sessions && todo.sessions.length > 0 && (
                  <div className="space-y-2">
                    <SessionList
                      sessions={todo.sessions}
                      onDelete={handleDeleteSession}
                      compact
                    />
                  </div>
                )}

                {/* Contacts */}
                <div className="space-y-2">
                  <Label
                    className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Contacts
                  </Label>
                  <div className="space-y-0.5">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="group/contact flex items-center gap-1 rounded px-1.5 py-1 transition-colors hover:bg-white/5"
                        title={contact.person.email}
                      >
                        {editingContactId === contact.id ? (
                          <div className="flex min-w-0 flex-1 items-center gap-1">
                            <span
                              className="shrink-0 text-[11px] font-medium"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {contact.person.name.split(' ')[0]}
                            </span>
                            <span
                              className="text-[11px]"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              &middot;
                            </span>
                            <input
                              autoFocus
                              value={editingContactRole}
                              onChange={(e) =>
                                setEditingContactRole(e.target.value)
                              }
                              onBlur={() => {
                                if (editingContactRole.trim()) {
                                  updateContact({
                                    contactId: contact.id,
                                    data: { role: editingContactRole.trim() },
                                  })
                                }
                                setEditingContactId(null)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (editingContactRole.trim()) {
                                    updateContact({
                                      contactId: contact.id,
                                      data: { role: editingContactRole.trim() },
                                    })
                                  }
                                  setEditingContactId(null)
                                }
                                if (e.key === 'Escape')
                                  setEditingContactId(null)
                              }}
                              className="min-w-0 flex-1 border-b bg-transparent text-[11px] outline-none"
                              style={{
                                color: 'var(--primary)',
                                borderColor: 'var(--primary)',
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex min-w-0 flex-1 items-center gap-1">
                            <a
                              href={`https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(contact.person.email)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate text-[11px] font-medium hover:underline"
                              style={{ color: 'var(--text-primary)' }}
                              title={`Chat with ${contact.person.name} in Teams`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {contact.person.name}
                            </a>
                            <span
                              className="shrink-0 text-[11px]"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              &middot;
                            </span>
                            <button
                              type="button"
                              className="truncate text-[11px] italic hover:underline"
                              style={{ color: 'var(--primary)' }}
                              onClick={() => {
                                setEditingContactId(contact.id)
                                setEditingContactRole(contact.role)
                              }}
                              title="Click to edit role"
                            >
                              {contact.role}
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeContact(contact.id)}
                          className="shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover/contact:opacity-100"
                          style={{ color: 'var(--destructive)' }}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}

                    {/* Always-visible add */}
                    {people.filter(
                      (p: { id: string }) =>
                        !contacts.some((c) => c.personId === p.id),
                    ).length > 0 && (
                      <div className="space-y-1 pt-1">
                        <select
                          value={newContactPersonId}
                          onChange={(e) =>
                            setNewContactPersonId(e.target.value)
                          }
                          className="w-full rounded border bg-transparent px-1.5 py-1 text-[11px] outline-none"
                          style={{
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <option value="">Add contact...</option>
                          {people
                            .filter(
                              (p: { id: string }) =>
                                !contacts.some((c) => c.personId === p.id),
                            )
                            .map((p: { id: string; name: string }) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                        </select>
                        {newContactPersonId && (
                          <div className="flex gap-1">
                            <input
                              autoFocus
                              value={newContactRole}
                              onChange={(e) =>
                                setNewContactRole(e.target.value)
                              }
                              placeholder="Role"
                              onKeyDown={(e) => {
                                if (
                                  e.key === 'Enter' &&
                                  newContactRole.trim()
                                ) {
                                  addContact({
                                    personId: newContactPersonId,
                                    role: newContactRole.trim(),
                                  })
                                  setNewContactPersonId('')
                                  setNewContactRole('')
                                }
                              }}
                              className="min-w-0 flex-1 rounded border bg-transparent px-1.5 py-1 text-[11px] outline-none"
                              style={{
                                borderColor: 'var(--border-color)',
                                color: 'var(--text-primary)',
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newContactRole.trim()) {
                                  addContact({
                                    personId: newContactPersonId,
                                    role: newContactRole.trim(),
                                  })
                                  setNewContactPersonId('')
                                  setNewContactRole('')
                                }
                              }}
                              disabled={!newContactRole.trim()}
                              className="rounded p-1 transition-colors disabled:opacity-40"
                              style={{ color: 'var(--primary)' }}
                              title="Add contact"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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
