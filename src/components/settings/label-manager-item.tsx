'use client'

import { Archive } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  BillingCodeFields,
  getBillingDraftError,
  hasDraftChanges,
  normalizeBillingCodes,
  type BillingCodeDraft,
  type LabelDraft,
} from './label-billing-codes'
import type { PresetColor } from './use-label-manager'
import type { Label as TodoLabel } from '@/types/todo'

interface LabelManagerItemProps {
  label: TodoLabel
  draft: LabelDraft
  presetColors: PresetColor[]
  isCompact: boolean
  disabled?: boolean
  isSaving: boolean
  updateDraft: (id: string, updates: Partial<LabelDraft>) => void
  updateDraftBillingCode: (
    id: string,
    index: number,
    updates: Partial<BillingCodeDraft>,
  ) => void
  addDraftBillingCode: (id: string) => void
  removeDraftBillingCode: (id: string, index: number) => void
  commitUpdate: (label: TodoLabel, draft: LabelDraft) => Promise<void>
  handleDelete: (id: string) => Promise<void>
}

export function LabelManagerItem({
  label,
  draft,
  presetColors,
  isCompact,
  disabled,
  isSaving,
  updateDraft,
  updateDraftBillingCode,
  addDraftBillingCode,
  removeDraftBillingCode,
  commitUpdate,
  handleDelete,
}: LabelManagerItemProps) {
  const billingError = getBillingDraftError(draft.billingCodes)
  const canSave =
    draft.name.trim().length > 0 &&
    !billingError &&
    hasDraftChanges(label, draft)

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border',
        isCompact ? 'p-3' : 'p-4',
      )}
      style={{
        borderColor: 'var(--border-color)',
        backgroundColor:
          'color-mix(in srgb, var(--surface-2) 80%, transparent)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className="inline-flex h-5 items-center gap-1 rounded px-1.5 text-[10px] font-semibold"
            style={{
              backgroundColor: `color-mix(in srgb, ${draft.color} 15%, transparent)`,
              color: draft.color,
            }}
          >
            {draft.name.trim() || 'Untitled'}
          </span>
          {normalizeBillingCodes(draft.billingCodes).length > 0 ? (
            <span
              className="text-[10px] tracking-wide uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              {normalizeBillingCodes(draft.billingCodes).length} billing code
              {normalizeBillingCodes(draft.billingCodes).length === 1
                ? ''
                : 's'}
            </span>
          ) : (
            <span
              className="text-[10px] tracking-wide uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              No billing codes
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          {canSave && (
            <Button
              type="button"
              onClick={() => void commitUpdate(label, draft)}
              disabled={disabled || isSaving}
              className="h-9 px-3 text-xs"
            >
              Save
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleDelete(label.id)}
            disabled={disabled || isSaving}
            className="h-9 w-9 p-0"
            aria-label="Archive label"
            title="Archive label — keeps all history, hides it from active lists"
          >
            <Archive className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_auto]">
        <Input
          value={draft.name}
          onChange={(e) => updateDraft(label.id, { name: e.target.value })}
          disabled={disabled}
          className="w-full text-sm"
          placeholder="Label name"
        />
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] tracking-wide uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            Color
          </span>
          <input
            type="color"
            value={draft.color}
            onChange={(e) => updateDraft(label.id, { color: e.target.value })}
            disabled={disabled}
            className="color-swatch h-8 w-8 rounded-full border-2 bg-transparent p-0"
            style={{
              borderColor:
                'color-mix(in srgb, var(--border-color) 70%, transparent)',
              boxShadow: `0 0 0 2px ${draft.color}22`,
            }}
            aria-label="Label color"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {presetColors.map((preset) => (
          <button
            key={`${label.id}-${preset.varName}`}
            type="button"
            onClick={() => updateDraft(label.id, { color: preset.value })}
            className={cn(
              'h-6 w-6 rounded-full border-2 transition-transform hover:scale-105',
              isCompact && 'h-5 w-5',
            )}
            style={{
              backgroundColor: preset.value,
              borderColor:
                draft.color === preset.value
                  ? 'var(--text-primary)'
                  : 'color-mix(in srgb, var(--border-color) 70%, transparent)',
              boxShadow:
                draft.color === preset.value
                  ? `0 0 0 2px ${preset.value}55`
                  : 'none',
            }}
            aria-label={`Select ${preset.varName}`}
            title="Apply theme color"
          />
        ))}
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Theme picks
        </span>
      </div>

      <BillingCodeFields
        billingCodes={draft.billingCodes}
        disabled={disabled || isSaving}
        onAdd={() => addDraftBillingCode(label.id)}
        onChange={(index, updates) =>
          updateDraftBillingCode(label.id, index, updates)
        }
        onRemove={(index) => removeDraftBillingCode(label.id, index)}
        helperText="These codes will show up in the task billing drawer for any todo using this label."
        emptyText="No billing codes linked to this label yet."
        labelName={draft.name.trim() || label.name}
      />

      {billingError && (
        <div className="text-[11px]" style={{ color: 'var(--destructive)' }}>
          {billingError}
        </div>
      )}
    </div>
  )
}
