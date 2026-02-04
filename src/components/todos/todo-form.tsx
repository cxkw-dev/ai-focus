'use client'

import * as React from 'react'
import {
  CalendarDays,
  ChevronUp,
  Flame,
  Loader2,
  Minus,
  Plus,
  Save,
  Tag,
  Tags,
  Trash2,
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
  const [newName, setNewName] = React.useState('')
  const [newColor, setNewColor] = React.useState('#22c55e')
  const [presetColors, setPresetColors] = React.useState<Array<{ varName: string; value: string }>>([])
  const [drafts, setDrafts] = React.useState<Record<string, { name: string; color: string }>>({})
  const [isSaving, setIsSaving] = React.useState(false)
  const isCompact = labels.length > 6

  React.useEffect(() => {
    if (!open) return
    const nextDrafts: Record<string, { name: string; color: string }> = {}
    labels.forEach((label) => {
      nextDrafts[label.id] = { name: label.name, color: label.color }
    })
    setDrafts(nextDrafts)
  }, [labels, open])

  React.useEffect(() => {
    if (!open) return
    const rootStyles = getComputedStyle(document.documentElement)
    const presetVars = [
      '--primary',
      '--accent',
      '--status-in-progress',
      '--status-waiting',
      '--status-on-hold',
      '--status-done',
      '--priority-high',
      '--priority-urgent',
    ]

    const toHex = (value: string) => {
      const trimmed = value.trim()
      if (trimmed.startsWith('#')) return trimmed.toLowerCase()
      const match = trimmed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
      if (!match) return '#22c55e'
      const [, r, g, b] = match
      const toHexPart = (v: string) => Number(v).toString(16).padStart(2, '0')
      return `#${toHexPart(r)}${toHexPart(g)}${toHexPart(b)}`
    }

    setPresetColors(
      presetVars.map((varName) => ({
        varName,
        value: toHex(rootStyles.getPropertyValue(varName)),
      }))
    )
  }, [open])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setIsSaving(true)
    const success = await onCreateLabel({ name: newName.trim(), color: newColor })
    setIsSaving(false)
    if (success) {
      setNewName('')
      setNewColor('#22c55e')
    }
  }

  const handleUpdate = async (id: string, original: TodoLabel) => {
    const draft = drafts[id]
    if (!draft) return
    const nextName = draft.name.trim()
    if (!nextName) return
    const updates: Partial<Pick<TodoLabel, 'name' | 'color'>> = {}
    if (nextName !== original.name) updates.name = nextName
    if (draft.color !== original.color) updates.color = draft.color
    if (Object.keys(updates).length === 0) return
    setIsSaving(true)
    await onUpdateLabel(id, updates)
    setIsSaving(false)
  }

  const handleDelete = async (id: string) => {
    setIsSaving(true)
    await onDeleteLabel(id)
    setIsSaving(false)
  }

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

        <div className="p-6 space-y-5">
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'color-mix(in srgb, var(--surface) 60%, transparent)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Create Label
              </div>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: `${newColor}22`,
                  color: newColor,
                }}
              >
                {newName.trim() ? newName.trim() : 'Preview'}
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] items-center">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Label name"
                disabled={disabled || isSaving}
                className="text-sm"
              />
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Color
                </span>
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  disabled={disabled || isSaving}
                  className="color-swatch h-9 w-9 rounded-full border-2 bg-transparent p-0"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--border-color) 70%, transparent)',
                    boxShadow: `0 0 0 2px ${newColor}22`,
                  }}
                  aria-label="Label color"
                />
              </div>
              <Button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim() || disabled || isSaving}
              >
                Add label
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {presetColors.map((preset) => (
                <button
                  key={preset.varName}
                  type="button"
                  onClick={() => setNewColor(preset.value)}
                  className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-105"
                  style={{
                    backgroundColor: preset.value,
                    borderColor: newColor === preset.value ? 'var(--text-primary)' : 'color-mix(in srgb, var(--border-color) 70%, transparent)',
                    boxShadow: newColor === preset.value ? `0 0 0 2px ${preset.value}55` : 'none',
                  }}
                  aria-label={`Select ${preset.varName}`}
                />
              ))}
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Quick picks
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Existing Labels
              </div>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Tap save to apply changes
              </div>
            </div>

            {labels.length === 0 && (
              <div
                className="rounded-xl border p-4 text-xs"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'color-mix(in srgb, var(--surface) 70%, transparent)',
                  color: 'var(--text-muted)',
                }}
              >
                No labels yet. Create your first label above.
              </div>
            )}

            {labels.map((label) => {
              const draft = drafts[label.id] ?? { name: label.name, color: label.color }
              const isDirty = draft.name.trim() !== label.name || draft.color !== label.color

              return (
                <div
                  key={label.id}
                  className={cn(
                    'flex flex-col gap-3 rounded-xl border',
                    isCompact ? 'p-2' : 'p-3'
                  )}
                  style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'color-mix(in srgb, var(--surface-2) 80%, transparent)',
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        backgroundColor: `${draft.color}22`,
                        color: draft.color,
                      }}
                    >
                      {draft.name.trim() || 'Untitled'}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Preview
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex-1 min-w-[220px]">
                      <Input
                        value={draft.name}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [label.id]: { ...draft, name: e.target.value },
                          }))
                        }
                        disabled={disabled || isSaving}
                        className="text-sm w-full"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        Color
                      </span>
                      <input
                        type="color"
                        value={draft.color}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [label.id]: { ...draft, color: e.target.value },
                          }))
                        }
                        disabled={disabled || isSaving}
                        className="color-swatch h-8 w-8 rounded-full border-2 bg-transparent p-0"
                        style={{
                          borderColor: 'color-mix(in srgb, var(--border-color) 70%, transparent)',
                          boxShadow: `0 0 0 2px ${draft.color}22`,
                        }}
                        aria-label="Label color"
                      />
                    </div>

                    <div className="flex items-center gap-2 sm:ml-auto">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleUpdate(label.id, label)}
                        disabled={!draft.name.trim() || !isDirty || disabled || isSaving}
                        className="h-9 w-9 p-0"
                        aria-label="Save label"
                        title="Save label"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleDelete(label.id)}
                        disabled={disabled || isSaving}
                        className="h-9 w-9 p-0 border-destructive/40 text-destructive hover:bg-destructive/10"
                        aria-label="Delete label"
                        title="Delete label"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {presetColors.map((preset) => (
                      <button
                        key={`${label.id}-${preset.varName}`}
                        type="button"
                        onClick={() =>
                          setDrafts((prev) => ({
                            ...prev,
                            [label.id]: { ...draft, color: preset.value },
                          }))
                        }
                        className={cn(
                          'h-6 w-6 rounded-full border-2 transition-transform hover:scale-105',
                          isCompact && 'h-5 w-5'
                        )}
                        style={{
                          backgroundColor: preset.value,
                          borderColor: draft.color === preset.value
                            ? 'var(--text-primary)'
                            : 'color-mix(in srgb, var(--border-color) 70%, transparent)',
                          boxShadow: draft.color === preset.value ? `0 0 0 2px ${preset.value}55` : 'none',
                        }}
                        aria-label={`Select ${preset.varName}`}
                        title="Apply theme color"
                      />
                    ))}
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Theme picks
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
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

      {showChips && selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
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

      {showQuickPick && labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
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
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-all',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
                style={isSelected ? {
                  backgroundColor: `${label.color}22`,
                  color: label.color,
                  boxShadow: `0 0 0 1px ${label.color}55`,
                } : {
                  backgroundColor: 'color-mix(in srgb, var(--surface-2) 60%, transparent)',
                  color: 'var(--text-muted)',
                }}
                title={isSelected ? 'Remove label' : 'Add label'}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />
                {label.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface CreateTodoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateTodoInput) => Promise<boolean>
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
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-hidden">
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto overflow-x-hidden pr-1">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
            <DialogDescription>
              Add a new task to your list.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-title">Title</Label>
              <Input
                id="create-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                autoFocus
                className="focus-visible:ring-0 focus-visible:shadow-[inset_0_0_0_2px_var(--primary)] focus-visible:border-[var(--primary)]"
              />
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Add more details..."
                disabled={isLoading}
                compact
              />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <PrioritySelector
                value={priority}
                onChange={setPriority}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-dueDate">Due Date (optional)</Label>
              <Input
                id="create-dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {categories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="create-category">Category (optional)</Label>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Labels (optional)</Label>
                <button
                  type="button"
                  onClick={() => setIsLabelManagerOpen(true)}
                  className="text-[11px] underline"
                  style={{ color: 'var(--text-muted)' }}
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

          <DialogFooter>
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
          </DialogFooter>
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
  onSubmit: (data: CreateTodoInput | UpdateTodoInput) => void
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
    } else {
      setTitle('')
      setDescription('')
      setPriority('MEDIUM')
      setStatus('TODO')
      setDueDate('')
      setCategoryId('')
      setLabelIds([])
    }
  }, [todo, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      ...(isEditing && { status }),
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      categoryId: categoryId || null,
      labelIds,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-hidden">
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto overflow-x-hidden pr-1">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Todo' : 'Create Todo'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update your todo item details.'
                : 'Add a new todo item to your list.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                autoFocus
                className="focus-visible:ring-0 focus-visible:shadow-[inset_0_0_0_2px_var(--primary)] focus-visible:border-[var(--primary)]"
              />
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Add more details..."
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <PrioritySelector
                value={priority}
                onChange={setPriority}
                disabled={isLoading}
              />
            </div>

            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                  <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date (optional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {categories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="category">Category (optional)</Label>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Labels (optional)</Label>
                <button
                  type="button"
                  onClick={() => setIsLabelManagerOpen(true)}
                  className="text-[11px] underline"
                  style={{ color: 'var(--text-muted)' }}
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Todo'}
            </Button>
          </DialogFooter>
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
  const [isButtonHovered, setIsButtonHovered] = React.useState(false)
  const [isLabelManagerOpen, setIsLabelManagerOpen] = React.useState(false)

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPriority('MEDIUM')
    setDueDate('')
    setCategoryId('')
    setLabelIds([])
  }

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
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Main input card */}
      <div className="group relative">
        <div
          className="absolute -inset-0.5 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity"
          style={{ background: `linear-gradient(to right, color-mix(in srgb, var(--primary) 20%, transparent), color-mix(in srgb, var(--accent) 20%, transparent))` }}
        />
        <div
          className="relative rounded-lg border backdrop-blur-sm overflow-hidden"
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
              
              {/* Quick options row */}
              <div
                className="flex items-center gap-1 px-3 py-2"
                style={{ borderTop: '1px solid color-mix(in srgb, var(--border-color) 30%, transparent)' }}
              >
                {/* Date picker */}
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('inline-date-input') as HTMLInputElement
                    input?.showPicker?.()
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors"
                  style={dueDate ? {
                    backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                    color: 'var(--primary)',
                  } : { color: 'var(--text-muted)' }}
                >
                  <CalendarDays className="h-3 w-3" />
                  {dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Date'}
                </button>
                <input
                  id="inline-date-input"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="sr-only"
                />

                {/* Category */}
                {categories.length > 0 && (
                  <Select value={categoryId} onValueChange={setCategoryId} disabled={isLoading}>
                    <SelectTrigger className="h-auto border-0 bg-transparent px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground focus:ring-0 shadow-none gap-1.5">
                      <Tag className="h-3 w-3" />
                      <SelectValue placeholder="Tag" />
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
                )}

                {/* Labels */}
                <LabelMultiSelect
                  labels={labels}
                  value={labelIds}
                  onChange={setLabelIds}
                  onManage={() => setIsLabelManagerOpen(true)}
                  disabled={isLoading}
                  showChips={false}
                  showQuickPick
                />

                <div className="flex-1" />

                {/* Collapse button */}
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded transition-colors"
                  style={{ color: 'color-mix(in srgb, var(--text-muted) 50%, transparent)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'color-mix(in srgb, var(--text-muted) 50%, transparent)'
                  }}
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
              </div>

              {labelIds.length > 0 && (
                <div className="px-3 pb-2 flex flex-wrap gap-1">
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

              <div className="px-3 pb-2">
                <button
                  type="button"
                  onClick={() => setIsLabelManagerOpen(true)}
                  className="text-[11px] underline"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Manage labels
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Priority pills */}
      <div className="flex items-center gap-1">
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
                'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all',
                !isSelected && 'hover:bg-white/5'
              )}
              style={isSelected ? {
                backgroundColor: `color-mix(in srgb, ${config.colorVar} 15%, transparent)`,
                color: config.colorVar,
              } : { color: 'var(--text-muted)' }}
            >
              <Icon className={cn('h-2.5 w-2.5', isSelected && p === 'URGENT' && 'animate-pulse')} />
              {config.label}
            </button>
          )
        })}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={!title.trim() || isLoading}
        className={cn(
          'group flex items-center justify-center gap-2 w-full py-2.5 rounded-md transition-all duration-200',
          'hover:opacity-90 active:scale-[0.98]',
          'disabled:opacity-30 disabled:cursor-not-allowed'
        )}
        style={{
          backgroundColor: 'var(--primary)',
          color: 'var(--primary-foreground)',
        }}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg
            className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
        <span className="text-xs font-semibold">
          {isLoading ? 'Creating...' : 'Create'}
        </span>
      </button>

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
