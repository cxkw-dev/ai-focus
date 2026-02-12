'use client'

import * as React from 'react'
import {
  CalendarDays,
  Flame,
  Loader2,
  Minus,
  Plus,
  TrendingUp,
  Zap,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LabelMultiSelect, LabelManagerDialog } from './label-multi-select'
import { useLabels } from '@/hooks/use-labels'
import { useTodoForm } from '@/hooks/use-todo-form'
import type { CreateTodoInput, Priority } from '@/types/todo'

const priorityConfig = {
  LOW: { icon: Minus, colorVar: 'var(--priority-low)', label: 'Low' },
  MEDIUM: { icon: TrendingUp, colorVar: 'var(--priority-medium)', label: 'Med' },
  HIGH: { icon: Flame, colorVar: 'var(--priority-high)', label: 'High' },
  URGENT: { icon: Zap, colorVar: 'var(--priority-urgent)', label: 'Urgent' },
} as const

interface InlineTodoFormProps {
  onSubmit: (data: CreateTodoInput) => Promise<boolean>
  isLoading?: boolean
}

export function InlineTodoForm({
  onSubmit,
  isLoading,
}: InlineTodoFormProps) {
  const { labels, handleCreate: onCreateLabel, handleUpdate: onUpdateLabel, handleDelete: onDeleteLabel } = useLabels()
  const form = useTodoForm()
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isLabelManagerOpen, setIsLabelManagerOpen] = React.useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('')
  const resetForm = form.reset

  const submitCurrentTodo = React.useCallback(async () => {
    if (!form.title.trim()) return false

    const success = await onSubmit(form.toPayload())
    if (success) {
      resetForm()
      setNewSubtaskTitle('')
      setIsExpanded(false)
    }

    return success
  }, [form, onSubmit, resetForm])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false)
        resetForm()
        setNewSubtaskTitle('')
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
            className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none placeholder:text-[var(--text-muted)]"
            style={{ color: 'var(--text-primary)', caretColor: 'var(--accent)' }}
          />

          {isExpanded && (
            <div style={{ borderTop: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)' }}>
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
                className="w-full bg-transparent px-4 py-2.5 text-xs focus:outline-none resize-none"
                style={{ color: 'var(--text-muted)' }}
              />

              {/* Priority and Date Row */}
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{ borderTop: '1px solid color-mix(in srgb, var(--border-color) 30%, transparent)' }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: 'var(--text-muted)' }}>Priority</span>
                  {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as Priority[]).map((p) => {
                    const config = priorityConfig[p]
                    const Icon = config.icon
                    const isSelected = form.priority === p

                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => form.setPriority(p)}
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

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: 'var(--text-muted)' }}>Due</span>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('inline-date-input') as HTMLInputElement
                      input?.showPicker?.()
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors border border-transparent hover:border-[var(--border-color)]"
                    style={form.dueDate ? {
                      backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                      color: 'var(--primary)',
                    } : { color: 'var(--text-muted)' }}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    {form.dueDate ? new Date(form.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Set date'}
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
                className="px-4 py-3 flex items-center gap-3"
                style={{ borderTop: '1px solid color-mix(in srgb, var(--border-color) 30%, transparent)' }}
              >
                <div className="flex items-center gap-1.5">
                  <LabelMultiSelect
                    labels={labels}
                    value={form.labelIds}
                    onChange={form.setLabelIds}
                    onManage={() => setIsLabelManagerOpen(true)}
                    disabled={isLoading}
                    showChips={false}
                  />
                </div>
              </div>

              {/* Selected labels display */}
              {form.labelIds.length > 0 && (
                <div className="px-4 pb-3 flex flex-wrap gap-1.5">
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
                style={{ borderTop: '1px solid color-mix(in srgb, var(--border-color) 30%, transparent)' }}
              >
                <div className="space-y-1">
                  {form.subtasks.map((subtask, index) => (
                    <div key={index} className="flex items-center gap-2 group/subtask">
                      <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                        {index + 1}.
                      </span>
                      <span className="text-xs flex-1" style={{ color: 'var(--text-primary)' }}>
                        {subtask.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => form.removeSubtask(index)}
                        className="flex-shrink-0 opacity-0 group-hover/subtask:opacity-100 transition-opacity"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <X className="h-3 w-3" />
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
                          e.stopPropagation()
                          if (newSubtaskTitle.trim()) {
                            form.addSubtask(newSubtaskTitle)
                            setNewSubtaskTitle('')
                          }
                        }
                      }}
                      placeholder="Add a subtask..."
                      disabled={isLoading}
                      className="flex-1 bg-transparent text-xs focus:outline-none placeholder:text-[var(--text-muted)]"
                      style={{ color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
              </div>

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
                  disabled={!form.title.trim() || isLoading}
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
