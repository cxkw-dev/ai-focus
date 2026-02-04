'use client'

import * as React from 'react'
import {
  CalendarDays,
  ChevronUp,
  Flame,
  Loader2,
  Minus,
  Plus,
  Tag,
  Tags,
  TrendingUp,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LabelManager } from '@/components/settings/label-manager'
import { PrioritySelector } from './priority-selector'
import type { Todo, CreateTodoInput, UpdateTodoInput, Priority, Status, Category, Label as TodoLabel } from '@/types/todo'

interface LabelManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  labels: TodoLabel[]
  onCreateLabel: (data: Pick<TodoLabel, 'name' | 'color'>) => Promise<boolean>
  onUpdateLabel: (id: string, data: Partial<Pick<TodoLabel, 'name' | 'color'>>) => Promise<boolean>
  onDeleteLabel: (id: string) => Promise<boolean>
  disabled?: boolean
}

function LabelManagerDialog({
  open,
  onOpenChange,
  labels,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
  disabled,
}: LabelManagerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden">
        <div
          className="px-6 py-5 border-b"
          style={{
            borderColor: 'var(--border-color)',
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--primary) 18%, transparent), color-mix(in srgb, var(--accent) 18%, transparent))',
          }}
        >
          <DialogHeader className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-lg font-semibold">Label Studio</DialogTitle>
              <div
                className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--surface-2) 70%, transparent)',
                  color: 'var(--text-muted)',
                }}
              >
                {labels.length} total
              </div>
            </div>
            <DialogDescription>
              Craft reusable labels for your tasks. Colors show up as chips on the card.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6">
          <LabelManager
            labels={labels}
            onCreateLabel={onCreateLabel}
            onUpdateLabel={onUpdateLabel}
            onDeleteLabel={onDeleteLabel}
            disabled={disabled}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface LabelMultiSelectProps {
  labels: TodoLabel[]
  value: string[]
  onChange: (value: string[]) => void
  onManage: () => void
  disabled?: boolean
  showChips?: boolean
  showQuickPick?: boolean
}

