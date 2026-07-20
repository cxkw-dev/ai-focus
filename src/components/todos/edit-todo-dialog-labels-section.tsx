'use client'

import type { ComponentProps } from 'react'
import { Tags } from 'lucide-react'
import { Label } from '@/components/ui/label'
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label
          className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          <Tags className="h-3.5 w-3.5" />
          Labels
        </Label>
        <button
          type="button"
          onClick={onManageLabels}
          className="text-[11px] font-medium underline transition-all hover:no-underline"
          style={{ color: 'var(--primary)' }}
        >
          Manage
        </button>
      </div>
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
