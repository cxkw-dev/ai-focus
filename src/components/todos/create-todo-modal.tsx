'use client'

import * as React from 'react'
import {
  CalendarDays,
  Flame,
  Tags,
  ListChecks,
  Plus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { SubtaskMentionInput } from '@/components/ui/subtask-mention-input'
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
import { SingleUrlField, UrlListField, AzureIcon, GitHubIcon } from './url-fields'
import { useLabels } from '@/hooks/use-labels'
import { usePeople } from '@/hooks/use-people'
import { useTodoForm } from '@/hooks/use-todo-form'
import {
  hasMeaningfulText,
  isHtmlContent,
  linkifyHtml,
  mentionifyHtml,
  normalizeSubtaskTitle,
} from '@/lib/rich-text'
import type { CreateTodoInput } from '@/types/todo'

interface CreateTodoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateTodoInput) => Promise<boolean>
  isLoading?: boolean
  defaultLabelIds?: string[]
}

export function CreateTodoModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  defaultLabelIds,
}: CreateTodoModalProps) {
  const { labels, handleCreate: onCreateLabel, handleUpdate: onUpdateLabel, handleDelete: onDeleteLabel } = useLabels()
  const { people } = usePeople()
  const form = useTodoForm(null, { initialLabelIds: defaultLabelIds })
  const [isLabelManagerOpen, setIsLabelManagerOpen] = React.useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('')
  const [newMyPrUrl, setNewMyPrUrl] = React.useState('')
  const [newPrUrl, setNewPrUrl] = React.useState('')
  const [newAzureDepUrl, setNewAzureDepUrl] = React.useState('')
  const [newMyIssueUrl, setNewMyIssueUrl] = React.useState('')
  const [newIssueUrl, setNewIssueUrl] = React.useState('')
  const resetForm = form.reset
  const subtaskMentions = React.useMemo(
    () => people.map((person) => ({ id: person.id, name: person.name, email: person.email })),
    [people]
  )

  React.useEffect(() => {
    if (!open) resetForm()
  }, [open, resetForm])

  const handleAddSubtask = React.useCallback(() => {
    const normalized = normalizeSubtaskTitle(newSubtaskTitle)
    if (!hasMeaningfulText(normalized)) return
    form.addSubtask(normalized)
    setNewSubtaskTitle('')
  }, [newSubtaskTitle, form])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return

    const payload = form.toPayload()
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
    if (pendingMyIssue && !payload.myIssueUrls!.includes(pendingMyIssue)) {
      payload.myIssueUrls = [...payload.myIssueUrls!, pendingMyIssue]
    }
    const pendingIssue = newIssueUrl.trim()
    if (pendingIssue && !payload.githubIssueUrls!.includes(pendingIssue)) {
      payload.githubIssueUrls = [...payload.githubIssueUrls!, pendingIssue]
    }
    const success = await onSubmit(payload)
    if (success) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[1040px] max-h-[85vh] flex flex-col overflow-hidden p-0">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div
            className="px-6 py-5 border-b shrink-0"
            style={{
              borderColor: 'var(--border-color)',
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, transparent), color-mix(in srgb, var(--accent) 8%, transparent))',
            }}
          >
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-xl">Create New Task</DialogTitle>
              <DialogDescription className="text-sm">
                Add a new task to your list
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-0 md:gap-0">
              {/* Left column - Content */}
              <div className="space-y-4 md:pr-6">
                <div className="space-y-2">
                  <Label htmlFor="create-title" className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Task Title
                  </Label>
                  <Input
                    id="create-title"
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
                        {form.subtasks.length}
                      </span>
                    )}
                  </Label>
                  <div className="space-y-1">
                    {form.subtasks.map((subtask, index) => (
                      <div key={index} className="flex items-center gap-2 group/subtask">
                        <div className="text-xs flex-1 min-w-0" style={{ color: 'var(--text-primary)' }}>
                          {isHtmlContent(subtask.title) ? (
                            <div
                              className="[&_p]:my-0 [&_p]:leading-snug [&_.mention]:font-medium [&_.mention:hover]:underline [&_a]:text-[var(--primary)] [&_a:hover]:underline"
                              dangerouslySetInnerHTML={{ __html: linkifyHtml(mentionifyHtml(subtask.title)) }}
                            />
                          ) : (
                            subtask.title
                          )}
                        </div>
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
              </div>

              {/* Right column - Meta */}
              <div
                className="space-y-5 pt-6 md:pt-0 md:pl-6 md:border-l"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {/* Priority */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <Flame className="h-3.5 w-3.5" />
                    Priority
                  </Label>
                  <PrioritySelector
                    value={form.priority}
                    onChange={form.setPriority}
                    disabled={isLoading}
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label htmlFor="create-dueDate" className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <CalendarDays className="h-3.5 w-3.5" />
                    Due Date
                  </Label>
                  <Input
                    id="create-dueDate"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => form.setDueDate(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>

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
                    GitHub
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

                {/* GitHub Issues */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <GitHubIcon className="h-3.5 w-3.5" />
                    GitHub Issues
                  </Label>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>My Issues</span>
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
                    <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Waiting On</span>
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
            <DialogFooter className="flex gap-3 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-10 px-5"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!form.title.trim() || isLoading} className="h-10 px-5">
                {isLoading ? 'Creating...' : 'Create Task'}
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
