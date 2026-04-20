'use client'

import * as React from 'react'
import { CalendarDays, Loader2, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { openLabelsRoute } from '@/lib/labels'
import { PRIORITIES } from '@/lib/priority'
import { LabelMultiSelect } from './label-multi-select'
import { SubtaskMentionInput } from '@/components/ui/subtask-mention-input'
import { UrlListField } from './url-fields'
import { useLabels } from '@/hooks/use-labels'
import { useTodoForm } from '@/hooks/use-todo-form'
import {
  hasMeaningfulText,
  isHtmlContent,
  linkifyHtml,
  mentionifyHtml,
  normalizeSubtaskTitle,
} from '@/lib/rich-text'
import type { CreateTodoInput, Priority } from '@/types/todo'
import type { Person } from '@/types/person'

interface InlineTodoFormProps {
  onSubmit: (data: CreateTodoInput) => Promise<boolean>
  isLoading?: boolean
  defaultLabelIds?: string[]
  subtaskMentions: Array<Pick<Person, 'id' | 'name' | 'email'>>
}

export function InlineTodoForm({
  onSubmit,
  isLoading,
  defaultLabelIds,
  subtaskMentions,
}: InlineTodoFormProps) {
  const { labels } = useLabels()
  const form = useTodoForm(null, { initialLabelIds: defaultLabelIds })
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('')
  const [newPrUrl, setNewPrUrl] = React.useState('')
  const [newAzureDepUrl, setNewAzureDepUrl] = React.useState('')
  const resetForm = form.reset
  const handleManageLabels = React.useCallback(() => {
    openLabelsRoute()
  }, [])

  const submitCurrentTodo = React.useCallback(async () => {
    if (!form.title.trim()) return false

    const payload = form.toPayload()
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
      resetForm()
      setNewSubtaskTitle('')
      setNewPrUrl('')
      setNewAzureDepUrl('')
      setIsExpanded(false)
    }

    return success
  }, [form, onSubmit, resetForm, newPrUrl, newAzureDepUrl])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false)
        resetForm()
        setNewSubtaskTitle('')
        setNewPrUrl('')
        setNewAzureDepUrl('')
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded, resetForm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitCurrentTodo()
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="group relative">
        <div
          className="absolute -inset-0.5 rounded-lg opacity-0 blur transition-opacity group-focus-within:opacity-100"
          style={{
            background: `linear-gradient(to right, color-mix(in srgb, var(--primary) 20%, transparent), color-mix(in srgb, var(--accent) 20%, transparent))`,
          }}
        />
        <div
          className="relative overflow-hidden rounded-lg border backdrop-blur-sm transition-all duration-200"
          style={{
            backgroundColor:
              'color-mix(in srgb, var(--surface) 80%, transparent)',
            borderColor: 'var(--border-color)',
          }}
        >
          {/* Title input */}
          <input
            type="text"
            value={form.title}
            onChange={(e) => form.setTitle(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void submitCurrentTodo()
              }
            }}
            placeholder="Add a task..."
            disabled={isLoading}
            className="w-full bg-transparent px-4 py-3 text-sm placeholder:text-[var(--text-muted)] focus:outline-none"
            style={{
              color: 'var(--text-primary)',
              caretColor: 'var(--accent)',
            }}
          />

          {isExpanded && (
            <div
              style={{
                borderTop:
                  '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)',
              }}
            >
              {/* Description */}
              <textarea
                value={form.description}
                onChange={(e) => form.setDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void submitCurrentTodo()
                  }
                }}
                placeholder="Notes (optional) — Shift+Enter for new line"
                disabled={isLoading}
                rows={2}
                className="w-full resize-none bg-transparent px-4 py-2.5 text-xs focus:outline-none"
                style={{ color: 'var(--text-muted)' }}
              />

              {/* Priority and Date Row */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  borderTop:
                    '1px solid color-mix(in srgb, var(--border-color) 30%, transparent)',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px] font-semibold tracking-wide uppercase"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Priority
                  </span>
                  {PRIORITIES.map((pConfig) => {
                    const p = pConfig.value
                    const config = pConfig
                    const Icon = config.icon
                    const isSelected = form.priority === p

                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => form.setPriority(p)}
                        disabled={isLoading}
                        className={cn(
                          'flex items-center justify-center rounded-md p-1.5 transition-all',
                          !isSelected &&
                            'opacity-40 hover:bg-white/5 hover:opacity-100',
                        )}
                        style={
                          isSelected
                            ? {
                                backgroundColor: `color-mix(in srgb, ${config.colorVar} 15%, transparent)`,
                                color: config.colorVar,
                              }
                            : { color: config.colorVar }
                        }
                        title={config.label}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    )
                  })}
                </div>

                <div className="h-4 w-px bg-[var(--border-color)] opacity-50" />

                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px] font-semibold tracking-wide uppercase"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Due
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById(
                        'inline-date-input',
                      ) as HTMLInputElement
                      input?.showPicker?.()
                    }}
                    className="flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-[11px] transition-colors hover:border-[var(--border-color)]"
                    style={
                      form.dueDate
                        ? {
                            backgroundColor:
                              'color-mix(in srgb, var(--primary) 15%, transparent)',
                            color: 'var(--primary)',
                          }
                        : { color: 'var(--text-muted)' }
                    }
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    {form.dueDate
                      ? new Date(form.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Set date'}
                  </button>
                  <input
                    id="inline-date-input"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => form.setDueDate(e.target.value)}
                    className="sr-only"
                  />
                </div>
              </div>

              {/* Labels Row */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  borderTop:
                    '1px solid color-mix(in srgb, var(--border-color) 30%, transparent)',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <LabelMultiSelect
                    labels={labels}
                    value={form.labelIds}
                    onChange={form.setLabelIds}
                    onManage={handleManageLabels}
                    disabled={isLoading}
                    showChips={false}
                  />
                </div>
              </div>

              {/* Selected labels display */}
              {form.labelIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                  {labels
                    .filter((label) => form.labelIds.includes(label.id))
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

              {/* Subtasks Row */}
              <div
                className="px-4 py-3"
                style={{
                  borderTop:
                    '1px solid color-mix(in srgb, var(--border-color) 30%, transparent)',
                }}
              >
                <div className="space-y-1">
                  {form.subtasks.map((subtask, index) => (
                    <div
                      key={subtask.id ?? `subtask-${index}`}
                      className="group/subtask flex items-center gap-2"
                    >
                      <span
                        className="flex-shrink-0 text-[10px]"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {index + 1}.
                      </span>
                      <div
                        className="min-w-0 flex-1 text-xs"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {isHtmlContent(subtask.title) ? (
                          <div
                            className="[&_.mention]:font-medium [&_.mention:hover]:underline [&_a]:text-[var(--primary)] [&_a:hover]:underline [&_p]:my-0 [&_p]:leading-snug"
                            dangerouslySetInnerHTML={{
                              __html: linkifyHtml(
                                mentionifyHtml(subtask.title),
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
                        className="flex-shrink-0 opacity-0 transition-opacity group-hover/subtask:opacity-100"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Plus
                      className="h-3.5 w-3.5 flex-shrink-0"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <SubtaskMentionInput
                      value={newSubtaskTitle}
                      onChange={setNewSubtaskTitle}
                      onCommit={() => {
                        const normalized =
                          normalizeSubtaskTitle(newSubtaskTitle)
                        if (!hasMeaningfulText(normalized)) return
                        form.addSubtask(normalized)
                        setNewSubtaskTitle('')
                      }}
                      commitOnBlur={false}
                      mentions={subtaskMentions}
                      placeholder="Add a subtask..."
                      disabled={isLoading}
                      className="flex-1 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                    />
                  </div>
                </div>
              </div>

              {/* Azure Work Items Row */}
              <div
                className="px-4 py-3"
                style={{
                  borderTop:
                    '1px solid color-mix(in srgb, var(--border-color) 30%, transparent)',
                }}
              >
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
              </div>

              {/* GitHub PRs Row */}
              <div
                className="px-4 py-3"
                style={{
                  borderTop:
                    '1px solid color-mix(in srgb, var(--border-color) 30%, transparent)',
                }}
              >
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
              </div>

              {/* Actions Row */}
              <div
                className="flex items-center justify-end gap-2 px-4 py-3"
                style={{
                  borderTop:
                    '1px solid color-mix(in srgb, var(--border-color) 30%, transparent)',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false)
                    resetForm()
                    setNewPrUrl('')
                    setNewAzureDepUrl('')
                  }}
                  className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!form.title.trim() || isLoading}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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
    </form>
  )
}
