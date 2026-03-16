import type { Todo, Label } from '@/types/todo'

export interface ColumnConfig {
  key: string       // label id or 'others'
  title: string
  color: string
  labelId?: string  // undefined for 'others'
}

/**
 * Build column configs from labels. Projects is always centered,
 * other labels are split alphabetically around it, Others is last.
 */
export function buildColumns(labels: Label[]): ColumnConfig[] {
  const projectsLabel = labels.find(l => l.name.toLowerCase() === 'projects')
  const otherLabels = labels
    .filter(l => l !== projectsLabel)
    .sort((a, b) => a.name.localeCompare(b.name))

  const columns: ColumnConfig[] = []

  // Split other labels into left and right of projects
  const midpoint = Math.ceil(otherLabels.length / 2)
  const leftLabels = otherLabels.slice(0, midpoint)
  const rightLabels = otherLabels.slice(midpoint)

  for (const label of leftLabels) {
    columns.push({ key: label.id, title: label.name, color: label.color, labelId: label.id })
  }

  if (projectsLabel) {
    columns.push({ key: projectsLabel.id, title: projectsLabel.name, color: projectsLabel.color, labelId: projectsLabel.id })
  }

  for (const label of rightLabels) {
    columns.push({ key: label.id, title: label.name, color: label.color, labelId: label.id })
  }

  // Others always last
  columns.push({ key: 'others', title: 'Others', color: 'var(--status-waiting)' })

  return columns
}

/**
 * Group todos into buckets matching the columns.
 * Each todo goes into the column of its first matching label.
 * Unlabeled todos go to "others".
 */
export function categorizeTodosByLabel(
  todos: Todo[],
  columns: ColumnConfig[]
): Record<string, Todo[]> {
  const labelIdToKey = new Map<string, string>()
  for (const col of columns) {
    if (col.labelId) labelIdToKey.set(col.labelId, col.key)
  }

  const result: Record<string, Todo[]> = {}
  for (const col of columns) {
    result[col.key] = []
  }

  for (const todo of todos) {
    const labels = todo.labels ?? []
    const matchingLabel = labels.find(l => labelIdToKey.has(l.id))

    if (matchingLabel) {
      result[labelIdToKey.get(matchingLabel.id)!].push(todo)
    } else {
      result['others'].push(todo)
    }
  }

  return result
}
