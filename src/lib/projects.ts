import type { Label, Todo } from '@/types/todo'

/**
 * Projects are labels. The app is project-first: the sidebar lists them and each
 * one gets a board at /projects/<id>. This module owns that vocabulary so
 * components never have to think in terms of labels.
 */
export type Project = Label

export const PROJECTS_ROUTE = '/projects'

/** Bucket key for todos that belong to no project at all. */
export const NO_PROJECT_KEY = 'none'

export function projectHref(projectId: string) {
  return `${PROJECTS_ROUTE}/${projectId}`
}

export function findProject(projects: Project[], projectId: string) {
  return projects.find((project) => project.id === projectId)
}

export function todoBelongsToProject(todo: Todo, projectId: string) {
  return (todo.labels ?? []).some((label) => label.id === projectId)
}

export function todoHasNoProject(todo: Todo) {
  return (todo.labels ?? []).length === 0
}

export function filterTodosByProject(todos: Todo[], projectId: string) {
  return todos.filter((todo) => todoBelongsToProject(todo, projectId))
}

export function filterTodosWithoutProject(todos: Todo[]) {
  return todos.filter(todoHasNoProject)
}

/**
 * Count todos per project id. A todo with several projects counts toward each of
 * them; unassigned todos land under NO_PROJECT_KEY.
 */
export function countTodosByProject(todos: Todo[]): Record<string, number> {
  const counts: Record<string, number> = {}

  for (const todo of todos) {
    const labels = todo.labels ?? []
    if (labels.length === 0) {
      counts[NO_PROJECT_KEY] = (counts[NO_PROJECT_KEY] ?? 0) + 1
      continue
    }
    for (const label of labels) {
      counts[label.id] = (counts[label.id] ?? 0) + 1
    }
  }

  return counts
}

export interface ProjectTodoGroup {
  /** null for the "no project" bucket. */
  projectId: string | null
  name: string
  color: string
  todos: Todo[]
}

const NO_PROJECT_COLOR = 'var(--status-waiting)'

/**
 * Group todos under their primary (first) project for overview surfaces. Unlike
 * countTodosByProject a todo appears exactly once, so the groups partition the
 * list. Groups are name-sorted with "No project" pinned last.
 */
export function groupTodosByProject(todos: Todo[]): ProjectTodoGroup[] {
  const groups = new Map<string, ProjectTodoGroup>()

  for (const todo of todos) {
    const primary = (todo.labels ?? [])[0]
    const key = primary?.id ?? NO_PROJECT_KEY
    const existing = groups.get(key)

    if (existing) {
      existing.todos.push(todo)
      continue
    }

    groups.set(key, {
      projectId: primary?.id ?? null,
      name: primary?.name ?? 'No project',
      color: primary?.color ?? NO_PROJECT_COLOR,
      todos: [todo],
    })
  }

  return [...groups.values()].sort((a, b) => {
    if (a.projectId === null) return 1
    if (b.projectId === null) return -1
    return a.name.localeCompare(b.name)
  })
}

type NamedProject = Pick<Project, 'name'>

export function searchProjects<T extends NamedProject>(
  projects: T[],
  query: string,
): T[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return projects
  return projects.filter((project) =>
    project.name.toLowerCase().includes(trimmed),
  )
}

export function sortProjectsByName<T extends NamedProject>(projects: T[]): T[] {
  return [...projects].sort((a, b) => a.name.localeCompare(b.name))
}
