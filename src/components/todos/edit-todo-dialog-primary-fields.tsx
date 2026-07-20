'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import type { TodoFormState } from '@/hooks/use-todo-form'
import type { Person } from '@/types/person'

interface EditTodoDialogPrimaryFieldsProps {
  form: TodoFormState
  people: Person[]
  isLoading?: boolean
}

export function EditTodoDialogPrimaryFields({
  form,
  people,
  isLoading,
}: EditTodoDialogPrimaryFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label
          htmlFor="title"
          className="text-xs font-semibold tracking-wide uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          Task Title
        </Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => form.setTitle(e.target.value)}
          placeholder="What needs to be done?"
          autoFocus
          className="h-12 text-base font-medium"
        />
      </div>

      <div className="space-y-2">
        <Label
          className="text-xs font-semibold tracking-wide uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          Description
        </Label>
        <RichTextEditor
          value={form.description}
          onChange={form.setDescription}
          placeholder="Add more details, links, or notes..."
          disabled={isLoading}
          mentions={people.map((p) => ({
            id: p.id,
            name: p.name,
            email: p.email,
          }))}
        />
      </div>
    </>
  )
}
