'use client'

import * as React from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
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
  const form = useTodoForm()
  const [isLabelManagerOpen, setIsLabelManagerOpen] = React.useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('')

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

          <div className="space-y-2">
            <Label htmlFor="create-dueDate">Due Date</Label>
            <Input
              id="create-dueDate"
              type="date"
              value={form.dueDate}
              onChange={(e) => form.setDueDate(e.target.value)}
            />
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

          <div className="space-y-2">
            <Label>Subtasks</Label>
            <div className="space-y-1.5">
              {form.subtasks.map((subtask, index) => (
                <div key={index} className="flex items-center gap-2 group/subtask">
                  <span className="text-xs flex-1" style={{ color: 'var(--text-primary)' }}>
                    {subtask.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => form.removeSubtask(index)}
                    className="flex-shrink-0 opacity-0 group-hover/subtask:opacity-100 transition-opacity"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Plus className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (newSubtaskTitle.trim()) {
                        form.addSubtask(newSubtaskTitle)
                        setNewSubtaskTitle('')
                      }
                    }
                  }}
                  placeholder="Add a subtask..."
                  className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-[var(--text-muted)] border-b border-transparent focus:border-[var(--border-color)] transition-colors pb-1"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>
            </div>
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
