'use client'

import { Input } from '@/components/ui/input'
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
      <div className="dd-field dd-field--above">
        <label className="dd-field__label" htmlFor="title">
          Title
        </label>
        <Input
          id="title"
          size="lg"
          value={form.title}
          onChange={(e) => form.setTitle(e.target.value)}
          placeholder="What needs to be done?"
          autoFocus
        />
      </div>

      <div className="dd-field dd-field--above">
        <span className="dd-field__label">Description</span>
        <RichTextEditor
          value={form.description}
          onChange={form.setDescription}
          placeholder="Add details, links or notes"
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
