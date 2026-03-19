import type { Todo, Label } from '@/types/todo'

export interface ColumnConfig {
  key: string       // label id or 'others'
  title: string
  color: string
  labelId?: string  // primary label for this column (undefined for 'others')
  labelIds?: string[] // all label ids that map to this column
}

/** Labels that share the "Others" column instead of getting their own. */
const MERGED_INTO_OTHERS = ['training']

/**
 * Build column configs from labels. Projects is always centered,
 * other labels are split alphabetically around it, Others is last.
 * Labels in MERGED_INTO_OTHERS are folded into the Others column.
 */
export function buildColumns(labels: Label[]): ColumnConfig[] {
  const projectsLabel = labels.find(l => l.name.toLowerCase() === 'projects')

  const mergedLabels = labels.filter(l =>
    MERGED_INTO_OTHERS.includes(l.name.toLowerCase())
  )
  const columnLabels = labels
    .filter(l => l !== projectsLabel && !mergedLabels.includes(l))
    .sort((a, b) => a.name.localeCompare(b.name))

  const columns: ColumnConfig[] = []

  // Split labels into left and right of projects
  const midpoint = Math.ceil(columnLabels.length / 2)
  const leftLabels = columnLabels.slice(0, midpoint)
  const rightLabels = columnLabels.slice(midpoint)

  for (const label of leftLabels) {
    columns.push({ key: label.id, title: label.name, color: label.color, labelId: label.id })
  }

  if (projectsLabel) {
    columns.push({ key: projectsLabel.id, title: projectsLabel.name, color: projectsLabel.color, labelId: projectsLabel.id })
  }

  for (const label of rightLabels) {
    columns.push({ key: label.id, title: label.name, color: label.color, labelId: label.id })
  }

  // Others column includes merged labels
  columns.push({
    key: 'others',
    title: 'Others',
    color: 'var(--status-waiting)',
    labelIds: mergedLabels.map(l => l.id),
  })

  return columns
}

/**
 * Group todos into buckets matching the columns.
 * Each todo goes into the column of its first matching label.
 * Unlabeled todos and todos whose only labels are merged go to "others".
 */
export function categorizeTodosByLabel(
  todos: Todo[],
  columns: ColumnConfig[]
): Record<string, Todo[]> {
  const labelIdToKey = new Map<string, string>()
  for (const col of columns) {
    if (col.labelId) labelIdToKey.set(col.labelId, col.key)
    // Map merged labels to the others column
    if (col.labelIds) {
      for (const id of col.labelIds) {
        labelIdToKey.set(id, col.key)
      }
    }
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
