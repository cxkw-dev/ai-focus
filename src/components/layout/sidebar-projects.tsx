'use client'

import * as React from 'react'
import Link, { useLinkStatus } from 'next/link'
import { RiGithubFill } from 'react-icons/ri'
import { Icon } from '@/components/ui/icon'
import { Tip } from '@/components/ui/tooltip'
import { useProjectNav, type ProjectNavItem } from '@/hooks/use-project-nav'
import { cssVars } from '@/lib/utils'
import { PROJECTS_ROUTE, projectHref, searchProjects } from '@/lib/projects'

/** Above this many projects the panel grows a filter box. */
const FILTER_THRESHOLD = 6

/** The side nav's page panel: every project as a link to its board, with its open count. */
export function SidebarProjects({ pathname }: { pathname: string }) {
  const { projects, isLoading } = useProjectNav()
  const [query, setQuery] = React.useState('')

  const visibleProjects = searchProjects(projects, query)
  const openTotal = projects.reduce((sum, p) => sum + p.openCount, 0)

  return (
    <div className="dd-side-nav__pane">
      <div className="dd-side-nav__head">
        <span className="dd-side-nav__title">focus</span>
      </div>

      <Link
        href={PROJECTS_ROUTE}
        className="dd-side-nav__link"
        aria-current={pathname === PROJECTS_ROUTE ? 'page' : undefined}
      >
        <Icon name="grid" />
        <span className="dd-side-nav__label">All projects</span>
        {openTotal > 0 && (
          <span className="dd-side-nav__count">{openTotal}</span>
        )}
      </Link>

      <p className="dd-side-nav__section flex items-baseline justify-between">
        <span>Projects</span>
        <span className="text-muted font-normal tabular-nums">
          {projects.length}
        </span>
      </p>

      {projects.length > FILTER_THRESHOLD && (
        <div className="dd-input dd-input--sm mb-1">
          <span className="dd-input__affix">
            <Icon name="search" />
          </span>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter projects"
            aria-label="Filter projects"
            className="dd-input__control"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="dd-input__btn"
              aria-label="Clear project filter"
            >
              <Icon name="x" />
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <ProjectListSkeleton />
      ) : visibleProjects.length === 0 ? (
        <p className="text-muted px-2 py-2 text-xs">
          {projects.length === 0
            ? 'No projects yet.'
            : 'No projects match that filter.'}
        </p>
      ) : (
        visibleProjects.map((project) => (
          <ProjectLink
            key={project.id}
            project={project}
            current={pathname === projectHref(project.id)}
          />
        ))
      )}
    </div>
  )
}

function ProjectLink({
  project,
  current,
}: {
  project: ProjectNavItem
  current: boolean
}) {
  return (
    <div className="group/project relative">
      <Link
        href={projectHref(project.id)}
        className="dd-side-nav__link pr-8"
        aria-current={current ? 'page' : undefined}
        style={cssVars({ '--project': project.color })}
      >
        <ProjectRowContent project={project} />
      </Link>
      {project.repoUrl && (
        <Tip label="Open on GitHub" side="right">
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="rounded-ctl text-quiet hover:bg-wash-strong hover:text-text absolute top-1/2 right-1 grid size-6 -translate-y-1/2 place-items-center opacity-0 transition-opacity group-hover/project:opacity-100 focus-visible:opacity-100"
            aria-label={`Open ${project.name} on GitHub`}
          >
            <RiGithubFill className="size-[1.05em]" aria-hidden="true" />
          </a>
        </Tip>
      )}
    </div>
  )
}

/**
 * Rendered inside the Link so it can read the router's pending state. Big boards take a moment to render, so the row
 * shows the click landed.
 */
function ProjectRowContent({ project }: { project: ProjectNavItem }) {
  const { pending } = useLinkStatus()

  return (
    <>
      <span
        className="dd-side-nav__dot bg-[var(--project)]"
        aria-hidden="true"
      />
      <span className="dd-side-nav__label">{project.name}</span>
      {pending ? (
        <span
          className="dd-spinner dd-spinner--sm dd-spinner--muted"
          aria-hidden="true"
        />
      ) : (
        project.openCount > 0 && (
          <span className="dd-side-nav__count">{project.openCount}</span>
        )
      )}
    </>
  )
}

function ProjectListSkeleton() {
  return (
    <div className="flex flex-col gap-1.5 px-2 py-1" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span key={index} className="dd-skeleton dd-skeleton--text" />
      ))}
    </div>
  )
}
