import type { Todo, Label } from '@/types/todo'

export interface ColumnConfig {
  key: string // label id or 'others'
  title: string
  color: string
  labelId?: string // primary label for this column (undefined for 'others')
  labelIds?: string[] // all label ids that map to this column
}

/** Labels that share the "Others" column instead of getting their own. */
const MERGED_INTO_OTHERS = ['training']

/**
 * Build column configs from labels. KAF is always first,
 * Others is always last, everything else sorted alphabetically in between.
 * Labels in MERGED_INTO_OTHERS are folded into the Others column.
 */
export function buildColumns(labels: Label[]): ColumnConfig[] {
  const kafLabel = labels.find((l) => l.name.toLowerCase() === 'kaf')

  const mergedLabels = labels.filter((l) =>
    MERGED_INTO_OTHERS.includes(l.name.toLowerCase()),
  )
  const middleLabels = labels
    .filter((l) => l !== kafLabel && !mergedLabels.includes(l))
    .sort((a, b) => a.name.localeCompare(b.name))

  const columns: ColumnConfig[] = []

  // KAF always first
  if (kafLabel) {
    columns.push({
      key: kafLabel.id,
      title: kafLabel.name,
      color: kafLabel.color,
      labelId: kafLabel.id,
    })
  }

  // Everything else alphabetically in between
  for (const label of middleLabels) {
    columns.push({
      key: label.id,
      title: label.name,
      color: label.color,
      labelId: label.id,
    })
  }

  // Others column always last, includes merged labels
  columns.push({
    key: 'others',
    title: 'Others',
    color: 'var(--status-waiting)',
    labelIds: mergedLabels.map((l) => l.id),
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
  columns: ColumnConfig[],
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
    const matchingLabel = labels.find((l) => labelIdToKey.has(l.id))

    if (matchingLabel) {
      result[labelIdToKey.get(matchingLabel.id)!].push(todo)
    } else {
      result['others'].push(todo)
    }
  }

  return result
}