function LabelMultiSelect({
  labels,
  value,
  onChange,
  onManage,
  disabled,
  showChips = true,
  showQuickPick = false,
}: LabelMultiSelectProps) {
  const selected = new Set(value)
  const selectedLabels = labels.filter((label) => selected.has(label.id))

  const toggleLabel = (id: string) => {
    const next = new Set(value)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onChange(Array.from(next))
  }

  return (
    <div className="space-y-2">
      {!showQuickPick && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              style={{
                backgroundColor: selectedLabels.length
                  ? 'color-mix(in srgb, var(--primary) 12%, transparent)'
                  : 'transparent',
                color: selectedLabels.length ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              <Tags className="h-3 w-3" />
              Labels
              {selectedLabels.length > 0 && (
                <span
                  className="ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                >
                  {selectedLabels.length}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[220px]">
            {labels.length === 0 && (
              <div className="px-2 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                No labels yet.
              </div>
            )}
            {labels.map((label) => (
              <DropdownMenuCheckboxItem
                key={label.id}
                checked={selected.has(label.id)}
                onCheckedChange={() => toggleLabel(label.id)}
                className="gap-2 text-xs"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                {label.name}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onManage}
              className="text-xs"
            >
              Manage labels
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {showQuickPick && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            <span>Selected</span>
            <span>{selectedLabels.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedLabels.length === 0 && (
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                None selected.
              </span>
            )}
            {selectedLabels.map((label) => (
              <button
                key={label.id}
                type="button"
                onClick={() => toggleLabel(label.id)}
                disabled={disabled}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
                style={{
                  backgroundColor: `${label.color}22`,
                  color: label.color,
                  boxShadow: `0 0 0 1px ${label.color}66`,
                }}
                title="Remove label"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />
                {label.name}
                <span className="text-[10px] opacity-70">×</span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] uppercase tracking-wide pt-2" style={{ color: 'var(--text-muted)' }}>
            <span>Available</span>
            <span>{labels.length - selectedLabels.length}</span>
          </div>
          <div className="grid gap-1.5">
            {labels.length === 0 && (
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                No labels yet.
              </span>
            )}
            {labels.map((label) => {
              const isSelected = selected.has(label.id)
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md border px-2.5 py-2 text-[11px] transition-colors',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  style={isSelected ? {
                    borderColor: `${label.color}66`,
                    backgroundColor: `${label.color}14`,
                    color: label.color,
                  } : {
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'color-mix(in srgb, var(--surface-2) 60%, transparent)',
                    color: 'var(--text-muted)',
                  }}
                  title={isSelected ? 'Remove label' : 'Add label'}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: label.color }} />
                    {label.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide">
                    {isSelected ? 'On' : 'Add'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {!showQuickPick && showChips && (
        <div className="flex flex-wrap gap-1.5">
          {selectedLabels.length === 0 && (
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              No labels selected.
            </span>
          )}
          {selectedLabels.map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `${label.color}22`,
                color: label.color,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

interface CreateTodoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateTodoInput, options?: { silent?: boolean; close?: boolean }) => Promise<boolean>
  categories: Category[]
  labels: TodoLabel[]
  onCreateLabel: (data: Pick<TodoLabel, 'name' | 'color'>) => Promise<boolean>
  onUpdateLabel: (id: string, data: Partial<Pick<TodoLabel, 'name' | 'color'>>) => Promise<boolean>
  onDeleteLabel: (id: string) => Promise<boolean>
  isLoading?: boolean
}

export function CreateTodoModal({
  open,
  onOpenChange,
  onSubmit,
  categories,
  labels,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
  isLoading,
}: CreateTodoModalProps) {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [priority, setPriority] = React.useState<Priority>('MEDIUM')
  const [dueDate, setDueDate] = React.useState('')
  const [categoryId, setCategoryId] = React.useState<string>('')
  const [labelIds, setLabelIds] = React.useState<string[]>([])
  const [isLabelManagerOpen, setIsLabelManagerOpen] = React.useState(false)

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPriority('MEDIUM')
    setDueDate('')
    setCategoryId('')
    setLabelIds([])
  }

  React.useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const success = await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      categoryId: categoryId || null,
      labelIds,
    })

    if (success) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your list
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="create-title">Title</Label>
            <Input
              id="create-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Add more details..."
              disabled={isLoading}
            />
          </div>

          {/* Priority - full width pill bar */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <PrioritySelector
              value={priority}
              onChange={setPriority}
              disabled={isLoading}
            />
          </div>

          {/* Due Date and Category - side by side */}
          <div className={cn('grid gap-4', categories.length > 0 ? 'grid-cols-2' : 'grid-cols-1')}>
            <div className="space-y-2">
              <Label htmlFor="create-dueDate">Due Date</Label>
              <Input
                id="create-dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {categories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="create-category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <Label>Labels</Label>
            <LabelMultiSelect
              labels={labels}
              value={labelIds}
              onChange={setLabelIds}
              onManage={() => setIsLabelManagerOpen(true)}
              disabled={isLoading}
            />
          </div>

          {/* Action buttons in their own row */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isLoading}>
              {isLoading ? 'Creating...' : 'Create Task'}
            </Button>
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

interface TodoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (
    data: CreateTodoInput | UpdateTodoInput,
    options?: { silent?: boolean; close?: boolean }
  ) => void
  todo?: Todo | null
  categories: Category[]
  labels: TodoLabel[]
  onCreateLabel: (data: Pick<TodoLabel, 'name' | 'color'>) => Promise<boolean>
  onUpdateLabel: (id: string, data: Partial<Pick<TodoLabel, 'name' | 'color'>>) => Promise<boolean>
  onDeleteLabel: (id: string) => Promise<boolean>
  isLoading?: boolean
}

export function TodoForm({
  open,
  onOpenChange,
  onSubmit,
  todo,
  categories,
  labels,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
  isLoading,
}: TodoFormProps) {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [priority, setPriority] = React.useState<Priority>('MEDIUM')
  const [status, setStatus] = React.useState<Status>('TODO')
  const [dueDate, setDueDate] = React.useState('')
  const [categoryId, setCategoryId] = React.useState<string>('')
  const [labelIds, setLabelIds] = React.useState<string[]>([])
  const [isLabelManagerOpen, setIsLabelManagerOpen] = React.useState(false)
  const previousSnapshot = React.useRef<string>('')

  const isEditing = !!todo

  React.useEffect(() => {
    if (todo) {
      setTitle(todo.title)
      setDescription(todo.description || '')
      setPriority(todo.priority)
      setStatus(todo.status)
      setDueDate(todo.dueDate ? todo.dueDate.split('T')[0] : '')
      setCategoryId(todo.categoryId || '')
      setLabelIds(todo.labels?.map((label) => label.id) ?? [])
      previousSnapshot.current = JSON.stringify({
        title: todo.title.trim(),
        description: todo.description?.trim() || undefined,
        priority: todo.priority,
        status: todo.status,
        dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString() : null,
        categoryId: todo.categoryId || null,
        labelIds: todo.labels?.map((label) => label.id) ?? [],
      })
    } else {
      setTitle('')
      setDescription('')
      setPriority('MEDIUM')
      setStatus('TODO')
      setDueDate('')
      setCategoryId('')
      setLabelIds([])
      previousSnapshot.current = ''
    }
  }, [todo, open])

  const maybeAutoSave = React.useCallback(() => {
    if (!isEditing || !todo) return
    if (!title.trim()) return

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      categoryId: categoryId || null,
      labelIds,
    }

    const snapshot = JSON.stringify(payload)
    if (snapshot === previousSnapshot.current) return
    previousSnapshot.current = snapshot
    onSubmit(payload, { close: false, silent: true })
  }, [
    isEditing,
    todo,
    title,
    description,
    priority,
    status,
    dueDate,
    categoryId,
    labelIds,
    onSubmit,
  ])

  React.useEffect(() => {
    if (!isEditing || !open) return
    maybeAutoSave()
  }, [maybeAutoSave, isEditing, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[1040px] max-h-[90vh] overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header with subtle gradient */}
          <div 
            className="px-6 py-5 border-b shrink-0"
            style={{
              borderColor: 'var(--border-color)',
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, transparent), color-mix(in srgb, var(--accent) 8%, transparent))',
            }}
          >
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-xl">{isEditing ? 'Edit Task' : 'Create Task'}</DialogTitle>
              <DialogDescription className="text-sm">
                {isEditing
                  ? 'Changes are saved automatically'
                  : 'Fill in the details for your new task'}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-0 md:gap-0">
              {/* Left column - Content */}
              <div className="space-y-4 md:pr-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Task Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    autoFocus
                    className="h-12 text-base font-medium"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Description
                  </Label>
                  <RichTextEditor
                    value={description}
                    onChange={setDescription}
                    placeholder="Add more details, links, or notes..."
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Right column - Meta/Properties */}
              <div
                className="space-y-5 pt-6 md:pt-0 md:pl-6 md:border-l"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {/* Status (edit mode only) */}
                {isEditing && (
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                      <TrendingUp className="h-3.5 w-3.5" />
                      Status
                    </Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODO">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="WAITING">Waiting</SelectItem>
                        <SelectItem value="ON_HOLD">On Hold</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Priority */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <Flame className="h-3.5 w-3.5" />
                    Priority
                  </Label>
                  <PrioritySelector
                    value={priority}
                    onChange={(next) => {
                      setPriority(next)
                      requestAnimationFrame(() => maybeAutoSave())
                    }}
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
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>

                {/* Category */}
                {categories.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                      <Tag className="h-3.5 w-3.5" />
                      Category
                    </Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <span className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: cat.color }}
                              />
                              {cat.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

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
                    value={labelIds}
                    onChange={setLabelIds}
                    onManage={() => setIsLabelManagerOpen(true)}
                    disabled={isLoading}
                    showQuickPick
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer with actions */}
          <div 
            className="px-6 py-4 border-t shrink-0"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 px-5"
              >
                {isEditing ? 'Close' : 'Cancel'}
              </Button>
              {!isEditing && (
                <Button 
                  type="submit" 
                  disabled={!title.trim() || isLoading}
                  className="h-10 px-6"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Task'
                  )}
                </Button>
              )}
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

interface InlineTodoFormProps {
  onSubmit: (data: CreateTodoInput) => Promise<boolean>
  categories: Category[]
  labels: TodoLabel[]
  onCreateLabel: (data: Pick<TodoLabel, 'name' | 'color'>) => Promise<boolean>
  onUpdateLabel: (id: string, data: Partial<Pick<TodoLabel, 'name' | 'color'>>) => Promise<boolean>
  onDeleteLabel: (id: string) => Promise<boolean>
  isLoading?: boolean
}

export function InlineTodoForm({
  onSubmit,
  categories,
  labels,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
  isLoading,
}: InlineTodoFormProps) {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [priority, setPriority] = React.useState<Priority>('MEDIUM')
  const [dueDate, setDueDate] = React.useState('')
  const [categoryId, setCategoryId] = React.useState<string>('')
  const [labelIds, setLabelIds] = React.useState<string[]>([])
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isLabelManagerOpen, setIsLabelManagerOpen] = React.useState(false)

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPriority('MEDIUM')
    setDueDate('')
    setCategoryId('')
    setLabelIds([])
  }

  // Handle Escape key to collapse
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false)
        resetForm()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const success = await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      categoryId: categoryId || null,
      labelIds,
    })

    if (success) {
      resetForm()
      setIsExpanded(false)
    }
  }

  const priorityConfig = {
    LOW: { icon: Minus, colorVar: 'var(--priority-low)', label: 'Low' },
    MEDIUM: { icon: TrendingUp, colorVar: 'var(--priority-medium)', label: 'Med' },
    HIGH: { icon: Flame, colorVar: 'var(--priority-high)', label: 'High' },
    URGENT: { icon: Zap, colorVar: 'var(--priority-urgent)', label: 'Urgent' },
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Main input card */}
      <div className="group relative">
        <div
          className="absolute -inset-0.5 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity"
          style={{ background: `linear-gradient(to right, color-mix(in srgb, var(--primary) 20%, transparent), color-mix(in srgb, var(--accent) 20%, transparent))` }}
        />
        <div
          className="relative rounded-lg border backdrop-blur-sm overflow-hidden transition-all duration-200"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--surface) 80%, transparent)',
            borderColor: 'var(--border-color)',
          }}
        >
          {/* Title input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSubmit(e as unknown as React.FormEvent)
              }
            }}
            placeholder="Add a task..."
            disabled={isLoading}
            className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none placeholder:text-[var(--text-muted)]"
            style={{ color: 'var(--text-primary)', caretColor: 'var(--accent)' }}
          />
          
          {/* Expanded options */}
          {isExpanded && (
            <div style={{ borderTop: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)' }}>
              {/* Description */}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e as unknown as React.FormEvent)
                  }
                }}
                placeholder="Notes (optional) — Shift+Enter for new line"
                disabled={isLoading}
                rows={2}
                className="w-full bg-transparent px-4 py-2.5 text-xs focus:outline-none resize-none"
                style={{ color: 'var(--text-muted)' }}
              />
              
              {/* Priority and Date Row */}
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{ borderTop: '1px solid color-mix(in srgb, var(--border-color) 30%, transparent)' }}
              >
                {/* Priority Pills */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: 'var(--text-muted)' }}>Priority</span>
                  {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as Priority[]).map((p) => {
                    const config = priorityConfig[p]
                    const Icon = config.icon
                    const isSelected = priority === p
                    
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        disabled={isLoading}
                        className={cn(
                          'flex items-center justify-center p-1.5 rounded-md transition-all',
                          !isSelected && 'hover:bg-white/5 opacity-40 hover:opacity-100'
                        )}
                        style={isSelected ? {
                          backgroundColor: `color-mix(in srgb, ${config.colorVar} 15%, transparent)`,
                          color: config.colorVar,
                        } : { color: config.colorVar }}
                        title={config.label}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    )
                  })}
                </div>

                <div className="w-px h-4 bg-[var(--border-color)] opacity-50" />

                {/* Date picker */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: 'var(--text-muted)' }}>Due</span>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('inline-date-input') as HTMLInputElement
                      input?.showPicker?.()
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors border border-transparent hover:border-[var(--border-color)]"
                    style={dueDate ? {
                      backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                      color: 'var(--primary)',
                    } : { color: 'var(--text-muted)' }}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    {dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Set date'}
                  </button>
                  <input
                    id="inline-date-input"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="sr-only"
                  />
                </div>
              </div>

              {/* Category and Labels Row */}
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{ borderTop: '1px solid color-mix(in srgb, var(--border-color) 30%, transparent)' }}
              >
                {/* Category */}
                {categories.length > 0 && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: 'var(--text-muted)' }}>Category</span>
                      <Select value={categoryId} onValueChange={setCategoryId} disabled={isLoading}>
                        <SelectTrigger className="h-auto w-auto border-0 bg-transparent px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground focus:ring-0 shadow-none gap-1.5 p-0 border border-transparent hover:border-[var(--border-color)] rounded-md">
                          <Tag className="h-3.5 w-3.5" />
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <span className="flex items-center gap-2">
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: cat.color }}
                                />
                                {cat.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-px h-4 bg-[var(--border-color)] opacity-50" />
                  </>
                )}

                {/* Labels */}
                <div className="flex items-center gap-1.5">
                  <LabelMultiSelect
                    labels={labels}
                    value={labelIds}
                    onChange={setLabelIds}
                    onManage={() => setIsLabelManagerOpen(true)}
                    disabled={isLoading}
                    showChips={false}
                  />
                </div>
              </div>

              {/* Selected labels display */}
              {labelIds.length > 0 && (
                <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                  {labels
                    .filter((label) => labelIds.includes(label.id))
                    .map((label) => (
                      <span
                        key={label.id}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${label.color}22`,
                          color: label.color,
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                </div>
              )}

              {/* Actions Row */}
              <div
                className="px-4 py-3 flex items-center justify-end gap-2"
                style={{ borderTop: '1px solid color-mix(in srgb, var(--border-color) 30%, transparent)' }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false)
                    resetForm()
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors hover:bg-white/5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!title.trim() || isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  )}
                  <span className="text-xs font-semibold">Add Task</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <LabelManagerDialog
        open={isLabelManagerOpen}
        onOpenChange={setIsLabelManagerOpen}
        labels={labels}
        onCreateLabel={onCreateLabel}
        onUpdateLabel={onUpdateLabel}
        onDeleteLabel={onDeleteLabel}
        disabled={isLoading}
      />
    </form>
  )
}
