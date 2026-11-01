'use client'

import { Chip } from '@/components/ui/chip'
import { Icon } from '@/components/ui/icon'
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { PRIORITIES, PRIORITY_MAP } from '@/lib/priority'
import { STATUS_CONFIG } from '@/lib/status'
import { cn } from '@/lib/utils'
import type { Label, Priority, Status, Todo } from '@/types/todo'

const STATUSES = Object.keys(STATUS_CONFIG) as Status[]

/** Chips on a dense card: the dd chip, a step tighter so a couple share one row with the task number. */
const CARD_CHIP = 'px-1.5 py-1'

/**
 * Card chrome that waits for the card: hidden at rest, shown while the card is hovered or holds focus, and always on
 * touch screens (no hover to reveal it). The card's `<article>` is the `group`.
 */
export const REVEAL_ON_CARD_HOVER =
  'opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100'

/** Status on a card: a neutral chip whose icon carries the colour, plus the word (never colour alone). */
export function StatusChip({
  status,
  className,
}: {
  status: Status
  className?: string
}) {
  const config = STATUS_CONFIG[status]
  return (
    <Chip className={cn(CARD_CHIP, className)}>
      <Icon name={config.icon} style={{ color: config.colorVar }} />
      <span>{config.label}</span>
    </Chip>
  )
}

/** Priority on a card: neutral like status, except Urgent, which keeps its bad tint so it reads at a glance. */
export function PriorityChip({
  priority,
  className,
}: {
  priority: Priority
  className?: string
}) {
  const config = PRIORITY_MAP[priority]
  const urgent = priority === 'URGENT'
  return (
    <Chip
      color={urgent ? config.colorVar : undefined}
      className={cn(CARD_CHIP, className)}
    >
      <Icon
        name={config.icon}
        style={urgent ? undefined : { color: config.colorVar }}
      />
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

/** The "Status" group of a card's ⋯ menu: one radio row per status, its icon in the status colour. */
export function StatusMenuGroup({
  todo,
  onStatusChange,
}: {
  todo: Todo
  onStatusChange: (id: string, status: Status) => void
}) {
  return (
    <>
      <DropdownMenuLabel>Status</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={todo.status}>
        {STATUSES.map((status) => {
          const option = STATUS_CONFIG[status]
          return (
            <DropdownMenuRadioItem
              key={status}
              value={status}
              onSelect={() => {
                if (status !== todo.status) onStatusChange(todo.id, status)
              }}
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
    </>
  )
}

/** The "Priority" group of a card's ⋯ menu. */
export function PriorityMenuGroup({
  todo,
  onPriorityChange,
}: {
  todo: Todo
  onPriorityChange: (id: string, priority: Priority) => void
}) {
  return (
    <>
      <DropdownMenuLabel>Priority</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={todo.priority}>
        {PRIORITIES.map((option) => (
          <DropdownMenuRadioItem
            key={option.value}
            value={option.value}
            onSelect={() => {
              if (option.value !== todo.priority) {
                onPriorityChange(todo.id, option.value)
              }
            }}
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
    </>
  )
}
