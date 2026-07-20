'use client'

import { ArchiveRestore, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Label as TodoLabel } from '@/types/todo'

interface LabelManagerArchivedItemProps {
  label: TodoLabel
  onRestoreLabel?: (id: string) => Promise<boolean>
  onPurgeLabel?: (id: string) => Promise<boolean>
  handleRestore: (id: string) => Promise<void>
  handlePurge: (id: string) => Promise<void>
  disabled?: boolean
  isSaving: boolean
}

export function LabelManagerArchivedItem({
  label,
  onRestoreLabel,
  onPurgeLabel,
  handleRestore,
  handlePurge,
  disabled,
  isSaving,
}: LabelManagerArchivedItemProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
      style={{
        borderColor: 'var(--border-color)',
        backgroundColor:
          'color-mix(in srgb, var(--surface-2) 50%, transparent)',
      }}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span
          className="inline-flex h-5 items-center gap-1 rounded px-1.5 text-[10px] font-semibold"
          style={{
            backgroundColor: `color-mix(in srgb, ${label.color} 15%, transparent)`,
            color: label.color,
          }}
        >
          {label.name}
        </span>
        <span
          className="text-[10px] tracking-wide uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          {label.billingCodes.length > 0
            ? `${label.billingCodes.length} billing code${
                label.billingCodes.length === 1 ? '' : 's'
              }`
            : 'No billing codes'}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:ml-auto">
        {onRestoreLabel && (
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleRestore(label.id)}
            disabled={disabled || isSaving}
            className="h-9 gap-1.5 px-3 text-xs"
            title="Restore label to active lists"
          >
            <ArchiveRestore className="h-4 w-4" />
            Restore
          </Button>
        )}
        {onPurgeLabel && (
          <Button
            type="button"
            variant="outline"
            onClick={() => void handlePurge(label.id)}
            disabled={disabled || isSaving}
            className="border-destructive/40 text-destructive hover:bg-destructive/10 h-9 w-9 p-0"
            aria-label="Delete label permanently"
            title="Delete permanently — removes the label for good"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
