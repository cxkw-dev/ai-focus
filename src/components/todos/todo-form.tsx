'use client'

import * as React from 'react'
import {
  CalendarDays,
  ChevronUp,
  Flame,
  Loader2,
  Minus,
  Plus,
  Tag,
  TrendingUp,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { PrioritySelector } from './priority-selector'
import type { Todo, CreateTodoInput, UpdateTodoInput, Priority, Status, Category } from '@/types/todo'

interface TodoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateTodoInput | UpdateTodoInput) => void
  todo?: Todo | null
  categories: Category[]
  isLoading?: boolean
}

export function TodoForm({
  open,
  onOpenChange,
  onSubmit,
  todo,
  categories,
  isLoading,
}: TodoFormProps) {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [priority, setPriority] = React.useState<Priority>('MEDIUM')
  const [status, setStatus] = React.useState<Status>('TODO')
  const [dueDate, setDueDate] = React.useState('')
  const [categoryId, setCategoryId] = React.useState<string>('')

  const isEditing = !!todo

  React.useEffect(() => {
    if (todo) {
      setTitle(todo.title)
      setDescription(todo.description || '')
      setPriority(todo.priority)
      setStatus(todo.status)
      setDueDate(todo.dueDate ? todo.dueDate.split('T')[0] : '')
      setCategoryId(todo.categoryId || '')
    } else {
      setTitle('')
      setDescription('')
      setPriority('MEDIUM')
      setStatus('TODO')
      setDueDate('')
      setCategoryId('')
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
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details..."
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
    </Dialog>
  )
}

interface InlineTodoFormProps {
  onSubmit: (data: CreateTodoInput) => Promise<boolean>
  categories: Category[]
  isLoading?: boolean
}

export function InlineTodoForm({ onSubmit, categories, isLoading }: InlineTodoFormProps) {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [priority, setPriority] = React.useState<Priority>('MEDIUM')
  const [dueDate, setDueDate] = React.useState('')
  const [categoryId, setCategoryId] = React.useState<string>('')
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isButtonHovered, setIsButtonHovered] = React.useState(false)

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPriority('MEDIUM')
    setDueDate('')
    setCategoryId('')
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
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes (optional)"
                disabled={isLoading}
                className="w-full bg-transparent px-4 py-2.5 text-xs focus:outline-none"
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
    </form>
  )
}
