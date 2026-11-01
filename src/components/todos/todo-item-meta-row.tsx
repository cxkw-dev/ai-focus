'use client'

import {
  PriorityChip,
  PriorityDropdown,
  StatusChip,
  StatusDropdown,
  TodoLabelChip,
} from './todo-display'
import type * as React from 'react'
import type { ViewMode } from './todo-item'
import type { Priority, Status, Todo } from '@/types/todo'

interface TodoItemMetaRowProps {
  todo: Todo
  viewMode: ViewMode
  onStatusChange: (id: string, status: Status) => void
  onPriorityChange: (id: string, priority: Priority) => void
  /** Card actions, pushed to the end of the row (they wrap with the chips on narrow cards). */
  actions?: React.ReactNode
}

export function TodoItemMetaRow({
  todo,
  viewMode,
  onStatusChange,
  onPriorityChange,
  actions,
}: TodoItemMetaRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {viewMode === 'active' && (
        <StatusDropdown todo={todo} onStatusChange={onStatusChange} />
      )}
      {viewMode === 'completed' && <StatusChip status={todo.status} />}
      {viewMode === 'active' ? (
        <PriorityDropdown todo={todo} onPriorityChange={onPriorityChange} />
      ) : (
        <PriorityChip priority={todo.priority} />
      )}
      {todo.labels?.map((label) => (
        <TodoLabelChip key={label.id} label={label} className="max-w-32" />
      ))}
      {actions && <div className="ml-auto">{actions}</div>}
    </div>
  )
}
