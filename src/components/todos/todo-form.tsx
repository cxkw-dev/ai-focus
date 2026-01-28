'use client'

import * as React from 'react'
import { 
  CalendarDays, 
  ChevronUp, 
  Flame, 
  Loader2, 
  Minus, 
  Sparkles, 
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
import type { Todo, CreateTodoInput, UpdateTodoInput, Priority, Category } from '@/types/todo'

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
  const [dueDate, setDueDate] = React.useState('')
  const [categoryId, setCategoryId] = React.useState<string>('')

  const isEditing = !!todo

  React.useEffect(() => {
    if (todo) {
      setTitle(todo.title)
      setDescription(todo.description || '')
      setPriority(todo.priority)
      setDueDate(todo.dueDate ? todo.dueDate.split('T')[0] : '')
      setCategoryId(todo.categoryId || '')
    } else {
      setTitle('')
      setDescription('')
      setPriority('MEDIUM')
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
    LOW: { icon: Minus, color: 'text-slate-400', bg: 'bg-slate-400/10', label: 'Low' },
    MEDIUM: { icon: TrendingUp, color: 'text-[#DBB06B]', bg: 'bg-[#DBB06B]/10', label: 'Med' },
    HIGH: { icon: Flame, color: 'text-[#E39A7B]', bg: 'bg-[#E39A7B]/10', label: 'High' },
    URGENT: { icon: Zap, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Urgent' },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Main input card */}
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#E39A7B]/20 to-[#DBB06B]/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <div className="relative rounded-xl border bg-card/80 backdrop-blur-sm overflow-hidden">
          {/* Title input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="Add a task..."
            disabled={isLoading}
            className="w-full bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none"
          />
          
          {/* Expanded options */}
          {isExpanded && (
            <div className="border-t border-border/50">
              {/* Description */}
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes (optional)"
                disabled={isLoading}
                className="w-full bg-transparent px-4 py-2.5 text-xs text-muted-foreground placeholder:text-muted-foreground/40 focus:outline-none"
              />
              
              {/* Quick options row */}
              <div className="flex items-center gap-1 px-3 py-2 border-t border-border/30">
                {/* Date picker */}
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('inline-date-input') as HTMLInputElement
                    input?.showPicker?.()
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors',
                    dueDate 
                      ? 'bg-[#E39A7B]/15 text-[#E39A7B]' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
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
                  className="p-1 rounded text-muted-foreground/50 hover:text-muted-foreground transition-colors"
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
                isSelected
                  ? cn(config.bg, config.color)
                  : 'text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/50'
              )}
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
          'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all',
          'bg-gradient-to-r from-[#E39A7B] to-[#DBB06B] text-[#0A0A0B]',
          'hover:from-[#FFB5AB] hover:to-[#E39A7B] hover:shadow-lg hover:shadow-[#E39A7B]/25',
          'active:scale-[0.98]',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5" />
            Add Task
          </>
        )}
      </button>
    </form>
  )
}
