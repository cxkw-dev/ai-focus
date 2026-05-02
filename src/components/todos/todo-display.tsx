'use client'

import * as React from 'react'
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Eye,
  Pause,
  Play,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PRIORITY_MAP } from '@/lib/priority'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Label, Priority, Status, Todo } from '@/types/todo'

export const CHIP_BASE =
  'h-5 px-1.5 rounded text-[10px] font-medium inline-flex items-center gap-1 transition-colors whitespace-nowrap'

export const STATUS_CONFIG: Record<
  Status,
  { label: string; icon: React.ElementType; colorVar: string; bgVar: string }
> = {
  TODO: {
    label: 'To Do',
    icon: Circle,
    colorVar: 'var(--status-todo)',
    bgVar: 'var(--status-todo)',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: Play,
    colorVar: 'var(--status-in-progress)',
    bgVar: 'var(--status-in-progress)',
  },
  WAITING: {
    label: 'Waiting',
    icon: Clock,
    colorVar: 'var(--status-waiting)',
    bgVar: 'var(--status-waiting)',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    icon: Eye,
    colorVar: 'var(--status-under-review)',
    bgVar: 'var(--status-under-review)',
  },
  ON_HOLD: {
    label: 'On Hold',
    icon: Pause,
    colorVar: 'var(--status-on-hold)',
    bgVar: 'var(--status-on-hold)',
  },
  BLOCKED: {
    label: 'Blocked',
    icon: Ban,
    colorVar: 'var(--status-blocked)',
    bgVar: 'var(--status-blocked)',
  },
  COMPLETED: {
    label: 'Done',
    icon: CheckCircle2,
    colorVar: 'var(--status-done)',
    bgVar: 'var(--status-done)',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    colorVar: 'var(--status-on-hold)',
    bgVar: 'var(--status-on-hold)',
  },
}

export const COLLAPSED_STATUSES = new Set<Status>([
  'WAITING',
  'UNDER_REVIEW',
  'ON_HOLD',
  'BLOCKED',
])

export const PRIORITY_CONFIG: Record<
  Priority,
  {
    label: string
    colorVar: string
    bgVar: string
    icon: React.ElementType
    pulse?: boolean
  }
> = Object.fromEntries(
  Object.entries(PRIORITY_MAP).map(([key, p]) => [
    key,
    {
      label: p.label,
      colorVar: p.colorVar,
      bgVar: p.colorVar,
      icon: p.icon,
      ...(key === 'URGENT' || key === 'HIGH' ? { pulse: true } : {}),
    },
  ]),
) as Record<
  Priority,
  {
    label: string
    colorVar: string
    bgVar: string
    icon: React.ElementType
    pulse?: boolean
  }
>

export function StatusChip({
  status,
  className,
}: {
  status: Status
  className?: string
}) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <span
      className={cn(CHIP_BASE, 'min-w-0', className)}
      style={{
        backgroundColor: `color-mix(in srgb, ${config.bgVar} 15%, transparent)`,
        color: config.colorVar,
      }}
    >
      <Icon className="h-3 w-3 flex-shrink-0" />
      <span className="truncate">{config.label}</span>
    </span>
  )
}

export function PriorityChip({
  priority,
  className,
}: {
  priority: Priority
  className?: string
}) {
  const config = PRIORITY_CONFIG[priority]

  return (
    <span
      className={cn(CHIP_BASE, className)}
      style={{
        backgroundColor: config.pulse
          ? config.colorVar
          : `color-mix(in srgb, ${config.bgVar} 15%, transparent)`,
        color: config.pulse ? 'var(--background)' : config.colorVar,
        fontWeight: config.pulse ? 700 : undefined,
      }}
    >
      {config.label}
    </span>
  )
}

export function TodoLabelChip({
  label,
  className,
}: {
  label: Label
  className?: string
}) {
  return (
    <span
      className={cn(CHIP_BASE, 'font-semibold', className)}
      style={{
        backgroundColor: `color-mix(in srgb, ${label.color} 15%, transparent)`,
        color: label.color,
      }}
    >
      {label.name}
    </span>
  )
}

export function StatusDropdown({
  todo,
  onStatusChange,
}: {
  todo: Todo
  onStatusChange: (id: string, status: Status) => void
}) {
  const config = STATUS_CONFIG[todo.status]
  const Icon = config.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            CHIP_BASE,
            'min-w-0 cursor-pointer hover:brightness-110',
          )}
          style={{
            backgroundColor: `color-mix(in srgb, ${config.bgVar} 15%, transparent)`,
            color: config.colorVar,
          }}
        >
          <Icon className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{config.label}</span>
          <ChevronDown className="h-2.5 w-2.5 flex-shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="border-border/50 min-w-[150px] p-1"
        style={{ backgroundColor: 'var(--surface-2)' }}
      >
        {(Object.keys(STATUS_CONFIG) as Status[]).map((status) => {
          const statusConfig = STATUS_CONFIG[status]
          const StatusIcon = statusConfig.icon
          const isActive = todo.status === status
          return (
            <DropdownMenuItem
              key={status}
              onClick={() => onStatusChange(todo.id, status)}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-xs transition-colors',
                isActive ? 'font-medium' : 'hover:bg-white/5',
              )}
              style={
                isActive
                  ? {
                      backgroundColor: `color-mix(in srgb, ${statusConfig.bgVar} 15%, transparent)`,
                      color: statusConfig.colorVar,
                    }
                  : { color: 'var(--text-muted)' }
              }
            >
              <StatusIcon
                className="h-3.5 w-3.5"
                style={{ color: statusConfig.colorVar }}
              />
              <span>{statusConfig.label}</span>
              {isActive && (
                <span className="ml-auto text-[10px] opacity-60">✓</span>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function PriorityDropdown({
  todo,
  onPriorityChange,
}: {
  todo: Todo
  onPriorityChange: (id: string, priority: Priority) => void
}) {
  const config = PRIORITY_CONFIG[todo.priority]
  const Icon = config.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            CHIP_BASE,
            'min-w-0 cursor-pointer hover:brightness-110',
          )}
          style={{
            backgroundColor: config.pulse
              ? config.colorVar
              : `color-mix(in srgb, ${config.bgVar} 15%, transparent)`,
            color: config.pulse ? 'var(--background)' : config.colorVar,
            fontWeight: config.pulse ? 700 : undefined,
          }}
        >
          <Icon className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{config.label}</span>
          <ChevronDown className="h-2.5 w-2.5 flex-shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="border-border/50 min-w-[130px] p-1"
        style={{ backgroundColor: 'var(--surface-2)' }}
      >
        {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((priority) => {
          const priorityConfig = PRIORITY_CONFIG[priority]
          const PriorityIcon = priorityConfig.icon
          const isActive = todo.priority === priority
          return (
            <DropdownMenuItem
              key={priority}
              onClick={() => onPriorityChange(todo.id, priority)}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-xs transition-colors',
                isActive ? 'font-medium' : 'hover:bg-white/5',
              )}
              style={
                isActive
                  ? {
                      backgroundColor: `color-mix(in srgb, ${priorityConfig.bgVar} 15%, transparent)`,
                      color: priorityConfig.colorVar,
                    }
                  : { color: 'var(--text-muted)' }
              }
            >
              <PriorityIcon
                className="h-3.5 w-3.5"
                style={{ color: priorityConfig.colorVar }}
              />
              <span>{priorityConfig.label}</span>
              {isActive && (
                <span className="ml-auto text-[10px] opacity-60">✓</span>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
