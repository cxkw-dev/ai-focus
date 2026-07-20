'use client'

import { CalendarDays, Flame, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PrioritySelector } from './priority-selector'
import type { TodoFormState } from '@/hooks/use-todo-form'
import type { Status } from '@/types/todo'

interface EditTodoDialogMetaFieldsProps {
  form: TodoFormState
  isLoading?: boolean
}

export function EditTodoDialogMetaFields({
  form,
  isLoading,
}: EditTodoDialogMetaFieldsProps) {
  return (
    <>
      {/* Status */}
      <div className="space-y-2">
        <Label
          htmlFor="status"
          className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Status
        </Label>
        <Select
          value={form.status}
          onValueChange={(v) => form.setStatus(v as Status)}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODO">To Do</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="WAITING">Waiting</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label
          className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
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
        <Label
          htmlFor="dueDate"
          className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
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
    </>
  )
}
