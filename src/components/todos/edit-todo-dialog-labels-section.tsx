'use client'

import type { ComponentProps } from 'react'
import { LabelMultiSelect } from './label-multi-select'
import type { TodoFormState } from '@/hooks/use-todo-form'

interface EditTodoDialogLabelsSectionProps {
  labels: ComponentProps<typeof LabelMultiSelect>['labels']
  form: TodoFormState
  onManageLabels: () => void
  disabled?: boolean
}

export function EditTodoDialogLabelsSection({
  labels,
  form,
  onManageLabels,
  disabled,
}: EditTodoDialogLabelsSectionProps) {
  return (
    <div className="dd-field dd-field--above">
      <span className="dd-field__label flex items-baseline justify-between gap-2">
        Labels
        <button
          type="button"
          onClick={onManageLabels}
          className="dd-link text-muted text-xs font-medium"
        >
          Manage
        </button>
      </span>
      <LabelMultiSelect
        labels={labels}
        value={form.labelIds}
        onChange={form.setLabelIds}
        onManage={onManageLabels}
        disabled={disabled}
        showQuickPick
      />
    </div>
  )
}
