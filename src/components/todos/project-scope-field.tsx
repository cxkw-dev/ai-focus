'use client'

import { Chip } from '@/components/ui/chip'
import { cn } from '@/lib/utils'
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
    <div className={cn('dd-field dd-field--above', className)}>
      <span className="dd-field__label">Project</span>
      <div>
        <ProjectScopeChip project={project} />
      </div>
      <p className="dd-field__hint">
        Files into this project. Switch boards to add it elsewhere.
      </p>
    </div>
  )
}

/** Compact single-line variant for the inline lane form. */
export function ProjectScopeChip({ project }: { project: Project }) {
  return (
    <Chip color={project.color} className="max-w-full">
      <span className="truncate">{project.name}</span>
    </Chip>
  )
}
