import type { FocusFlowData, FocusFlowNode } from '@/types/stats'

export const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

const MAX_FOCUS_AREAS = 6
const OTHER_FOCUS_ID = '__other__'
const UNLABELED_FOCUS_ID = '__unlabeled__'

interface FocusFlowLabel {
  id: string
  name: string
  color: string
}

interface FocusFlowTodo {
  completedAt: Date | string | null
  labels: FocusFlowLabel[]
}

interface FocusBucketMeta {
  id: string
  name: string
  shortLabel: string
  kind: FocusFlowNode['kind']
  labelColor: string | null
}

function roundFlow(value: number) {
  return Math.round(value * 100) / 100
}

function shortenLabel(name: string) {
  if (name.length <= 18) return name
  return `${name.slice(0, 17).trimEnd()}...`
}

function sumValues(values: Iterable<number>) {
  let total = 0
  for (const value of values) total += value
  return total
}

export function buildReviewFocusFlow(todos: FocusFlowTodo[]): FocusFlowData {
  const monthBuckets = new Map<number, Map<string, number>>()
  const bucketTotals = new Map<string, number>()
  const bucketMeta = new Map<string, FocusBucketMeta>()

  bucketMeta.set(UNLABELED_FOCUS_ID, {
    id: UNLABELED_FOCUS_ID,
    name: 'Unlabeled',
    shortLabel: 'Unlabeled',
    kind: 'unlabeled',
    labelColor: null,
  })

  for (const todo of todos) {
    if (!todo.completedAt) continue

    const completedAt = new Date(todo.completedAt)
    if (Number.isNaN(completedAt.getTime())) continue

    const month = completedAt.getMonth()
    const monthMap = monthBuckets.get(month) ?? new Map<string, number>()

    if (todo.labels.length === 0) {
      monthMap.set(UNLABELED_FOCUS_ID, (monthMap.get(UNLABELED_FOCUS_ID) ?? 0) + 1)
      bucketTotals.set(
        UNLABELED_FOCUS_ID,
        (bucketTotals.get(UNLABELED_FOCUS_ID) ?? 0) + 1,
      )
      monthBuckets.set(month, monthMap)
      continue
    }

    const weight = 1 / todo.labels.length

    for (const label of todo.labels) {
      bucketMeta.set(label.id, {
        id: label.id,
        name: label.name,
        shortLabel: shortenLabel(label.name),
        kind: 'label',
        labelColor: label.color,
      })
      monthMap.set(label.id, (monthMap.get(label.id) ?? 0) + weight)
      bucketTotals.set(label.id, (bucketTotals.get(label.id) ?? 0) + weight)
    }

    monthBuckets.set(month, monthMap)
  }

  const rankedBuckets = Array.from(bucketTotals.entries())
    .map(([id, total]) => ({
      meta: bucketMeta.get(id)!,
      total,
    }))
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total
      return a.meta.name.localeCompare(b.meta.name)
    })

  const featuredBuckets = rankedBuckets.slice(0, MAX_FOCUS_AREAS)
  const featuredIds = new Set(featuredBuckets.map((bucket) => bucket.meta.id))
  const otherTotal = roundFlow(
    rankedBuckets
      .slice(MAX_FOCUS_AREAS)
      .reduce((total, bucket) => total + bucket.total, 0),
  )

  const monthNodes: FocusFlowNode[] = Array.from(monthBuckets.entries())
    .map(([month, values]) => ({
      id: `month-${month}`,
      name: MONTH_LABELS[month],
      shortLabel: MONTH_LABELS[month],
      kind: 'month' as const,
      total: roundFlow(sumValues(values.values())),
      month,
      labelColor: null,
    }))
    .filter((node) => node.total > 0)
    .sort((a, b) => (a.month ?? 0) - (b.month ?? 0))

  const focusNodes: FocusFlowNode[] = featuredBuckets.map(({ meta, total }) => ({
    id: meta.id,
    name: meta.name,
    shortLabel: meta.shortLabel,
    kind: meta.kind,
    total: roundFlow(total),
    labelColor: meta.labelColor,
  }))

  if (otherTotal > 0) {
    focusNodes.push({
      id: OTHER_FOCUS_ID,
      name: 'Other labels',
      shortLabel: 'Other',
      kind: 'other',
      total: otherTotal,
      labelColor: null,
    })
  }

  const nodes = [...monthNodes, ...focusNodes]
  const nodeIndex = new Map(nodes.map((node, index) => [node.id, index]))
  const links: FocusFlowData['links'] = []

  for (const monthNode of monthNodes) {
    const month = monthNode.month
    if (month === undefined) continue

    const monthMap = monthBuckets.get(month)
    if (!monthMap) continue

    const groupedTargets = new Map<string, number>()

    for (const [bucketId, value] of monthMap.entries()) {
      const targetId = featuredIds.has(bucketId) ? bucketId : OTHER_FOCUS_ID
      if (!nodeIndex.has(targetId)) continue

      groupedTargets.set(targetId, (groupedTargets.get(targetId) ?? 0) + value)
    }

    for (const [targetId, value] of groupedTargets.entries()) {
      if (value <= 0) continue

      links.push({
        source: nodeIndex.get(monthNode.id)!,
        target: nodeIndex.get(targetId)!,
        value: roundFlow(value),
      })
    }
  }

  return { nodes, links }
}
