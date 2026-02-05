'use client'

import * as React from 'react'
import {
  CalendarDays,
  Flame,
  Loader2,
  Tag,
  Tags,
  TrendingUp,
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
import { LabelMultiSelect, LabelManagerDialog } from './label-multi-select'
import { PrioritySelector } from './priority-selector'
import { useLabels } from '@/hooks/use-labels'
import { useCategories } from '@/hooks/use-categories'
import { useTodoForm } from '@/hooks/use-todo-form'
import type { Todo, UpdateTodoInput, Status } from '@/types/todo'

interface EditTodoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (
    data: UpdateTodoInput,
    options?: { silent?: boolean; close?: boolean }
  ) => void
  todo?: Todo | null
  isLoading?: boolean
}

export function EditTodoDialog({
  open,
  onOpenChange,
  onSubmit,
  todo,
  isLoading,
}: EditTodoDialogProps) {
  const { labels, handleCreate: onCreateLabel, handleUpdate: onUpdateLabel, handleDelete: onDeleteLabel } = useLabels()
  const { categories } = useCategories()
  const form = useTodoForm(todo)
  const [isLabelManagerOpen, setIsLabelManagerOpen] = React.useState(false)
  const previousSnapshot = React.useRef<string>('')

  const isEditing = !!todo

  // Snapshot for auto-save change detection
  React.useEffect(() => {
    if (todo && open) {
      previousSnapshot.current = JSON.stringify({
        title: todo.title.trim(),
        description: todo.description?.trim() || undefined,
        priority: todo.priority,
        status: todo.status,
        dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString() : null,
        categoryId: todo.categoryId || null,
        labelIds: todo.labels?.map(l => l.id) ?? [],
      })
    } else {
      previousSnapshot.current = ''
    }
  }, [todo, open])

  const maybeAutoSave = React.useCallback(() => {
    if (!isEditing || !todo) return
    if (!form.title.trim()) return

    const payload = form.toPayload()
    const snapshot = JSON.stringify(payload)
    if (snapshot === previousSnapshot.current) return
    previousSnapshot.current = snapshot
    onSubmit(payload, { close: false, silent: true })
  }, [isEditing, todo, form, onSubmit])

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
          {/* Header */}
          <div
            className="px-6 py-5 border-b shrink-0"
            style={{
              borderColor: 'var(--border-color)',
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, transparent), color-mix(in srgb, var(--accent) 8%, transparent))',
            }}
          >
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-xl">Edit Task</DialogTitle>
              <DialogDescription className="text-sm">
                Changes are saved automatically
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-0 md:gap-0">
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
                  />
                </div>
              </div>

              {/* Right column - Meta */}
              <div
                className="space-y-5 pt-6 md:pt-0 md:pl-6 md:border-l"
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
                    onChange={(next) => {
                      form.setPriority(next)
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
                    value={form.dueDate}
                    onChange={(e) => form.setDueDate(e.target.value)}
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
                    <Select value={form.categoryId} onValueChange={form.setCategoryId}>
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
                    value={form.labelIds}
                    onChange={form.setLabelIds}
                    onManage={() => setIsLabelManagerOpen(true)}
                    disabled={isLoading}
                    showQuickPick
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
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
