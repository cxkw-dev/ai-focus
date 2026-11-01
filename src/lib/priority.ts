import type { IconName } from '@/components/ui/icon'
import type { Priority } from '@/types/todo'

// Priority is a severity scale: quiet → warn → terracotta → bad. Icons are dawn & dusk names.
export const PRIORITIES: {
  value: Priority
  label: string
  icon: IconName
  colorVar: string
}[] = [
  {
    value: 'LOW',
    label: 'Low',
    icon: 'arrow-down',
    colorVar: 'var(--dd-muted)',
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
    icon: 'minus',
    colorVar: 'var(--dd-warn)',
  },
  {
    value: 'HIGH',
    label: 'High',
    icon: 'arrow-up',
    colorVar: 'var(--dd-set-4)',
  },
  { value: 'URGENT', label: 'Urgent', icon: 'bolt', colorVar: 'var(--dd-bad)' },
]

export const PRIORITY_MAP = Object.fromEntries(
  PRIORITIES.map((p) => [p.value, p]),
) as Record<Priority, (typeof PRIORITIES)[number]>

export const PRIORITY_LABELS = Object.fromEntries(
  PRIORITIES.map((p) => [p.value, p.label]),
) as Record<Priority, string>

export const PRIORITY_COLOR_VARS = Object.fromEntries(
  PRIORITIES.map((p) => [p.value, p.colorVar]),
) as Record<Priority, string>

// Keys into the chart palette (hooks/use-chart-colors.ts).
export const PRIORITY_COLOR_KEYS: Record<Priority, string> = {
  LOW: 'priorityLow',
  MEDIUM: 'priorityMedium',
  HIGH: 'priorityHigh',
  URGENT: 'priorityUrgent',
}
