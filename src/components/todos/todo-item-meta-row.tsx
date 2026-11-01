'use client'

import { PriorityChip, StatusChip, TodoLabelChip } from './todo-display'
import { boardColumnConfig, boardColumnForStatus } from '@/lib/board-columns'
import type * as React from 'react'
import type { ViewMode } from './todo-item'
import type { Priority, Status, Todo } from '@/types/todo'

interface TodoItemMetaRowProps {
  todo: Todo
  viewMode: ViewMode
  /** The board's own project: its label goes without saying on every card, so it's left off. */
  projectId?: string
  /** Card chrome (add subtask, drawer toggles, the ⋯ menu), pushed to the end of the row before the task number. */
  actions?: React.ReactNode
}

/**
 * A lane already says its status when it holds just one (Backlog, In progress, Done, Cancelled); only a lane that
 * mixes several (Blocked: blocked, waiting, on hold, under review) needs the chip.
 */
function laneHoldsSeveralStatuses(status: Status) {
  return boardColumnConfig(boardColumnForStatus(status)).statuses.length > 1
}

/** Medium is the default, and Low is quieter still; only High and Urgent earn a chip. */
function priorityNeedsChip(priority: Priority) {
  return priority === 'HIGH' || priority === 'URGENT'
}

/**
 * A card's quiet footer: what the card's place on the board doesn't already say (a mixed lane's status, a raised
 * priority, other projects) on the left, then the card's chrome and its `#taskNumber` on the right.
 */
export function TodoItemMetaRow({
  todo,
  viewMode,
  projectId,
  actions,
}: TodoItemMetaRowProps) {
  // Out of the board (the trash) there's no lane to say it, so the status shows.
  const showStatus =
    viewMode === 'deleted' || laneHoldsSeveralStatuses(todo.status)
  const labels = (todo.labels ?? []).filter((label) => label.id !== projectId)

  return (
    <div className="flex flex-wrap items-center gap-1">
      {showStatus && <StatusChip status={todo.status} />}
      {priorityNeedsChip(todo.priority) && (
        <PriorityChip priority={todo.priority} />
      )}
      {labels.map((label) => (
        <TodoLabelChip key={label.id} label={label} className="max-w-32" />
      ))}
      <div className="ml-auto flex flex-none items-center">
        {actions}
        <span className="text-muted ml-1 font-mono text-xs tabular-nums">
          #{todo.taskNumber}
        </span>
      </div>
    </div>
  )
}
