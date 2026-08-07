'use client'

import * as React from 'react'
import { ReceiptText } from 'lucide-react'
import { buildBillingCodeTitle, formatBillingCodeDisplay } from '@/lib/labels'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  BillingCodeFields,
  createBillingCodeDraft,
  normalizeBillingCodes,
  type BillingCodeDraft,
  type LabelDraft,
} from './label-billing-codes'
import type { PresetColor } from './use-label-manager'

interface LabelManagerCreateFormProps {
  newDraft: LabelDraft
  setNewDraft: React.Dispatch<React.SetStateAction<LabelDraft>>
  presetColors: PresetColor[]
  newDraftError: string | null
  disabled?: boolean
  isSaving: boolean
  updateNewBillingCode: (
    index: number,
    updates: Partial<BillingCodeDraft>,
  ) => void
  handleCreate: () => Promise<void>
}

export function LabelManagerCreateForm({
  newDraft,
  setNewDraft,
  presetColors,
  newDraftError,
  disabled,
  isSaving,
  updateNewBillingCode,
  handleCreate,
}: LabelManagerCreateFormProps) {
  return (
    <div
      className="space-y-4 rounded-xl border p-4"
      style={{
        borderColor: 'var(--border-color)',
        backgroundColor: 'color-mix(in srgb, var(--surface) 60%, transparent)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="text-xs font-semibold tracking-wide uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          Create Label
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className="inline-flex h-5 items-center gap-1 rounded px-1.5 text-[10px] font-semibold"
            style={{
              backgroundColor: `color-mix(in srgb, ${newDraft.color} 15%, transparent)`,
              color: newDraft.color,
            }}
          >
            {newDraft.name.trim() ? newDraft.name.trim() : 'Preview'}
          </span>
          {normalizeBillingCodes(newDraft.billingCodes).map((billingCode) => (
            <span
              key={`${billingCode.order}-${billingCode.code}`}
              className="inline-flex h-5 max-w-[18rem] items-center gap-1 rounded px-1.5 text-[10px] font-semibold"
              style={{
                backgroundColor:
                  'color-mix(in srgb, var(--surface-2) 80%, transparent)',
                color: 'var(--text-primary)',
              }}
              title={buildBillingCodeTitle(
                newDraft.name.trim() || 'Label',
                billingCode,
              )}
            >
              <ReceiptText className="h-3 w-3 flex-shrink-0" />
              <span className="truncate font-mono">
                {formatBillingCodeDisplay(billingCode)}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_auto]">
        <Input
          value={newDraft.name}
          onChange={(e) =>
            setNewDraft((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Label name"
          disabled={disabled || isSaving}
          className="text-sm"
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
            value={newDraft.color}
            onChange={(e) =>
              setNewDraft((prev) => ({ ...prev, color: e.target.value }))
            }
            disabled={disabled || isSaving}
            className="color-swatch h-9 w-9 rounded-full border-2 bg-transparent p-0"
            style={{
              borderColor:
                'color-mix(in srgb, var(--border-color) 70%, transparent)',
              boxShadow: `0 0 0 2px ${newDraft.color}22`,
            }}
            aria-label="Label color"
          />
        </div>
      </div>

      <Input
        value={newDraft.repoUrl}
        onChange={(e) =>
          setNewDraft((prev) => ({ ...prev, repoUrl: e.target.value }))
        }
        placeholder="GitHub repo URL (optional), e.g. https://github.com/org/repo"
        disabled={disabled || isSaving}
        className="text-sm"
      />

      <div className="flex flex-wrap items-center gap-2">
        {presetColors.map((preset) => (
          <button
            key={preset.varName}
            type="button"
            onClick={() =>
              setNewDraft((prev) => ({ ...prev, color: preset.value }))
            }
            className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-105"
            style={{
              backgroundColor: preset.value,
              borderColor:
                newDraft.color === preset.value
                  ? 'var(--text-primary)'
                  : 'color-mix(in srgb, var(--border-color) 70%, transparent)',
              boxShadow:
                newDraft.color === preset.value
                  ? `0 0 0 2px ${preset.value}55`
                  : 'none',
            }}
            aria-label={`Select ${preset.varName}`}
          />
        ))}
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Quick picks
        </span>
      </div>

      <BillingCodeFields
        billingCodes={newDraft.billingCodes}
        disabled={disabled || isSaving}
        onAdd={() =>
          setNewDraft((prev) => ({
            ...prev,
            billingCodes: [...prev.billingCodes, createBillingCodeDraft()],
          }))
        }
        onChange={updateNewBillingCode}
        onRemove={(index) =>
          setNewDraft((prev) => ({
            ...prev,
            billingCodes: prev.billingCodes.filter(
              (_billingCode, itemIndex) => itemIndex !== index,
            ),
          }))
        }
        helperText="Add as many billing codes as this label needs. Each task with this label can surface them from its billing drawer."
        emptyText="No billing codes yet. Add one only when this label should expose SAP-ready codes."
        labelName={newDraft.name.trim() || 'Label'}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          Create the label first, then attach it to tasks and open the billing
          drawer when you need to copy a code.
        </div>
        <Button
          type="button"
          onClick={handleCreate}
          disabled={
            !newDraft.name.trim() ||
            Boolean(newDraftError) ||
            disabled ||
            isSaving
          }
        >
          Add label
        </Button>
      </div>

      {newDraftError && (
        <div className="text-[11px]" style={{ color: 'var(--destructive)' }}>
          {newDraftError}
        </div>
      )}
    </div>
  )
}
