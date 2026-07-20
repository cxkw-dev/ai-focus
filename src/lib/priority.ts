import React from 'react'
import {
  Tilde as PhTilde,
  Equals as PhEquals,
  ArrowFatUp as PhArrowFatUp,
  Lightning as PhLightning,
} from '@phosphor-icons/react'
import type { Priority } from '@/types/todo'

// Wrap Phosphor icons with bold weight baked in
function bold(Icon: React.ElementType): React.ElementType {
  const Wrapped = (props: Record<string, unknown>) =>
    React.createElement(Icon, { ...props, weight: 'bold' })
  Wrapped.displayName = `Bold(${(Icon as { displayName?: string }).displayName ?? 'Icon'})`
  return Wrapped
}

export const PRIORITIES: {
  value: Priority
  label: string
  icon: React.ElementType
  colorVar: string
}[] = [
  {
    value: 'LOW',
    label: 'Low',
    icon: bold(PhTilde),
    colorVar: 'var(--priority-low)',
  },
  {
    value: 'MEDIUM',
    label: 'Medium',
    icon: bold(PhEquals),
    colorVar: 'var(--priority-medium)',
  },
  {
    value: 'HIGH',
    label: 'High',
    icon: bold(PhArrowFatUp),
    colorVar: 'var(--priority-high)',
  },
  {
    value: 'URGENT',
    label: 'Urgent',
    icon: bold(PhLightning),
    colorVar: 'var(--priority-urgent)',
  },
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

// Keys into the ChartColors palette (see lib/themes.ts).
export const PRIORITY_COLOR_KEYS: Record<Priority, string> = {
  LOW: 'priorityLow',
  MEDIUM: 'priorityMedium',
  HIGH: 'priorityHigh',
  URGENT: 'priorityUrgent',
}
