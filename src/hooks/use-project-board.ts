'use client'

import * as React from 'react'
import {
  BOARD_COLUMNS,
  groupTodosByBoardColumn,
  terminalStatusForBoardColumn,
  type BoardColumnConfig,
  type BoardColumnKey,
} from '@/lib/board-columns'
import { filterTodosByProject } from '@/lib/projects'
import type { CompletedTodoCounts, Todo } from '@/types/todo'

interface UseProjectBoardParams {
  projectId: string
  todos: Todo[]
  /** Empty until a finished lane is opened — see useTodos({ withCompleted }). */
  completedTodos: Todo[]
  completedCounts: CompletedTodoCounts
  deletedTodos: Todo[]
}

export interface ProjectBoardColumn extends BoardColumnConfig {
  todos: Todo[]
  /** Authoritative tally — a finished lane's cards may not be fetched yet. */
  count: number
}

interface UseProjectBoardResult {
  columns: ProjectBoardColumn[]
  groups: Record<BoardColumnKey, Todo[]>
  projectDeletedTodos: Todo[]
  activeCount: number
  doneCount: number
}

function byCompletedAtDesc(left: Todo, right: Todo) {
  const leftTime = left.completedAt ? new Date(left.completedAt).getTime() : 0
  const rightTime = right.completedAt
    ? new Date(right.completedAt).getTime()
    : 0
  return rightTime - leftTime
}

/**
 * Slices the global todo board down to one project and lays it out as the
 * Trello lanes. Finished work is archived server-side and fetched separately,
 * so a finished lane's count comes from the board's tally rather than from its
 * cards — the badge has to be right even when the lane is collapsed and
 * unfetched.
 */
export function useProjectBoard({
  projectId,
  todos,
  completedTodos,
  completedCounts,
  deletedTodos,
}: UseProjectBoardParams): UseProjectBoardResult {
  const groups = React.useMemo(() => {
    const projectActive = filterTodosByProject(todos, projectId)
    const projectCompleted = filterTodosByProject(completedTodos, projectId)
    const next = groupTodosByBoardColumn([
      ...projectActive,
      ...projectCompleted,
    ])
    next.DONE.sort(byCompletedAtDesc)
    next.CANCELLED.sort(byCompletedAtDesc)
    return next
  }, [todos, completedTodos, projectId])

  const columns = React.useMemo(
    () =>
      BOARD_COLUMNS.map((column) => ({
        ...column,
        todos: groups[column.key],
        count: column.terminal
          ? (completedCounts[terminalStatusForBoardColumn(column)].byProject[
              projectId
            ] ?? 0)
          : groups[column.key].length,
      })),
    [groups, completedCounts, projectId],
  )

  const projectDeletedTodos = React.useMemo(
    () => filterTodosByProject(deletedTodos, projectId),
    [deletedTodos, projectId],
  )

  return {
    columns,
    groups,
    projectDeletedTodos,
    activeCount: columns
      .filter((column) => !column.terminal)
      .reduce((total, column) => total + column.count, 0),
    doneCount: completedCounts.COMPLETED.byProject[projectId] ?? 0,
  }
}
