'use client'

import * as React from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import {
  CalendarDays,
  Flame,
  Tags,
  TrendingUp,
  ListChecks,
  Plus,
  X,
  Square,
  CheckSquare,
  GripVertical,
  Users,
  Trash2,
  FileText,
} from 'lucide-react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { SubtaskMentionInput } from '@/components/ui/subtask-mention-input'
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
import { LabelMultiSelect, LabelManagerDialog } from './label-multi-select'
import { SessionList } from './session-list'
import { PrioritySelector } from './priority-selector'
import { SingleUrlField, UrlListField, AzureIcon, GitHubIcon } from './url-fields'
import { useLabels } from '@/hooks/use-labels'
import { useTodoContacts } from '@/hooks/use-todo-contacts'
import { useTodoForm } from '@/hooks/use-todo-form'
import { hasMeaningfulText, normalizeSubtaskTitle } from '@/lib/rich-text'
import { todosApi, notebookApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Todo, UpdateTodoInput, Status } from '@/types/todo'
import type { Person } from '@/types/person'

function getSubtaskDndId(subtaskId: string | undefined, index: number): string {
  return subtaskId ?? `new-subtask-${index}`
}

function SortableEditSubtaskRow({
  dndId,
  completed,
  title,
  onToggle,
  onTitleChange,
  onRemove,
  mentions,
}: {
  dndId: string
  completed: boolean
  title: string
  onToggle: () => void
  onTitleChange: (title: string) => void
  onRemove: () => void
  mentions: { id: string; name: string; email: string }[]
}) {
  const [isEditing, setIsEditing] = React.useState(false)
  const commitFxControls = useAnimationControls()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: dndId })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  const handleCommitFx = React.useCallback(() => {
    void commitFxControls.start({
      x: [0, -1.5, 1.5, -0.75, 0],
      transition: { duration: 0.24, ease: 'easeOut' },
    })
  }, [commitFxControls])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative py-0.5"
    >
      <motion.span
        className="absolute left-0 top-1/2 h-3 w-0.5 rounded-full pointer-events-none"
        animate={
          isEditing
            ? { opacity: [0.45, 1, 0.45], scaleY: [0.75, 1, 0.75] }
            : { opacity: 0, scaleY: 0.75 }
        }
        transition={
          isEditing
            ? { duration: 1.2, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }
            : { duration: 0.12, ease: 'easeOut' }
        }
        style={{ backgroundColor: 'var(--primary)' }}
      />
      <motion.div
        className="flex items-center gap-2 rounded pl-1 pr-0.5 transition-colors group/subtask hover:bg-white/5"
        animate={{
          backgroundColor: isEditing ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent',
          boxShadow: isEditing
            ? 'inset 0 0 0 1px color-mix(in srgb, var(--primary) 28%, transparent)'
            : 'inset 0 0 0 1px transparent',
          y: isEditing ? -0.5 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.6 }}
      >
        <motion.div className="flex items-center gap-2 w-full min-w-0" animate={commitFxControls}>
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded transition-colors"
            style={{
              color: 'var(--text-muted)',
              opacity: isDragging ? 1 : 0.6,
            }}
            aria-label="Reorder subtask"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="flex-shrink-0 transition-colors"
            style={{ color: completed ? 'var(--status-done)' : 'var(--text-muted)' }}
          >
            {completed ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>
          <SubtaskMentionInput
            value={title}
            onChange={onTitleChange}
            onCommit={handleCommitFx}
            onFocusChange={setIsEditing}
            mentions={mentions}
            completed={completed}
            className={completed ? 'flex-1 text-sm text-[var(--text-muted)]' : 'flex-1 text-sm text-[var(--text-primary)]'}
            ariaLabel="Subtask title"
          />
          <motion.span
            className="text-[9px] uppercase tracking-wide font-semibold flex-shrink-0"
            animate={{ opacity: isEditing ? 1 : 0, x: isEditing ? 0 : -2 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            style={{ color: 'var(--primary)' }}
          >
            editing
          </motion.span>
          <button
            type="button"
            onClick={onRemove}
            className="flex-shrink-0 opacity-0 group-hover/subtask:opacity-100 transition-opacity"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}

interface EditTodoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (
    data: UpdateTodoInput,
    options?: { silent?: boolean; close?: boolean }
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
  const { labels, handleCreate: onCreateLabel, handleUpdate: onUpdateLabel, handleDelete: onDeleteLabel } = useLabels()
  const form = useTodoForm(todo)
  const [isLabelManagerOpen, setIsLabelManagerOpen] = React.useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('')
  const [newMyPrUrl, setNewMyPrUrl] = React.useState('')
  const [newPrUrl, setNewPrUrl] = React.useState('')
  const [newAzureDepUrl, setNewAzureDepUrl] = React.useState('')
  const [newMyIssueUrl, setNewMyIssueUrl] = React.useState('')
  const [newIssueUrl, setNewIssueUrl] = React.useState('')
  const { contacts, addContact, updateContact, removeContact } = useTodoContacts(
    todo?.id ?? '',
    !!todo
  )
  const [newContactPersonId, setNewContactPersonId] = React.useState('')
  const [newContactRole, setNewContactRole] = React.useState('')
  const [editingContactId, setEditingContactId] = React.useState<string | null>(null)
  const [editingContactRole, setEditingContactRole] = React.useState('')
  const queryClient = useQueryClient()
  const { data: allNotes } = useQuery({
    queryKey: queryKeys.notebook,
    queryFn: () => notebookApi.list(),
  })
  const unlinkedNotes = React.useMemo(
    () => (allNotes ?? []).filter(n => !n.todo),
    [allNotes]
  )

  const handleCreateAndLinkNote = React.useCallback(async () => {
    if (!todo) return
    const note = await notebookApi.create({ title: `Note for #${todo.taskNumber}` })
    await todosApi.update(todo.id, { notebookNoteId: note.id })
    queryClient.invalidateQueries({ queryKey: queryKeys.todoBoard })
    queryClient.invalidateQueries({ queryKey: queryKeys.notebook })
  }, [todo, queryClient])

  const handleLinkExistingNote = React.useCallback(async (noteId: string) => {
    if (!noteId || !todo) return
    await todosApi.update(todo.id, { notebookNoteId: noteId })
    queryClient.invalidateQueries({ queryKey: queryKeys.todoBoard })
    queryClient.invalidateQueries({ queryKey: queryKeys.notebook })
  }, [todo, queryClient])

  const handleUnlinkNote = React.useCallback(async () => {
    if (!todo) return
    await todosApi.update(todo.id, { notebookNoteId: null })
    queryClient.invalidateQueries({ queryKey: queryKeys.todoBoard })
    queryClient.invalidateQueries({ queryKey: queryKeys.notebook })
  }, [todo, queryClient])

  const handleDeleteSession = React.useCallback(async (sessionId: string) => {
    await todosApi.deleteSession(sessionId)
    queryClient.invalidateQueries({ queryKey: queryKeys.todoBoard })
  }, [queryClient])

  const subtaskMentions = React.useMemo(
    () => people.map((person) => ({ id: person.id, name: person.name, email: person.email })),
    [people]
  )
  const subtaskSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  const normalizeDescription = React.useCallback((value: string | null | undefined) => {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
  }, [])

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
        labelIds: todo.labels?.map(l => l.id) ?? [],
        subtasks: todo.subtasks?.map((s, i) => ({
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
  }, [isEditing, todo, form, onSubmit, onOpenChange, newMyPrUrl, newPrUrl, newAzureDepUrl, newMyIssueUrl, newIssueUrl, normalizeDescription])

  const handleAddSubtask = React.useCallback(() => {
    const normalized = normalizeSubtaskTitle(newSubtaskTitle)
    if (!hasMeaningfulText(normalized)) return
    form.addSubtask(normalized)
    setNewSubtaskTitle('')
  }, [newSubtaskTitle, form])

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      handleClose()
    }
  }, [handleClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handleSubtaskDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeIndex = form.subtasks.findIndex((subtask, index) =>
      getSubtaskDndId(subtask.id, index) === active.id
    )
    const overIndex = form.subtasks.findIndex((subtask, index) =>
      getSubtaskDndId(subtask.id, index) === over.id
    )

    if (activeIndex !== -1 && overIndex !== -1) {
      form.moveSubtask(activeIndex, overIndex)
    }
  }, [form])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[98vw] sm:w-[96vw] max-w-[1320px] max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div
            className="px-4 sm:px-6 py-4 sm:py-5 border-b shrink-0"
            style={{
              borderColor: 'var(--border-color)',
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, transparent), color-mix(in srgb, var(--accent) 8%, transparent))',
            }}
          >
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-lg sm:text-xl">Edit Task</DialogTitle>
              <DialogDescription className="text-sm">
                Changes are saved when you close this dialog
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-0 md:gap-0">
              {/* Left column - Content */}
              <div className="space-y-4 md:pr-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
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
                  <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Description
                  </Label>
                  <RichTextEditor
                    value={form.description}
                    onChange={form.setDescription}
                    placeholder="Add more details, links, or notes..."
                    disabled={isLoading}
                    mentions={people.map(p => ({ id: p.id, name: p.name, email: p.email }))}
                  />
                </div>

                {/* Subtasks */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <ListChecks className="h-3.5 w-3.5" />
                    Subtasks
                    {form.subtasks.length > 0 && (
                      <span className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>
                        {form.subtasks.filter(s => s.completed).length}/{form.subtasks.length}
                      </span>
                    )}
                  </Label>
                  <div className="space-y-1">
                    <DndContext
                      sensors={subtaskSensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleSubtaskDragEnd}
                    >
                      <SortableContext
                        items={form.subtasks.map((subtask, index) => getSubtaskDndId(subtask.id, index))}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-1">
                          {form.subtasks.map((subtask, index) => (
                            <SortableEditSubtaskRow
                              key={getSubtaskDndId(subtask.id, index)}
                              dndId={getSubtaskDndId(subtask.id, index)}
                              completed={!!subtask.completed}
                              title={subtask.title}
                              onToggle={() => form.toggleSubtask(index)}
                              onTitleChange={(title) => form.updateSubtaskTitle(index, title)}
                              onRemove={() => form.removeSubtask(index)}
                              mentions={subtaskMentions}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                      <SubtaskMentionInput
                        value={newSubtaskTitle}
                        onChange={setNewSubtaskTitle}
                        onCommit={handleAddSubtask}
                        commitOnBlur={false}
                        mentions={subtaskMentions}
                        placeholder="Add a subtask..."
                        className="flex-1 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Links & Integrations - below subtasks, uses empty left column space */}
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                  {/* Azure */}
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                      <AzureIcon className="h-3.5 w-3.5" />
                      Azure
                    </Label>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>My Work Item</span>
                      <SingleUrlField
                        value={form.azureWorkItemUrl}
                        onChange={form.setAzureWorkItemUrl}
                        type="azure"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Waiting On</span>
                      <UrlListField
                        type="azure"
                        urls={form.azureDepUrls}
                        onAdd={(url) => form.addAzureDepUrl(url)}
                        onRemove={(i) => form.removeAzureDepUrl(i)}
                        inputValue={newAzureDepUrl}
                        onInputChange={setNewAzureDepUrl}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* GitHub */}
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                      <GitHubIcon className="h-3.5 w-3.5" />
                      GitHub PRs
                    </Label>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>My PRs</span>
                      <UrlListField
                        type="github"
                        urls={form.myPrUrls}
                        onAdd={(url) => form.addMyPrUrl(url)}
                        onRemove={(i) => form.removeMyPrUrl(i)}
                        inputValue={newMyPrUrl}
                        onInputChange={setNewMyPrUrl}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Waiting On</span>
                      <UrlListField
                        type="github"
                        urls={form.githubPrUrls}
                        onAdd={(url) => form.addGithubPrUrl(url)}
                        onRemove={(i) => form.removeGithubPrUrl(i)}
                        inputValue={newPrUrl}
                        onInputChange={setNewPrUrl}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* GitHub Issues */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2 mb-2" style={{ color: 'var(--text-muted)' }}>
                      <GitHubIcon className="h-3.5 w-3.5" />
                      My Issues
                    </Label>
                    <UrlListField
                      type="github-issue"
                      urls={form.myIssueUrls}
                      onAdd={(url) => form.addMyIssueUrl(url)}
                      onRemove={(i) => form.removeMyIssueUrl(i)}
                      inputValue={newMyIssueUrl}
                      onInputChange={setNewMyIssueUrl}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2 mb-2" style={{ color: 'var(--text-muted)' }}>
                      <GitHubIcon className="h-3.5 w-3.5" />
                      Waiting On Issues
                    </Label>
                    <UrlListField
                      type="github-issue"
                      urls={form.githubIssueUrls}
                      onAdd={(url) => form.addGithubIssueUrl(url)}
                      onRemove={(i) => form.removeGithubIssueUrl(i)}
                      inputValue={newIssueUrl}
                      onInputChange={setNewIssueUrl}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Right column - Meta */}
              <div
                className="pt-6 md:pt-0 md:pl-6 md:border-l space-y-4"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <TrendingUp className="h-3.5 w-3.5" />
                    Status
                  </Label>
                  <Select value={form.status} onValueChange={(v) => form.setStatus(v as Status)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="WAITING">Waiting</SelectItem>
                      <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
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
                  <Label htmlFor="dueDate" className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
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
                    <Label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                      <Tags className="h-3.5 w-3.5" />
                      Labels
                    </Label>
                    <button
                      type="button"
                      onClick={() => setIsLabelManagerOpen(true)}
                      className="text-[11px] font-medium underline hover:no-underline transition-all"
                      style={{ color: 'var(--primary)' }}
                    >
                      Manage
                    </button>
                  </div>
                  <LabelMultiSelect
                    labels={labels}
                    value={form.labelIds}
                    onChange={form.setLabelIds}
                    onManage={() => setIsLabelManagerOpen(true)}
                    disabled={isLoading}
                    showQuickPick
                  />
                </div>

                {/* Connected Note */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <FileText className="h-3.5 w-3.5" />
                    Connected Note
                  </Label>
                  {todo?.notebookNoteId ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
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
                        className="w-full text-[11px] rounded px-2 py-1.5 border transition-colors hover:bg-white/5 text-left"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      >
                        + Create new note
                      </button>
                      {unlinkedNotes.length > 0 && (
                        <select
                          value=""
                          onChange={(e) => handleLinkExistingNote(e.target.value)}
                          className="w-full text-[11px] rounded px-1.5 py-1 bg-transparent border outline-none"
                          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        >
                          <option value="">Link existing note...</option>
                          {unlinkedNotes.map((note) => (
                            <option key={note.id} value={note.id}>{note.title}</option>
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
                  <Label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <Users className="h-3.5 w-3.5" />
                    Contacts
                  </Label>
                  <div className="space-y-0.5">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center gap-1 rounded px-1.5 py-1 group/contact hover:bg-white/5 transition-colors"
                        title={contact.person.email}
                      >
                        {editingContactId === contact.id ? (
                          <div className="flex-1 flex items-center gap-1 min-w-0">
                            <span className="text-[11px] font-medium shrink-0" style={{ color: 'var(--text-primary)' }}>
                              {contact.person.name.split(' ')[0]}
                            </span>
                            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>&middot;</span>
                            <input
                              autoFocus
                              value={editingContactRole}
                              onChange={(e) => setEditingContactRole(e.target.value)}
                              onBlur={() => {
                                if (editingContactRole.trim()) {
                                  updateContact({ contactId: contact.id, data: { role: editingContactRole.trim() } })
                                }
                                setEditingContactId(null)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (editingContactRole.trim()) {
                                    updateContact({ contactId: contact.id, data: { role: editingContactRole.trim() } })
                                  }
                                  setEditingContactId(null)
                                }
                                if (e.key === 'Escape') setEditingContactId(null)
                              }}
                              className="flex-1 min-w-0 text-[11px] bg-transparent border-b outline-none"
                              style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
                            />
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center gap-1 min-w-0">
                            <a
                              href={`https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(contact.person.email)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-medium truncate hover:underline"
                              style={{ color: 'var(--text-primary)' }}
                              title={`Chat with ${contact.person.name} in Teams`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {contact.person.name}
                            </a>
                            <span className="text-[11px] shrink-0" style={{ color: 'var(--text-muted)' }}>&middot;</span>
                            <button
                              type="button"
                              className="text-[11px] truncate italic hover:underline"
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
                          className="p-0.5 rounded opacity-0 group-hover/contact:opacity-100 transition-opacity shrink-0"
                          style={{ color: 'var(--destructive)' }}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}

                    {/* Always-visible add */}
                    {people.filter((p: { id: string }) => !contacts.some(c => c.personId === p.id)).length > 0 && (
                      <div className="pt-1 space-y-1">
                        <select
                          value={newContactPersonId}
                          onChange={(e) => setNewContactPersonId(e.target.value)}
                          className="w-full text-[11px] rounded px-1.5 py-1 bg-transparent border outline-none"
                          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                        >
                          <option value="">Add contact...</option>
                          {people
                            .filter((p: { id: string }) => !contacts.some(c => c.personId === p.id))
                            .map((p: { id: string; name: string }) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        {newContactPersonId && (
                          <div className="flex gap-1">
                            <input
                              autoFocus
                              value={newContactRole}
                              onChange={(e) => setNewContactRole(e.target.value)}
                              placeholder="Role"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && newContactRole.trim()) {
                                  addContact({ personId: newContactPersonId, role: newContactRole.trim() })
                                  setNewContactPersonId('')
                                  setNewContactRole('')
                                }
                              }}
                              className="flex-1 text-[11px] rounded px-1.5 py-1 bg-transparent border outline-none min-w-0"
                              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newContactRole.trim()) {
                                  addContact({ personId: newContactPersonId, role: newContactRole.trim() })
                                  setNewContactPersonId('')
                                  setNewContactRole('')
                                }
                              }}
                              disabled={!newContactRole.trim()}
                              className="p-1 rounded disabled:opacity-40 transition-colors"
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
            className="px-4 sm:px-6 py-3 sm:py-4 border-t shrink-0"
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
      <LabelManagerDialog
        open={isLabelManagerOpen}
        onOpenChange={setIsLabelManagerOpen}
        labels={labels}
        onCreateLabel={onCreateLabel}
        onUpdateLabel={onUpdateLabel}
        onDeleteLabel={onDeleteLabel}
        disabled={isLoading}
      />
    </Dialog>
  )
}
