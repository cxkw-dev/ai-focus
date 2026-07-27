'use client'

import { FolderOpen } from 'lucide-react'
import type { Project } from '@/lib/projects'

/**
 * Tasks are always created from inside a project board, so the project is a
 * fact about where you are, not a choice to re-make in the form. Showing the
 * full label picker here invited filing an AMEX task under DMV by mistake.
 */
export function ProjectScopeField({
  project,
  className,
}: {
  project: Project
  className?: string
}) {
  return (
    <div className={className}>
      <span
        className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
        style={{ color: 'var(--text-muted)' }}
      >
        <FolderOpen className="h-3.5 w-3.5" />
        Project
      </span>
      <div
        className="mt-2 flex items-center gap-2 rounded-md border px-2.5 py-2"
        style={{
          borderColor: `color-mix(in srgb, ${project.color} 40%, transparent)`,
          backgroundColor: `color-mix(in srgb, ${project.color} 10%, transparent)`,
        }}
      >
        <span
          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
          style={{ backgroundColor: project.color }}
        />
        <span
          className="min-w-0 flex-1 truncate text-[11px] font-semibold"
          style={{ color: project.color }}
        >
          {project.name}
        </span>
      </div>
    </div>
  )
}

/** Compact single-line variant for the inline lane form. */
export function ProjectScopeChip({ project }: { project: Project }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{
        backgroundColor: `color-mix(in srgb, ${project.color} 15%, transparent)`,
        color: project.color,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: project.color }}
      />
      {project.name}
    </span>
  )
}
