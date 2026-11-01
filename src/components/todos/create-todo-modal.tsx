'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog'
import { ProjectScopeField } from './project-scope-field'
import { PrioritySelector } from './priority-selector'
import { EditTodoSubtasks } from './edit-todo-subtasks'
import {
  SingleUrlField,
  UrlListField,
  AzureIcon,
  GitHubIcon,
} from './url-fields'
import { useTodoForm } from '@/hooks/use-todo-form'
import type { Project } from '@/lib/projects'
import type { CreateTodoInput } from '@/types/todo'
import type { Person } from '@/types/person'

interface CreateTodoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateTodoInput) => Promise<boolean>
  isLoading?: boolean
  /** The board you opened this from — the task files here, and only here. */
  project: Project
  people: Person[]
}

/** A titled group of link fields in the side column (same shape as the edit dialog's links). */
function LinkGroup({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
      <legend className="text-text float-left flex w-full items-center gap-1.5 p-0 text-sm leading-tight font-semibold">
        {icon}
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

function LinkField({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-muted text-xs font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}

export function CreateTodoModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  project,
  people,
}: CreateTodoModalProps) {
  const initialLabelIds = React.useMemo(() => [project.id], [project.id])
  const form = useTodoForm(null, { initialLabelIds })
  const id = React.useId()
  const [newMyPrUrl, setNewMyPrUrl] = React.useState('')
  const [newPrUrl, setNewPrUrl] = React.useState('')
  const [newAzureDepUrl, setNewAzureDepUrl] = React.useState('')
  const [newMyIssueUrl, setNewMyIssueUrl] = React.useState('')
  const [newIssueUrl, setNewIssueUrl] = React.useState('')
  const resetForm = form.reset
  const subtaskMentions = React.useMemo(
    () =>
      people.map((person) => ({
        id: person.id,
        name: person.name,
        email: person.email,
      })),
    [people],
  )
  React.useEffect(() => {
    if (!open) resetForm()
  }, [open, resetForm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return

    const payload = form.toPayload()
    // The board you opened this from is the only filing destination.
    payload.labelIds = [project.id]
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
      {/* Two columns need more room than the system's large dialog (680px). */}
      <DialogContent size="lg" className="[--_w:62rem]">
        <form className="dd-dialog__form" onSubmit={handleSubmit}>
          <DialogHeader eyebrow={project.name} title="new task" />

          <DialogBody>
            <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-[minmax(0,1fr)_17rem]">
              <div className="dd-form__body">
                <div className="dd-field dd-field--above">
                  <label className="dd-field__label" htmlFor="create-title">
                    Title
                  </label>
                  <Input
                    id="create-title"
                    size="lg"
                    value={form.title}
                    onChange={(e) => form.setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    autoFocus
                  />
                </div>

                <div className="dd-field dd-field--above">
                  <span className="dd-field__label">Description</span>
                  <RichTextEditor
                    value={form.description}
                    onChange={form.setDescription}
                    placeholder="Add details, links or notes"
                    disabled={isLoading}
                    mentions={subtaskMentions}
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
              </div>

              <div className="dd-form__body">
                <div className="dd-field dd-field--above">
                  <span className="dd-field__label">Priority</span>
                  <PrioritySelector
                    value={form.priority}
                    onChange={form.setPriority}
                    disabled={isLoading}
                  />
                </div>

                <div className="dd-field dd-field--above">
                  <label className="dd-field__label" htmlFor="create-dueDate">
                    Due date
                  </label>
                  <Input
                    id="create-dueDate"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => form.setDueDate(e.target.value)}
                  />
                </div>

                <LinkGroup icon={<AzureIcon />} title="Azure DevOps">
                  <LinkField id={`${id}-azure-item`} label="My work item">
                    <SingleUrlField
                      id={`${id}-azure-item`}
                      value={form.azureWorkItemUrl}
                      onChange={form.setAzureWorkItemUrl}
                      type="azure"
                      disabled={isLoading}
                    />
                  </LinkField>
                  <LinkField id={`${id}-azure-deps`} label="Waiting on">
                    <UrlListField
                      id={`${id}-azure-deps`}
                      type="azure"
                      urls={form.azureDepUrls}
                      onAdd={(url) => form.addAzureDepUrl(url)}
                      onRemove={(i) => form.removeAzureDepUrl(i)}
                      inputValue={newAzureDepUrl}
                      onInputChange={setNewAzureDepUrl}
                      disabled={isLoading}
                    />
                  </LinkField>
                </LinkGroup>

                <LinkGroup icon={<GitHubIcon />} title="GitHub PRs">
                  <LinkField id={`${id}-my-prs`} label="My PRs">
                    <UrlListField
                      id={`${id}-my-prs`}
                      type="github"
                      urls={form.myPrUrls}
                      onAdd={(url) => form.addMyPrUrl(url)}
                      onRemove={(i) => form.removeMyPrUrl(i)}
                      inputValue={newMyPrUrl}
                      onInputChange={setNewMyPrUrl}
                      disabled={isLoading}
                    />
                  </LinkField>
                  <LinkField id={`${id}-pr-deps`} label="Waiting on">
                    <UrlListField
                      id={`${id}-pr-deps`}
                      type="github"
                      urls={form.githubPrUrls}
                      onAdd={(url) => form.addGithubPrUrl(url)}
                      onRemove={(i) => form.removeGithubPrUrl(i)}
                      inputValue={newPrUrl}
                      onInputChange={setNewPrUrl}
                      disabled={isLoading}
                    />
                  </LinkField>
                </LinkGroup>

                <LinkGroup icon={<GitHubIcon />} title="GitHub issues">
                  <LinkField id={`${id}-my-issues`} label="My issues">
                    <UrlListField
                      id={`${id}-my-issues`}
                      type="github-issue"
                      urls={form.myIssueUrls}
                      onAdd={(url) => form.addMyIssueUrl(url)}
                      onRemove={(i) => form.removeMyIssueUrl(i)}
                      inputValue={newMyIssueUrl}
                      onInputChange={setNewMyIssueUrl}
                      disabled={isLoading}
                    />
                  </LinkField>
                  <LinkField id={`${id}-issue-deps`} label="Waiting on">
                    <UrlListField
                      id={`${id}-issue-deps`}
                      type="github-issue"
                      urls={form.githubIssueUrls}
                      onAdd={(url) => form.addGithubIssueUrl(url)}
                      onRemove={(i) => form.removeGithubIssueUrl(i)}
                      inputValue={newIssueUrl}
                      onInputChange={setNewIssueUrl}
                      disabled={isLoading}
                    />
                  </LinkField>
                </LinkGroup>

                <ProjectScopeField project={project} />
              </div>
            </div>
          </DialogBody>

          <DialogFooter hint="↵ to create · esc to cancel">
            <Button onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!form.title.trim()}
              loading={isLoading}
            >
              <Icon name="plus" />
              Create task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
