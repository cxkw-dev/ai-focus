'use client'

import * as React from 'react'
import type { LabelStatusBoardFilter } from '@/components/todos/label-status-board'
import {
  buildColumns,
  categorizeTodosByLabel,
  type ColumnConfig,
} from '@/lib/categorize-todos'
import type { Label, Todo } from '@/types/todo'

interface UseTodosBoardParams {
  todos: Todo[]
  completedTodos: Todo[]
  deletedTodos: Todo[]
  labels: Label[]
}

interface UseTodosBoardResult {
  columns: ColumnConfig[]
  categorizedActive: Record<string, Todo[]>
  categorizedCompleted: Record<string, Todo[]>
  categorizedDeleted: Record<string, Todo[]>
  responsiveFilter: LabelStatusBoardFilter
  setResponsiveFilter: React.Dispatch<
    React.SetStateAction<LabelStatusBoardFilter>
  >
  categorizedForFilter: Record<string, Todo[]>
  responsiveColumns: ColumnConfig[]
  mobileCategory: string
  setMobileCategory: React.Dispatch<React.SetStateAction<string | null>>
  mobileCol: ColumnConfig | undefined
  handleMobileCategoryKeyDown: (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentKey: string,
  ) => void
}

/**
 * Derives the label→column board structure and the responsive/mobile view state
 * from the raw todo lists and labels. Keeps all column-building and categorization
 * memoization out of the page so it can stay a composition layer.
 */
export function useTodosBoard({
  todos,
  completedTodos,
  deletedTodos,
  labels,
}: UseTodosBoardParams): UseTodosBoardResult {
  // Build dynamic columns from labels
  const columns = React.useMemo(() => buildColumns(labels), [labels])

  // Categorize all todo lists by label
  const categorizedActive = React.useMemo(
    () => categorizeTodosByLabel(todos, columns),
    [todos, columns],
  )
  const categorizedCompleted = React.useMemo(
    () => categorizeTodosByLabel(completedTodos, columns),
    [completedTodos, columns],
  )
  const categorizedDeleted = React.useMemo(
    () => categorizeTodosByLabel(deletedTodos, columns),
    [deletedTodos, columns],
  )

  const [responsiveFilter, setResponsiveFilter] =
    React.useState<LabelStatusBoardFilter>('active')

  // Responsive view: hide labels that have nothing for the active filter
  const categorizedForFilter =
    responsiveFilter === 'completed'
      ? categorizedCompleted
      : responsiveFilter === 'deleted'
        ? categorizedDeleted
        : categorizedActive

  const responsiveColumns = React.useMemo(
    () =>
      columns.filter((col) => (categorizedForFilter[col.key]?.length ?? 0) > 0),
    [columns, categorizedForFilter],
  )

  // Mobile category defaults to first non-empty column. Stored as an override that
  // may or may not exist in the current column set; we fall back to the first column
  // during render so the derived value is always valid.
  const [mobileCategoryOverride, setMobileCategoryOverride] = React.useState<
    string | null
  >(null)
  const mobileCategory =
    mobileCategoryOverride &&
    responsiveColumns.some((c) => c.key === mobileCategoryOverride)
      ? mobileCategoryOverride
      : (responsiveColumns[0]?.key ?? '')
  const setMobileCategory = setMobileCategoryOverride

  const handleMobileCategoryKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, currentKey: string) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()

      const currentIndex = responsiveColumns.findIndex(
        (col) => col.key === currentKey,
      )
      if (currentIndex === -1) return
      const offset = event.key === 'ArrowRight' ? 1 : -1
      const nextIndex =
        (currentIndex + offset + responsiveColumns.length) %
        responsiveColumns.length
      setMobileCategory(responsiveColumns[nextIndex].key)
    },
    [responsiveColumns, setMobileCategory],
  )

  const mobileCol =
    responsiveColumns.find((c) => c.key === mobileCategory) ??
    responsiveColumns[0]

  return {
    columns,
    categorizedActive,
    categorizedCompleted,
    categorizedDeleted,
    responsiveFilter,
    setResponsiveFilter,
    categorizedForFilter,
    responsiveColumns,
    mobileCategory,
    setMobileCategory,
    mobileCol,
    handleMobileCategoryKeyDown,
  }
}
