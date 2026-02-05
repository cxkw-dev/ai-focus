'use client'

import * as React from 'react'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LabelMultiSelect, LabelManagerDialog } from './label-multi-select'
import { PrioritySelector } from './priority-selector'
import { useLabels } from '@/hooks/use-labels'
import { useCategories } from '@/hooks/use-categories'
import { useTodoForm } from '@/hooks/use-todo-form'
import type { CreateTodoInput } from '@/types/todo'

interface CreateTodoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateTodoInput) => Promise<boolean>
  isLoading?: boolean
}

export function CreateTodoModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: CreateTodoModalProps) {
  const { labels, handleCreate: onCreateLabel, handleUpdate: onUpdateLabel, handleDelete: onDeleteLabel } = useLabels()
  const { categories } = useCategories()
  const form = useTodoForm()
  const [isLabelManagerOpen, setIsLabelManagerOpen] = React.useState(false)

  React.useEffect(() => {
    if (!open) form.reset()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return

    const success = await onSubmit(form.toPayload())
    if (success) onOpenChange(false)
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
          <div className="space-y-2">
            <Label htmlFor="create-title">Title</Label>
            <Input
              id="create-title"
              value={form.title}
              onChange={(e) => form.setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <RichTextEditor
              value={form.description}
              onChange={form.setDescription}
              placeholder="Add more details..."
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <PrioritySelector
              value={form.priority}
              onChange={form.setPriority}
              disabled={isLoading}
            />
          </div>

          <div className={cn('grid gap-4', categories.length > 0 ? 'grid-cols-2' : 'grid-cols-1')}>
            <div className="space-y-2">
              <Label htmlFor="create-dueDate">Due Date</Label>
              <Input
                id="create-dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => form.setDueDate(e.target.value)}
              />
            </div>

            {categories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="create-category">Category</Label>
                <Select value={form.categoryId} onValueChange={form.setCategoryId}>
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

          <div className="space-y-2">
            <Label>Labels</Label>
            <LabelMultiSelect
              labels={labels}
              value={form.labelIds}
              onChange={form.setLabelIds}
              onManage={() => setIsLabelManagerOpen(true)}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!form.title.trim() || isLoading}>
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
