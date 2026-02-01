'use client'

import * as React from 'react'
import { AlertTriangle, Circle, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Priority } from '@/types/todo'
import './flame.css'

interface PriorityBadgeProps {
  priority: Priority
  size?: 'sm' | 'md'
}

const priorityConfig: Record<Priority, {
  label: string
  icon: React.ElementType
  colorVar: string
}> = {
  URGENT: {
    label: 'Urgent',
    icon: Circle,
    colorVar: 'var(--priority-urgent)',
  },
  HIGH: {
    label: 'High',
    icon: AlertTriangle,
    colorVar: 'var(--priority-high)',
  },
  MEDIUM: {
    label: 'Medium',
    icon: Circle,
    colorVar: 'var(--priority-medium)',
  },
  LOW: {
    label: 'Low',
    icon: ArrowDown,
    colorVar: 'var(--priority-low)',
  },
}

// CodePen-style animated fire
function FireIcon({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const scale = size === 'sm' ? 14 : 18

  return (
    <div className="fire-icon" style={{ width: scale, height: scale }}>
      <div className="fire-flames">
        <div className="fire-flame" />
        <div className="fire-flame" />
        <div className="fire-flame" />
        <div className="fire-flame" />
      </div>
    </div>
  )
}

export function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${config.colorVar} 10%, transparent)`,
        borderColor: `color-mix(in srgb, ${config.colorVar} 25%, transparent)`,
        color: config.colorVar,
      }}
    >
      {priority === 'URGENT' ? (
        <FireIcon size={size} />
      ) : (
        <Icon
          className={cn(
            size === 'sm' ? 'h-3 w-3' : 'h-4 w-4',
            priority === 'MEDIUM' && 'fill-current'
          )}
        />
      )}
      <span className="font-medium">
        {config.label}
      </span>
    </div>
  )
}

// Compact version for inline use
export function PriorityDot({ priority }: { priority: Priority }) {
  const config = priorityConfig[priority]

  return (
    <div
      className="h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: config.colorVar }}
    />
  )
}
