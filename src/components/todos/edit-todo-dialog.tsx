'use client'

import * as React from 'react'
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
  GitPullRequest,
  GitPullRequestArrow,
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
import { GitHubPrBadge } from './github-pr-badge'
import { useLabels } from '@/hooks/use-labels'
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
  const form = useTodoForm(todo)
  const [isLabelManagerOpen, setIsLabelManagerOpen] = React.useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('')
  const [newPrUrl, setNewPrUrl] = React.useState('')

  const isEditing = !!todo

  // Save changes when dialog closes (escape, overlay click, close button)
  const handleClose = React.useCallback(() => {
    if (isEditing && todo && form.title.trim()) {
      const payload = form.toPayload()
      // Include pending PR URL that wasn't explicitly added
      const pendingUrl = newPrUrl.trim()
      if (pendingUrl && !payload.githubPrUrls.includes(pendingUrl)) {
        payload.githubPrUrls = [...payload.githubPrUrls, pendingUrl]
      }
      const original = JSON.stringify({
        title: todo.title.trim(),
        description: todo.description?.trim() || undefined,
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
        myPrUrl: todo.myPrUrl || null,
        githubPrUrls: todo.githubPrUrls ?? [],
      })
      if (JSON.stringify(payload) !== original) {
        onSubmit(payload)
        return
      }
    }
    onOpenChange(false)
  }, [isEditing, todo, form, onSubmit, onOpenChange, newPrUrl])

  const handleAddSubtask = React.useCallback(() => {
    if (newSubtaskTitle.trim()) {
      form.addSubtask(newSubtaskTitle)
      setNewSubtaskTitle('')
    }
  }, [newSubtaskTitle, form])

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      handleClose()
    }
  }, [handleClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                Changes are saved when you close this dialog
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
                    {form.subtasks.map((subtask, index) => (
                      <div key={subtask.id ?? index} className="flex items-center gap-2 group/subtask">
                        <button
                          type="button"
                          onClick={() => form.toggleSubtask(index)}
                          className="flex-shrink-0 transition-colors"
                          style={{ color: subtask.completed ? 'var(--status-done)' : 'var(--text-muted)' }}
                        >
                          {subtask.completed ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                        <input
                          type="text"
                          value={subtask.title}
                          onChange={(e) => form.updateSubtaskTitle(index, e.target.value)}
                          className="flex-1 bg-transparent text-sm focus:outline-none"
                          style={{
                            color: subtask.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                            textDecoration: subtask.completed ? 'line-through' : 'none',
                          }}
                        />
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
                      <Plus className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddSubtask()
                          }
                        }}
                        placeholder="Add a subtask..."
                        className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-[var(--text-muted)]"
                        style={{ color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
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

                {/* My PR */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <GitPullRequestArrow className="h-3.5 w-3.5" />
                    My PR
                  </Label>
                  <div
                    className="flex items-center gap-2 rounded-md px-2.5 py-1.5 border"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--background) 50%, transparent)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    <input
                      type="url"
                      value={form.myPrUrl}
                      onChange={(e) => form.setMyPrUrl(e.target.value)}
                      placeholder="... insert url"
                      className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-[var(--text-muted)] min-w-0"
                      style={{ color: 'var(--text-primary)' }}
                    />
                    {form.myPrUrl.trim() && (
                      <button
                        type="button"
                        onClick={() => form.setMyPrUrl('')}
                        className="flex-shrink-0 transition-opacity"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {form.myPrUrl.trim() && (
                    <GitHubPrBadge url={form.myPrUrl.trim()} />
                  )}
                </div>

                {/* Dependency PRs */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <GitPullRequest className="h-3.5 w-3.5" />
                    Waiting On
                  </Label>
                  <div className="space-y-1.5">
                    {form.githubPrUrls.map((url, index) => (
                      <div key={url} className="flex items-center gap-2 group/pr">
                        <GitHubPrBadge url={url} />
                        <button
                          type="button"
                          onClick={() => form.removeGithubPrUrl(index)}
                          className="flex-shrink-0 opacity-0 group-hover/pr:opacity-100 transition-opacity"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <div
                      className="flex items-center gap-2 rounded-md px-2.5 py-1.5 border"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--background) 50%, transparent)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      <input
                        type="url"
                        value={newPrUrl}
                        onChange={(e) => setNewPrUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            if (newPrUrl.trim()) {
                              form.addGithubPrUrl(newPrUrl)
                              setNewPrUrl('')
                            }
                          }
                        }}
                        placeholder="... insert url"
                        className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-[var(--text-muted)] min-w-0"
                        style={{ color: 'var(--text-primary)' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newPrUrl.trim()) {
                            form.addGithubPrUrl(newPrUrl)
                            setNewPrUrl('')
                          }
                        }}
                        disabled={!newPrUrl.trim()}
                        className="flex-shrink-0 text-xs font-medium px-2 py-1 rounded transition-colors disabled:opacity-30"
                        style={{ color: 'var(--primary)' }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
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
