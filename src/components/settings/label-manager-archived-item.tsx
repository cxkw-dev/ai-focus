'use client'

import { Button, IconButton } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Icon } from '@/components/ui/icon'
import { formatDate } from '@/lib/utils'
import type { Label as TodoLabel } from '@/types/todo'

interface LabelManagerArchivedItemProps {
  label: TodoLabel
  onRestoreLabel?: (id: string) => Promise<boolean>
  onPurgeLabel?: (id: string) => Promise<boolean>
  handleRestore: (id: string) => Promise<void>
  /** Asks before deleting for good (the manager confirms, then purges). */
  onRequestPurge: (label: TodoLabel) => void
  disabled?: boolean
  isSaving: boolean
}

/** One archived label as a table row: a neutral chip with its colour dot, then Restore and Delete for good. */
export function LabelManagerArchivedItem({
  label,
  onRestoreLabel,
  onPurgeLabel,
  handleRestore,
  onRequestPurge,
  disabled,
  isSaving,
}: LabelManagerArchivedItemProps) {
  return (
    <tr>
      <td>
        <Chip dot color={label.color} className="max-w-64">
          <span className="truncate">{label.name}</span>
        </Chip>
      </td>
      <td className="is-num is-muted hidden sm:table-cell">
        {label.archivedAt ? formatDate(label.archivedAt) : '—'}
      </td>
      <td className="is-num">{label.billingCodes.length}</td>
      <td className="is-shrink">
        <div className="flex items-center justify-end gap-0.5">
          {onRestoreLabel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void handleRestore(label.id)}
              disabled={disabled || isSaving}
              title="Restore label to active lists"
            >
              <Icon name="refresh" />
              Restore
            </Button>
          )}
          {onPurgeLabel && (
            <IconButton
              icon="trash"
              label="Delete label permanently"
              size="sm"
              onClick={() => onRequestPurge(label)}
              disabled={disabled || isSaving}
            />
          )}
        </div>
      </td>
    </tr>
  )
}
