'use client'

import * as React from 'react'
import { Tags } from 'lucide-react'
import { cn } from '@/lib/utils'
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
    <div className="space-y-2">
      {!showQuickPick && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] transition-colors',
                disabled && 'cursor-not-allowed opacity-50',
              )}
              style={{
                backgroundColor: selectedLabels.length
                  ? 'color-mix(in srgb, var(--primary) 12%, transparent)'
                  : 'transparent',
                color: selectedLabels.length
                  ? 'var(--primary)'
                  : 'var(--text-muted)',
              }}
            >
              <Tags className="h-3 w-3" />
              Labels
              {selectedLabels.length > 0 && (
                <span
                  className="ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }}
                >
                  {selectedLabels.length}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[220px]">
            {labels.length === 0 && (
              <div
                className="px-2 py-2 text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                No labels yet.
              </div>
            )}
            {labels.map((label) => (
              <DropdownMenuCheckboxItem
                key={label.id}
                checked={selected.has(label.id)}
                onCheckedChange={() => toggleLabel(label.id)}
                className="gap-2 text-xs"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                {label.name}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onManage} className="text-xs">
              Manage labels
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {showQuickPick && (
        <div className="space-y-2">
          <div
            className="flex items-center justify-between text-[10px] tracking-wide uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>Selected</span>
            <span>{selectedLabels.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedLabels.length === 0 && (
              <span
                className="text-[11px]"
                style={{ color: 'var(--text-muted)' }}
              >
                None selected.
              </span>
            )}
            {selectedLabels.map((label) => (
              <button
                key={label.id}
                type="button"
                onClick={() => toggleLabel(label.id)}
                disabled={disabled}
                className={cn(
                  'inline-flex h-5 items-center gap-1 rounded px-1.5 text-[10px] font-semibold transition-colors',
                  disabled && 'cursor-not-allowed opacity-50',
                )}
                style={{
                  backgroundColor: `color-mix(in srgb, ${label.color} 15%, transparent)`,
                  color: label.color,
                }}
                title="Remove label"
              >
                {label.name}
                <span className="text-[10px] opacity-70">&times;</span>
              </button>
            ))}
          </div>

          <div
            className="flex items-center justify-between pt-2 text-[10px] tracking-wide uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>Available</span>
            <span>{labels.length - selectedLabels.length}</span>
          </div>
          <div className="grid gap-1.5">
            {labels.length === 0 && (
              <span
                className="text-[11px]"
                style={{ color: 'var(--text-muted)' }}
              >
                No labels yet.
              </span>
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
                  className={cn(
                    'flex w-full items-center justify-between rounded-md border px-2.5 py-2 text-[11px] transition-colors',
                    disabled && 'cursor-not-allowed opacity-50',
                  )}
                  style={
                    isSelected
                      ? {
                          borderColor: `${label.color}66`,
                          backgroundColor: `${label.color}14`,
                          color: label.color,
                        }
                      : {
                          borderColor: 'var(--border-color)',
                          backgroundColor:
                            'color-mix(in srgb, var(--surface-2) 60%, transparent)',
                          color: 'var(--text-muted)',
                        }
                  }
                  title={isSelected ? 'Remove label' : 'Add label'}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                  </span>
                  <span className="text-[10px] tracking-wide uppercase">
                    {isSelected ? 'On' : 'Add'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {!showQuickPick && showChips && (
        <div className="flex flex-wrap gap-1.5">
          {selectedLabels.length === 0 && (
            <span
              className="text-[11px]"
              style={{ color: 'var(--text-muted)' }}
            >
              No labels selected.
            </span>
          )}
          {selectedLabels.map((label) => (
            <span
              key={label.id}
              className="inline-flex h-5 items-center gap-1 rounded px-1.5 text-[10px] font-semibold"
              style={{
                backgroundColor: `color-mix(in srgb, ${label.color} 15%, transparent)`,
                color: label.color,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
