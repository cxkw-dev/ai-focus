'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Input, Textarea } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { PRIORITIES } from '@/lib/priority'
import { ProjectScopeChip } from './project-scope-field'
import { SubtaskMentionInput } from '@/components/ui/subtask-mention-input'
import { UrlListField } from './url-fields'
import { useTodoForm } from '@/hooks/use-todo-form'
import {
  hasMeaningfulText,
  isHtmlContent,
  linkifyHtml,
  mentionifyHtml,
  normalizeSubtaskTitle,
  sanitizeHtml,
} from '@/lib/rich-text'
import type { Project } from '@/lib/projects'
import type { CreateTodoInput } from '@/types/todo'
import type { Person } from '@/types/person'

interface InlineTodoFormProps {
  onSubmit: (data: CreateTodoInput) => Promise<boolean>
  isLoading?: boolean
  /** The board this lane belongs to — every task typed here files into it. */
  project: Project
  subtaskMentions: Array<Pick<Person, 'id' | 'name' | 'email'>>
}

export function InlineTodoForm({
  onSubmit,
  isLoading,
  project,
  subtaskMentions,
}: InlineTodoFormProps) {
  const initialLabelIds = React.useMemo(() => [project.id], [project.id])
  const form = useTodoForm(null, { initialLabelIds })
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('')
  const [newPrUrl, setNewPrUrl] = React.useState('')
  const [newAzureDepUrl, setNewAzureDepUrl] = React.useState('')
  const dateInputRef = React.useRef<HTMLInputElement>(null)
  const formRef = React.useRef<HTMLFormElement>(null)
  const titleRef = React.useRef<HTMLInputElement>(null)
  const openerRef = React.useRef<HTMLButtonElement>(null)
  // Where focus goes once the composer has opened or closed: into the title, or back to the button that opens it.
  const focusAfterToggle = React.useRef<'title' | 'opener' | null>(null)
  const priorityName = React.useId()
  const resetForm = form.reset

  React.useEffect(() => {
    const target = focusAfterToggle.current
    // The title is disabled while a save is in flight; wait for it.
    if (target === 'title' && isLoading) return
    if (target === 'title') titleRef.current?.focus()
    if (target === 'opener') openerRef.current?.focus()
    focusAfterToggle.current = null
  }, [isExpanded, isLoading])

  const open = () => {
    focusAfterToggle.current = 'title'
    setIsExpanded(true)
  }

  /** Close and clear the composer; focus returns to its button if it was inside. */
  const close = React.useCallback(() => {
    if (formRef.current?.contains(document.activeElement)) {
      focusAfterToggle.current = 'opener'
    }
    setIsExpanded(false)
    resetForm()
    setNewSubtaskTitle('')
    setNewPrUrl('')
    setNewAzureDepUrl('')
  }, [resetForm])

  const submitCurrentTodo = React.useCallback(async () => {
    if (!form.title.trim()) return false

    const payload = form.toPayload()
    payload.labelIds = [project.id]
    // Include pending URLs that weren't explicitly added
    const pendingPr = newPrUrl.trim()
    if (pendingPr && !payload.githubPrUrls.includes(pendingPr)) {
      payload.githubPrUrls = [...payload.githubPrUrls, pendingPr]
    }
    const pendingAzure = newAzureDepUrl.trim()
    if (pendingAzure && !payload.azureDepUrls.includes(pendingAzure)) {
      payload.azureDepUrls = [...payload.azureDepUrls, pendingAzure]
    }
    const success = await onSubmit(payload)
    if (success) {
      // The composer stays open on a fresh title, so a run of tasks is just type, Enter, type, Enter.
      resetForm()
      setNewSubtaskTitle('')
      setNewPrUrl('')
      setNewAzureDepUrl('')
      const title = titleRef.current
      if (title && !title.disabled) title.focus()
      else focusAfterToggle.current = 'title'
    }

    return success
  }, [form, onSubmit, resetForm, newPrUrl, newAzureDepUrl, project.id])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) close()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded, close])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitCurrentTodo()
  }

  if (!isExpanded) {
    return (
      <button
        ref={openerRef}
        type="button"
        onClick={open}
        className="dd-btn dd-btn--ghost dd-btn--sm text-muted w-full justify-start"
      >
        <Icon name="plus" />
        <span>Add a task</span>
      </button>
    )
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="rounded-box bg-well-card w-full"
    >
      <Input
        ref={titleRef}
        type="text"
        value={form.title}
        onChange={(e) => form.setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            void submitCurrentTodo()
          }
        }}
        placeholder="Add a task…"
        aria-label="New task title"
        disabled={isLoading}
        leading={<Icon name="plus" />}
      />

      <div className="flex flex-col gap-3 p-2.5 pt-2">
        <Textarea
          value={form.description}
          onChange={(e) => form.setDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void submitCurrentTodo()
            }
          }}
          placeholder="Notes (optional) — Shift+Enter for a new line"
          aria-label="Notes"
          disabled={isLoading}
          rows={2}
          className="resize-none text-sm"
        />

        {/* Priority and due date */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <span
              className="text-muted w-14 flex-none text-xs font-medium"
              id={`${priorityName}-label`}
            >
              Priority
            </span>
            <fieldset
              className="dd-segmented dd-segmented--sm dd-segmented--inset"
              aria-labelledby={`${priorityName}-label`}
              disabled={isLoading}
            >
              {PRIORITIES.map((option) => (
                <label
                  key={option.value}
                  className="dd-segmented__item dd-segmented__item--icon"
                  title={option.label}
                >
                  <input
                    type="radio"
                    name={priorityName}
                    value={option.value}
                    checked={form.priority === option.value}
                    onChange={() => form.setPriority(option.value)}
                    aria-label={option.label}
                  />
                  <Icon name={option.icon} style={{ color: option.colorVar }} />
                </label>
              ))}
            </fieldset>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted w-14 flex-none text-xs font-medium">
              Due
            </span>
            <Button
              variant={form.dueDate ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => dateInputRef.current?.showPicker?.()}
              className={cn(form.dueDate && 'font-mono font-medium')}
            >
              <Icon name="calendar" />
              {form.dueDate
                ? new Date(form.dueDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Set date'}
            </Button>
            <input
              ref={dateInputRef}
              type="date"
              value={form.dueDate}
              onChange={(e) => form.setDueDate(e.target.value)}
              className="dd-visually-hidden"
              tabIndex={-1}
              aria-label="Due date"
            />
          </div>
        </div>

        {/* Filing destination — fixed by the board you are on */}
        <div className="flex items-center gap-2">
          <span className="text-muted w-14 flex-none text-xs font-medium">
            Files into
          </span>
          <ProjectScopeChip project={project} />
        </div>

        {/* Subtasks */}
        <div className="flex flex-col gap-1">
          {form.subtasks.map((subtask, index) => (
            <div
              key={subtask.id ?? `subtask-${index}`}
              className="flex items-start gap-2 text-sm"
            >
              <span className="text-quiet flex-none font-mono tabular-nums">
                {index + 1}.
              </span>
              <div className="text-text min-w-0 flex-1">
                {isHtmlContent(subtask.title) ? (
                  <div
                    className="subtask-mention-editor [&_a]:text-accent [&_a:hover]:underline"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(
                        linkifyHtml(mentionifyHtml(subtask.title)),
                      ),
                    }}
                  />
                ) : (
                  subtask.title
                )}
              </div>
              <button
                type="button"
                onClick={() => form.removeSubtask(index)}
                className="rounded-ctl text-quiet hover:text-text flex-none"
                aria-label="Remove subtask"
              >
                <Icon name="x" />
              </button>
            </div>
          ))}
          <div className="rounded-ctl bg-wash flex items-center gap-2 px-2 py-1.5 text-sm">
            <Icon name="plus" className="text-quiet flex-none" />
            <SubtaskMentionInput
              value={newSubtaskTitle}
              onChange={setNewSubtaskTitle}
              onCommit={() => {
                const normalized = normalizeSubtaskTitle(newSubtaskTitle)
                if (!hasMeaningfulText(normalized)) return
                form.addSubtask(normalized)
                setNewSubtaskTitle('')
              }}
              commitOnBlur={false}
              mentions={subtaskMentions}
              placeholder="Add a subtask…"
              disabled={isLoading}
              className="text-text flex-1 text-sm"
              ariaLabel="New subtask"
            />
          </div>
        </div>

        <UrlListField
          type="azure"
          urls={form.azureDepUrls}
          onAdd={(url) => form.addAzureDepUrl(url)}
          onRemove={(i) => form.removeAzureDepUrl(i)}
          inputValue={newAzureDepUrl}
          onInputChange={setNewAzureDepUrl}
          disabled={isLoading}
          compact
        />

        <UrlListField
          type="github"
          urls={form.githubPrUrls}
          onAdd={(url) => form.addGithubPrUrl(url)}
          onRemove={(i) => form.removeGithubPrUrl(i)}
          inputValue={newPrUrl}
          onInputChange={setNewPrUrl}
          disabled={isLoading}
          compact
        />

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={close}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isLoading}
            disabled={!form.title.trim()}
          >
            {!isLoading && <Icon name="plus" />}
            Add task
          </Button>
        </div>
      </div>
    </form>
  )
}
