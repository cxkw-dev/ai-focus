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
  { value: 'LOW', label: 'Low', icon: bold(PhTilde), colorVar: 'var(--priority-low)' },
  { value: 'MEDIUM', label: 'Medium', icon: bold(PhEquals), colorVar: 'var(--priority-medium)' },
  { value: 'HIGH', label: 'High', icon: bold(PhArrowFatUp), colorVar: 'var(--priority-high)' },
  { value: 'URGENT', label: 'Urgent', icon: bold(PhLightning), colorVar: 'var(--priority-urgent)' },
]

export const PRIORITY_MAP = Object.fromEntries(
  PRIORITIES.map((p) => [p.value, p])
) as Record<Priority, (typeof PRIORITIES)[number]>
