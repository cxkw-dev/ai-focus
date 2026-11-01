'use client'

import * as React from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
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
import { STATUS_CONFIG } from '@/lib/status'
import { cssVars } from '@/lib/utils'

type ProjectStats = Record<BoardColumnKey, number>

/** Cancelled work is neither open nor progress — the cards never mention it. */
const SUMMARY_COLUMNS = BOARD_COLUMNS.filter(
  (column) => column.key !== 'CANCELLED',
)

/** Everything still on the board, however stalled, counts as open. */
const OPEN_COLUMNS = BOARD_COLUMNS.filter((column) => !column.terminal)

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
      <div className="dd-skeleton-group" aria-busy="true">
        <span className="dd-visually-hidden">Loading projects…</span>
        <span
          className="dd-skeleton dd-skeleton--button w-64"
          aria-hidden="true"
        />
        <div
          className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-3"
          aria-hidden="true"
        >
          {[...Array(6)].map((_, index) => (
            <span key={index} className="dd-skeleton rounded-box h-28" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter projects"
          aria-label="Filter projects"
          leading={<Icon name="search" />}
          boxClassName="w-full max-w-xs"
        />
        <Link href={LABELS_ROUTE} className="dd-btn dd-btn--secondary">
          <Icon name="tag" />
          <span>Manage projects</span>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="dd-surface">
          <div className="dd-empty-state">
            <div className="dd-empty-state__icon">
              <Icon name={query ? 'search' : 'folder'} />
            </div>
            <h2 className="dd-empty-state__title">
              {query ? 'No projects match that filter' : 'No projects yet'}
            </h2>
            <p className="dd-empty-state__text">
              Projects are labels: every task filed under one shows up on its
              board.
            </p>
            <div className="dd-empty-state__actions">
              <Link href={LABELS_ROUTE} className="dd-btn dd-btn--sm">
                <Icon name="plus" />
                <span>Create one</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-3">
          {projects.map((project) => {
            const stats = statsByProject.get(project.id) ?? emptyStats()
            const open = OPEN_COLUMNS.reduce(
              (total, column) => total + stats[column.key],
              0,
            )
            const total = open + stats.DONE
            const percentDone =
              total === 0 ? 0 : Math.round((stats.DONE / total) * 100)
            const progressLabelId = `${project.id}-progress`

            return (
              <Link
                key={project.id}
                href={projectHref(project.id)}
                className="dd-card dd-card--link dd-card--compact"
              >
                <div className="dd-card__body">
                  <h3 className="dd-card__title flex items-center gap-2">
                    <span
                      className="size-2.5 flex-none rounded-full bg-(--project)"
                      style={cssVars({ '--project': project.color })}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 truncate">{project.name}</span>
                  </h3>

                  <ul className="text-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    {SUMMARY_COLUMNS.map((column) => {
                      const status = STATUS_CONFIG[column.dropStatus]
                      return (
                        <li
                          key={column.key}
                          className="inline-flex items-center gap-1"
                        >
                          <Icon
                            name={status.icon}
                            style={{ color: status.colorVar }}
                          />
                          <b className="text-text font-mono font-medium tabular-nums">
                            {stats[column.key]}
                          </b>
                          {column.title.toLowerCase()}
                        </li>
                      )
                    })}
                  </ul>

                  <div className="dd-progress dd-progress--sm mt-1.5">
                    <div className="dd-progress__head">
                      <span
                        className="dd-progress__label text-muted text-xs"
                        id={progressLabelId}
                      >
                        Done
                      </span>
                      <span className="dd-progress__value">
                        <b>{stats.DONE}</b> / {total}
                      </span>
                    </div>
                    <div
                      className="dd-progress__track"
                      role="progressbar"
                      aria-labelledby={progressLabelId}
                      aria-valuenow={percentDone}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      style={cssVars({ '--dd-value': String(percentDone) })}
                    >
                      <div className="dd-progress__fill" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
