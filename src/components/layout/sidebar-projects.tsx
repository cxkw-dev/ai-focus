'use client'

import * as React from 'react'
import Link, { useLinkStatus } from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Search, X } from 'lucide-react'
import { RiFolder3Line, RiGithubFill } from 'react-icons/ri'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useProjectNav, type ProjectNavItem } from '@/hooks/use-project-nav'
import { cn } from '@/lib/utils'
import { PROJECTS_ROUTE, projectHref, searchProjects } from '@/lib/projects'

/** Above this many projects the sidebar grows a filter box. */
const FILTER_THRESHOLD = 6

interface SidebarProjectsProps {
  collapsed: boolean
  pathname: string
}

export function SidebarProjects({ collapsed, pathname }: SidebarProjectsProps) {
  const { projects, isLoading } = useProjectNav()
  const [query, setQuery] = React.useState('')

  const visibleProjects = React.useMemo(
    () => searchProjects(projects, query),
    [projects, query],
  )

  const isProjectsRoot = pathname === PROJECTS_ROUTE

  if (collapsed) {
    return (
      <nav
        className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto border-t px-2 py-3"
        style={{ borderColor: 'var(--border-color)' }}
        aria-label="Projects"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={PROJECTS_ROUTE}
              className="flex items-center justify-center rounded-lg py-2.5"
              style={{
                color: isProjectsRoot ? 'var(--primary)' : 'var(--text-muted)',
                backgroundColor: isProjectsRoot
                  ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
                  : undefined,
              }}
            >
              <RiFolder3Line className="h-5 w-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            Projects
          </TooltipContent>
        </Tooltip>

        {projects.map((project) => {
          const href = projectHref(project.id)
          const isActive = pathname === href
          return (
            <Tooltip key={project.id}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  className="flex items-center justify-center rounded-lg py-2"
                  style={{
                    backgroundColor: isActive
                      ? `color-mix(in srgb, ${project.color} 18%, transparent)`
                      : undefined,
                  }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: project.color,
                      opacity: isActive ? 1 : 0.65,
                    }}
                  />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {project.name}
                {project.openCount > 0 ? ` · ${project.openCount} open` : ''}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </nav>
    )
  }

  return (
    <nav
      className="flex min-h-0 flex-1 flex-col border-t p-3"
      style={{ borderColor: 'var(--border-color)' }}
      aria-label="Projects"
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <Link
          href={PROJECTS_ROUTE}
          className="text-[10px] font-bold tracking-widest uppercase transition-colors"
          style={{
            color: isProjectsRoot ? 'var(--primary)' : 'var(--text-muted)',
          }}
        >
          Projects
        </Link>
        <span
          className="text-[10px] tabular-nums"
          style={{ color: 'var(--text-muted)', opacity: 0.7 }}
        >
          {projects.length}
        </span>
      </div>

      {projects.length > FILTER_THRESHOLD && (
        <div className="relative mb-2">
          <Search
            className="absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter projects"
            aria-label="Filter projects"
            className="h-7 w-full rounded-md border pr-6 pl-7 text-[11px] transition-colors outline-none"
            style={{
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-0.5"
              aria-label="Clear project filter"
            >
              <X
                className="h-2.5 w-2.5"
                style={{ color: 'var(--text-muted)' }}
              />
            </button>
          )}
        </div>
      )}

      <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {isLoading ? (
          <ProjectListSkeleton />
        ) : visibleProjects.length === 0 ? (
          <p
            className="px-2 py-3 text-[11px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {projects.length === 0
              ? 'No projects yet.'
              : 'No projects match that filter.'}
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {visibleProjects.map((project) => {
              const href = projectHref(project.id)
              const isActive = pathname === href
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="relative"
                >
                  <Link
                    href={href}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 pr-7 text-[13px] transition-colors"
                    style={{
                      backgroundColor: isActive
                        ? `color-mix(in srgb, ${project.color} 14%, transparent)`
                        : 'transparent',
                      color: isActive
                        ? 'var(--text-primary)'
                        : 'var(--text-muted)',
                      fontWeight: isActive ? 600 : 500,
                    }}
                  >
                    <ProjectRowContent project={project} isActive={isActive} />
                  </Link>
                  {project.repoUrl && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center justify-center rounded p-1 transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          aria-label={`Open ${project.name} on GitHub`}
                        >
                          <RiGithubFill className="h-3.5 w-3.5" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        Open on GitHub
                      </TooltipContent>
                    </Tooltip>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </nav>
  )
}

/**
 * Rendered inside the Link so it can read the router's pending state. Board
 * rendering takes long enough on big projects that without this the row gives
 * no sign the click landed.
 */
function ProjectRowContent({
  project,
  isActive,
}: {
  project: ProjectNavItem
  isActive: boolean
}) {
  const { pending } = useLinkStatus()

  return (
    <>
      <span
        className={cn(
          'h-2 w-2 flex-shrink-0 rounded-full',
          pending && 'animate-pulse',
        )}
        style={{
          backgroundColor: project.color,
          boxShadow:
            isActive || pending
              ? `0 0 0 3px color-mix(in srgb, ${project.color} 22%, transparent)`
              : 'none',
        }}
      />
      <span className="min-w-0 flex-1 truncate">{project.name}</span>
      {pending ? (
        <Loader2
          className="h-3 w-3 flex-shrink-0 animate-spin"
          style={{ color: project.color }}
        />
      ) : (
        project.openCount > 0 && (
          <span
            className="flex-shrink-0 text-[10px] tabular-nums"
            style={{
              color: isActive ? project.color : 'var(--text-muted)',
              opacity: isActive ? 1 : 0.7,
            }}
          >
            {project.openCount}
          </span>
        )
      )}
    </>
  )
}

function ProjectListSkeleton() {
  return (
    <div className="flex flex-col gap-1.5 px-1 py-1">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="h-6 animate-pulse rounded-md"
          style={{ backgroundColor: 'var(--surface-2)' }}
        />
      ))}
    </div>
  )
}
