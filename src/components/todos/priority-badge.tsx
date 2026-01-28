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
  bgClass: string
  textClass: string
  borderClass: string
}> = {
  URGENT: {
    label: 'Urgent',
    icon: Circle,
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-500',
    borderClass: 'border-red-500/25',
  },
  HIGH: {
    label: 'High',
    icon: AlertTriangle,
    bgClass: 'bg-[#E39A7B]/10',
    textClass: 'text-[#E39A7B]',
    borderClass: 'border-[#E39A7B]/25',
  },
  MEDIUM: {
    label: 'Medium',
    icon: Circle,
    bgClass: 'bg-[#DBB06B]/10',
    textClass: 'text-[#DBB06B]',
    borderClass: 'border-[#DBB06B]/25',
  },
  LOW: {
    label: 'Low',
    icon: ArrowDown,
    bgClass: 'bg-slate-500/10',
    textClass: 'text-slate-400',
    borderClass: 'border-slate-500/20',
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
        config.bgClass,
        config.borderClass,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {priority === 'URGENT' ? (
        <FireIcon size={size} />
      ) : (
        <Icon className={cn(
          config.textClass,
          size === 'sm' ? 'h-3 w-3' : 'h-4 w-4',
          priority === 'MEDIUM' && 'fill-current'
        )} />
      )}
      <span className={cn('font-medium', config.textClass)}>
        {config.label}
      </span>
    </div>
  )
}

// Compact version for inline use
export function PriorityDot({ priority }: { priority: Priority }) {
  return (
    <div
      className={cn(
        'h-2.5 w-2.5 rounded-full',
        priority === 'URGENT' && 'bg-red-500',
        priority === 'HIGH' && 'bg-[#E39A7B]',
        priority === 'MEDIUM' && 'bg-[#DBB06B]',
        priority === 'LOW' && 'bg-slate-400'
      )}
    />
  )
}
