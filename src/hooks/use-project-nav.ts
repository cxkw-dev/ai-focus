'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  activeLabelsQueryOptions,
  todoBoardQueryOptions,
} from '@/lib/query-options'
import {
  NO_PROJECT_KEY,
  countTodosByProject,
  sortProjectsByName,
  type Project,
} from '@/lib/projects'

export interface ProjectNavItem extends Project {
  /** Open (non-terminal, non-archived) todos in this project. */
  openCount: number
}

interface UseProjectNavResult {
  projects: ProjectNavItem[]
  unassignedCount: number
  isLoading: boolean
}

/**
 * Read-only project list for navigation surfaces. Deliberately uses the raw
 * queries rather than useLabels/useTodos so the sidebar doesn't drag in a full
 * set of mutations on every page.
 */
export function useProjectNav(): UseProjectNavResult {
  const labelsQuery = useQuery(activeLabelsQueryOptions())
  const boardQuery = useQuery(todoBoardQueryOptions())

  const openCounts = React.useMemo(
    () => countTodosByProject(boardQuery.data?.active ?? []),
    [boardQuery.data],
  )

  const projects = React.useMemo(
    () =>
      sortProjectsByName(labelsQuery.data ?? []).map((project) => ({
        ...project,
        openCount: openCounts[project.id] ?? 0,
      })),
    [labelsQuery.data, openCounts],
  )

  return {
    projects,
    unassignedCount: openCounts[NO_PROJECT_KEY] ?? 0,
    isLoading: labelsQuery.isLoading,
  }
}
