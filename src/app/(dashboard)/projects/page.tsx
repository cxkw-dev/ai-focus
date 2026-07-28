'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Search, Tags } from 'lucide-react'
import { useLabels } from '@/hooks/use-labels'
import { useTodos } from '@/hooks/use-todos'
import {
  BOARD_COLUMNS,
  boardColumnForStatus,
  createEmptyBoardGroups,
} from '@/lib/board-columns'
import type { BoardColumnKey } from '@/lib/board-columns'
import { LABELS_ROUTE } from '@/lib/labels'
import { projectHref, searchProjects, sortProjectsByName } from '@/lib/projects'

type ProjectStats = Record<BoardColumnKey, number>

/** Cancelled work is neither open nor progress — the cards never mention it. */
const SUMMARY_COLUMNS = BOARD_COLUMNS.filter(
  (column) => column.key !== 'CANCELLED',
)

function emptyStats(): ProjectStats {
  return Object.fromEntries(
    Object.keys(createEmptyBoardGroups()).map((key) => [key, 0]),
  ) as ProjectStats
}

export default function ProjectsPage() {
  const { labels, isLoading: labelsLoading } = useLabels()
  const { todos, completedCounts, isLoading } = useTodos()
  const [query, setQuery] = React.useState('')

  const statsByProject = React.useMemo(() => {
    const stats = new Map<string, ProjectStats>()
    for (const todo of todos) {
      for (const label of todo.labels ?? []) {
        const current = stats.get(label.id) ?? emptyStats()
        current[boardColumnForStatus(todo.status)] += 1
        stats.set(label.id, current)
      }
    }
    // Finished cards aren't fetched here — the board ships their tally instead.
    for (const [projectId, done] of Object.entries(
      completedCounts.COMPLETED.byProject,
    )) {
      const current = stats.get(projectId) ?? emptyStats()
      current.DONE = done
      stats.set(projectId, current)
    }
    return stats
  }, [todos, completedCounts])

  const projects = React.useMemo(
    () => searchProjects(sortProjectsByName(labels), query),
    [labels, query],
  )

  if (labelsLoading || isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-xl"
            style={{ backgroundColor: 'var(--surface-2)' }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search
            className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter projects..."
            aria-label="Filter projects"
            className="h-9 w-full rounded-lg border pr-3 pl-8 text-xs transition-colors outline-none"
            style={{
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)',
            }}
          />
        </div>
        <Link
          href={LABELS_ROUTE}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
          style={{
            backgroundColor: 'var(--surface-2)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-color)',
          }}
        >
          <Tags className="h-3.5 w-3.5" />
          Manage projects
        </Link>
      </div>

      {projects.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {query ? 'No projects match that filter.' : 'No projects yet.'}
          </p>
          <Link
            href={LABELS_ROUTE}
            className="text-xs font-medium underline underline-offset-4"
            style={{ color: 'var(--primary)' }}
          >
            Create one
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const stats = statsByProject.get(project.id) ?? emptyStats()
            const open =
              stats.BACKLOG +
              stats.IN_PROGRESS +
              stats.UNDER_REVIEW +
              stats.BLOCKED

            return (
              <Link
                key={project.id}
                href={projectHref(project.id)}
                className="group flex flex-col gap-3 rounded-xl border p-4 transition-all hover:-translate-y-0.5"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--surface)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span
                    className="min-w-0 flex-1 truncate text-sm font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {project.name}
                  </span>
                  <ArrowRight
                    className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60"
                    style={{ color: 'var(--text-muted)' }}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {SUMMARY_COLUMNS.map((column) => (
                    <div key={column.key} className="flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: column.color }}
                      />
                      <span
                        className="text-[11px] tabular-nums"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {stats[column.key]} {column.title.toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  className="h-1 overflow-hidden rounded-full"
                  style={{ backgroundColor: 'var(--surface-2)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${open + stats.DONE === 0 ? 0 : Math.round((stats.DONE / (open + stats.DONE)) * 100)}%`,
                      backgroundColor: 'var(--status-done)',
                    }}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
