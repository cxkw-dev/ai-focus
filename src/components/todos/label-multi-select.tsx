'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Icon } from '@/components/ui/icon'
import { cn, cssVars } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Label as TodoLabel } from '@/types/todo'

interface LabelMultiSelectProps {
  labels: TodoLabel[]
  value: string[]
  onChange: (value: string[]) => void
  onManage: () => void
  disabled?: boolean
  showChips?: boolean
  showQuickPick?: boolean
}

export function LabelMultiSelect({
  labels,
  value,
  onChange,
  onManage,
  disabled,
  showChips = true,
  showQuickPick = false,
}: LabelMultiSelectProps) {
  const selected = new Set(value)
  const selectedLabels = labels.filter((label) => selected.has(label.id))

  const toggleLabel = (id: string) => {
    const next = new Set(value)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onChange(Array.from(next))
  }

  return (
    <div className="flex flex-col gap-2">
      {!showQuickPick && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" disabled={disabled} className="self-start">
              <Icon name="tag" />
              Labels
              {selectedLabels.length > 0 && (
                <span className="dd-badge dd-badge--count">
                  {selectedLabels.length}
                </span>
              )}
              <Icon name="chevron-down" className="text-quiet" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-56">
            {labels.length === 0 && (
              <p className="text-quiet px-3 py-2 text-xs">No labels yet.</p>
            )}
            {labels.map((label) => (
              <DropdownMenuCheckboxItem
                key={label.id}
                checked={selected.has(label.id)}
                onCheckedChange={() => toggleLabel(label.id)}
              >
                <LabelDot color={label.color} />
                {label.name}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem icon="settings" onSelect={onManage}>
              Manage labels
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {showQuickPick && (
        <div className="flex flex-col gap-2" data-dd-manual>
          <GroupHeading label="Selected" count={selectedLabels.length} />
          <div className="dd-chip-group">
            {selectedLabels.length === 0 && (
              <span className="text-quiet text-xs">None selected.</span>
            )}
            {selectedLabels.map((label) => (
              <Chip key={label.id} color={label.color}>
                <span>{label.name}</span>
                <button
                  type="button"
                  className="dd-chip__remove"
                  onClick={() => toggleLabel(label.id)}
                  disabled={disabled}
                  aria-label={`Remove ${label.name}`}
                >
                  <Icon name="x" />
                </button>
              </Chip>
            ))}
          </div>

          <GroupHeading
            label="Available"
            count={labels.length - selectedLabels.length}
            className="pt-1"
          />
          <div className="dd-chip-group" role="group" aria-label="Labels">
            {labels.length === 0 && (
              <span className="text-quiet text-xs">No labels yet.</span>
            )}
            {labels.map((label) => {
              const isSelected = selected.has(label.id)
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  className="dd-chip dd-chip--filter"
                  style={cssVars({ '--dd-chip': label.color })}
                >
                  <span className="dd-chip__check">
                    <Icon name="check" />
                  </span>
                  <span>{label.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {!showQuickPick && showChips && (
        <div className="dd-chip-group">
          {selectedLabels.length === 0 && (
            <span className="text-quiet text-xs">No labels selected.</span>
          )}
          {selectedLabels.map((label) => (
            <Chip key={label.id} color={label.color}>
              <span>{label.name}</span>
            </Chip>
          ))}
        </div>
      )}
    </div>
  )
}

function LabelDot({ color }: { color: string }) {
  return (
    <span
      className="size-2 flex-none rounded-full bg-(--dot)"
      style={cssVars({ '--dot': color })}
      aria-hidden="true"
    />
  )
}

function GroupHeading({
  label,
  count,
  className,
}: {
  label: string
  count: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'text-quiet flex items-center justify-between text-xs',
        className,
      )}
    >
      <span>{label}</span>
      <span className="font-mono tabular-nums">{count}</span>
    </div>
  )
}
