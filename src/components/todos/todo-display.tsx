'use client'

import { Chip } from '@/components/ui/chip'
import { Icon } from '@/components/ui/icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PRIORITIES, PRIORITY_MAP } from '@/lib/priority'
import { STATUS_CONFIG } from '@/lib/status'
import { cn, cssVars } from '@/lib/utils'
import type { Label, Priority, Status, Todo } from '@/types/todo'

const STATUSES = Object.keys(STATUS_CONFIG) as Status[]

/** Chips on a dense card: the dd chip, a step tighter so a status, a priority and a label share one row. */
const CARD_CHIP = 'px-1.5 py-1'

/** Status on a card: its colour, icon and word (never colour alone). */
export function StatusChip({
  status,
  className,
}: {
  status: Status
  className?: string
}) {
  const config = STATUS_CONFIG[status]
  return (
    <Chip color={config.colorVar} className={cn(CARD_CHIP, className)}>
      <Icon name={config.icon} />
      <span>{config.label}</span>
    </Chip>
  )
}

export function PriorityChip({
  priority,
  className,
}: {
  priority: Priority
  className?: string
}) {
  const config = PRIORITY_MAP[priority]
  return (
    <Chip color={config.colorVar} className={cn(CARD_CHIP, className)}>
      <Icon name={config.icon} />
      <span>{config.label}</span>
    </Chip>
  )
}

/** A label in its own colour. */
export function TodoLabelChip({
  label,
  className,
}: {
  label: Label
  className?: string
}) {
  return (
    <Chip color={label.color} className={cn(CARD_CHIP, className)}>
      <span>{label.name}</span>
    </Chip>
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn('dd-chip', CARD_CHIP)}
          style={cssVars({ '--dd-chip': config.colorVar })}
          aria-label={`Status: ${config.label}`}
        >
          <Icon name={config.icon} />
          <span>{config.label}</span>
          <Icon name="chevron-down" className="opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        <DropdownMenuRadioGroup value={todo.status}>
          {STATUSES.map((status) => {
            const option = STATUS_CONFIG[status]
            return (
              <DropdownMenuRadioItem
                key={status}
                value={status}
                onSelect={() => onStatusChange(todo.id, status)}
              >
                <Icon
                  name={option.icon}
                  className="dd-menu__icon"
                  style={{ color: option.colorVar }}
                />
                {option.label}
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
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
  const config = PRIORITY_MAP[todo.priority]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn('dd-chip', CARD_CHIP)}
          style={cssVars({ '--dd-chip': config.colorVar })}
          aria-label={`Priority: ${config.label}`}
        >
          <Icon name={config.icon} />
          <span>{config.label}</span>
          <Icon name="chevron-down" className="opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-36">
        <DropdownMenuRadioGroup value={todo.priority}>
          {PRIORITIES.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              onSelect={() => onPriorityChange(todo.id, option.value)}
            >
              <Icon
                name={option.icon}
                className="dd-menu__icon"
                style={{ color: option.colorVar }}
              />
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
