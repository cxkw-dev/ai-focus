'use client'

import { Input } from '@/components/ui/input'
import { Select, type SelectOption } from '@/components/ui/select'
import { STATUS_CONFIG } from '@/lib/status'
import { PrioritySelector } from './priority-selector'
import type { TodoFormState } from '@/hooks/use-todo-form'
import type { Status } from '@/types/todo'

const STATUS_OPTIONS: SelectOption[] = Object.entries(STATUS_CONFIG).map(
  ([value, config]) => ({ value, label: config.label }),
)

function isStatus(value: string): value is Status {
  return value in STATUS_CONFIG
}

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
      <div className="dd-field dd-field--above">
        <label className="dd-field__label" htmlFor="status">
          Status
        </label>
        <Select
          id="status"
          value={form.status}
          onChange={(e) => {
            if (isStatus(e.target.value)) form.setStatus(e.target.value)
          }}
          options={STATUS_OPTIONS}
        />
      </div>

      <div className="dd-field dd-field--above">
        <span className="dd-field__label">Priority</span>
        <PrioritySelector
          value={form.priority}
          onChange={(next) => form.setPriority(next)}
          disabled={isLoading}
        />
      </div>

      <div className="dd-field dd-field--above">
        <label className="dd-field__label" htmlFor="dueDate">
          Due date
        </label>
        <Input
          id="dueDate"
          type="date"
          value={form.dueDate}
          onChange={(e) => form.setDueDate(e.target.value)}
        />
      </div>
    </>
  )
}
