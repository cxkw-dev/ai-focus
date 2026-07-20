'use client'

import {
  PriorityChip,
  PriorityDropdown,
  StatusChip,
  StatusDropdown,
  TodoLabelChip,
} from './todo-display'
import type { ViewMode } from './todo-item'
import type { Priority, Status, Todo } from '@/types/todo'

interface TodoItemMetaRowProps {
  todo: Todo
  viewMode: ViewMode
  onStatusChange: (id: string, status: Status) => void
  onPriorityChange: (id: string, priority: Priority) => void
}

export function TodoItemMetaRow({
  todo,
  viewMode,
  onStatusChange,
  onPriorityChange,
}: TodoItemMetaRowProps) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1">
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
        <TodoLabelChip
          key={label.id}
          label={label}
          className="max-w-[8rem] truncate"
        />
      ))}
    </div>
  )
}
