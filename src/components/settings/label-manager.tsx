'use client'

import * as React from 'react'
import { ReceiptText, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildBillingCodeTitle, formatBillingCodeDisplay } from '@/lib/labels'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  BillingCodeFields,
  buildCreatePayload,
  buildUpdatePayload,
  createBillingCodeDraft,
  createDraftFromLabel,
  EMPTY_LABEL_DRAFT,
  getBillingDraftError,
  hasDraftChanges,
  normalizeBillingCodes,
  type BillingCodeDraft,
  type LabelDraft,
} from './label-billing-codes'
import type {
  CreateLabelInput,
  Label as TodoLabel,
  UpdateLabelInput,
} from '@/types/todo'

interface LabelManagerProps {
  labels: TodoLabel[]
  onCreateLabel: (data: CreateLabelInput) => Promise<boolean>
  onUpdateLabel: (id: string, data: UpdateLabelInput) => Promise<boolean>
  onDeleteLabel: (id: string) => Promise<boolean>
  disabled?: boolean
}

export function LabelManager({
  labels,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
  disabled,
}: LabelManagerProps) {
  const [newDraft, setNewDraft] = React.useState<LabelDraft>(EMPTY_LABEL_DRAFT)
  const presetColors = React.useMemo(() => {
    if (typeof document === 'undefined') return []
    const rootStyles = getComputedStyle(document.documentElement)
    const presetVars = [
      '--primary',
      '--accent',
      '--status-in-progress',
      '--status-waiting',
      '--status-on-hold',
      '--status-done',
      '--priority-high',
      '--priority-urgent',
    ]

    const toHex = (value: string) => {
      const trimmed = value.trim()
      if (trimmed.startsWith('#')) return trimmed.toLowerCase()
      const match = trimmed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
      if (!match) return '#22c55e'
      const [, r, g, b] = match
      const toHexPart = (v: string) => Number(v).toString(16).padStart(2, '0')
      return `#${toHexPart(r)}${toHexPart(g)}${toHexPart(b)}`
    }

    const uniquePresets: Array<{ varName: string; value: string }> = []
    const seen = new Set<string>()
    presetVars.forEach((varName) => {
      const value = toHex(rootStyles.getPropertyValue(varName))
      const key = value.toLowerCase()
      if (seen.has(key)) return
      seen.add(key)
      uniquePresets.push({ varName, value })
    })
    return uniquePresets
  }, [])
  const [drafts, setDrafts] = React.useState<Record<string, LabelDraft>>({})
  const [isSaving, setIsSaving] = React.useState(false)
  const isCompact = labels.length > 6
  const newDraftError = getBillingDraftError(newDraft.billingCodes)

  // Resync drafts when the labels prop changes (React 19 reset-on-prop pattern).
  const labelsSignature = labels.map((l) => `${l.id}:${l.updatedAt}`).join('|')
  const [prevLabelsSignature, setPrevLabelsSignature] =
    React.useState<string>('')
  if (prevLabelsSignature !== labelsSignature) {
    setPrevLabelsSignature(labelsSignature)
    const nextDrafts: Record<string, LabelDraft> = {}
    labels.forEach((label) => {
      nextDrafts[label.id] = createDraftFromLabel(label)
    })
    setDrafts(nextDrafts)
  }

  const updateDraft = React.useCallback(
    (id: string, updates: Partial<LabelDraft>) => {
      setDrafts((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] ?? EMPTY_LABEL_DRAFT),
          ...updates,
        },
      }))
    },
    [],
  )

  const updateDraftBillingCode = React.useCallback(
    (id: string, index: number, updates: Partial<BillingCodeDraft>) => {
      setDrafts((prev) => {
        const currentDraft = prev[id] ?? EMPTY_LABEL_DRAFT
        return {
          ...prev,
          [id]: {
            ...currentDraft,
            billingCodes: currentDraft.billingCodes.map(
              (billingCode, itemIndex) =>
                itemIndex === index
                  ? { ...billingCode, ...updates }
                  : billingCode,
            ),
          },
        }
      })
    },
    [],
  )

  const addDraftBillingCode = React.useCallback((id: string) => {
    setDrafts((prev) => {
      const currentDraft = prev[id] ?? EMPTY_LABEL_DRAFT
      return {
        ...prev,
        [id]: {
          ...currentDraft,
          billingCodes: [
            ...currentDraft.billingCodes,
            createBillingCodeDraft(),
          ],
        },
      }
    })
  }, [])

  const removeDraftBillingCode = React.useCallback(
    (id: string, index: number) => {
      setDrafts((prev) => {
        const currentDraft = prev[id] ?? EMPTY_LABEL_DRAFT
        return {
          ...prev,
          [id]: {
            ...currentDraft,
            billingCodes: currentDraft.billingCodes.filter(
              (_billingCode, itemIndex) => itemIndex !== index,
            ),
          },
        }
      })
    },
    [],
  )

  const updateNewBillingCode = React.useCallback(
    (index: number, updates: Partial<BillingCodeDraft>) => {
      setNewDraft((prev) => ({
        ...prev,
        billingCodes: prev.billingCodes.map((billingCode, itemIndex) =>
          itemIndex === index ? { ...billingCode, ...updates } : billingCode,
        ),
      }))
    },
    [],
  )

  const handleCreate = async () => {
    if (!newDraft.name.trim() || newDraftError) return

    setIsSaving(true)
    const success = await onCreateLabel(buildCreatePayload(newDraft))
    setIsSaving(false)

    if (success) {
      setNewDraft(EMPTY_LABEL_DRAFT)
    }
  }

  const commitUpdate = async (label: TodoLabel, draft: LabelDraft) => {
    const updates = buildUpdatePayload(label, draft)
    if (
      Object.keys(updates).length === 0 ||
      getBillingDraftError(draft.billingCodes)
    ) {
      return
    }

    setIsSaving(true)
    await onUpdateLabel(label.id, updates)
    setIsSaving(false)
  }

  const handleDelete = async (id: string) => {
    setIsSaving(true)
    await onDeleteLabel(id)
    setIsSaving(false)
  }

  return (
    <div className="space-y-5">
      <div
        className="space-y-4 rounded-xl border p-4"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor:
            'color-mix(in srgb, var(--surface) 60%, transparent)',
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

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div
            className="text-xs font-semibold tracking-wide uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            Existing Labels
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Edit label details and linked billing codes together
          </div>
        </div>

        {labels.length === 0 && (
          <div
            className="rounded-xl border p-4 text-xs"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor:
                'color-mix(in srgb, var(--surface) 70%, transparent)',
              color: 'var(--text-muted)',
            }}
          >
            No labels yet. Create your first label above.
          </div>
        )}

        {labels.map((label) => {
          const draft = drafts[label.id] ?? createDraftFromLabel(label)
          const billingError = getBillingDraftError(draft.billingCodes)
          const canSave =
            draft.name.trim().length > 0 &&
            !billingError &&
            hasDraftChanges(label, draft)

          return (
            <div
              key={label.id}
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
                      {normalizeBillingCodes(draft.billingCodes).length} billing
                      code
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
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 h-9 w-9 p-0"
                    aria-label="Delete label"
                    title="Delete label"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_auto]">
                <Input
                  value={draft.name}
                  onChange={(e) =>
                    updateDraft(label.id, { name: e.target.value })
                  }
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
                    onChange={(e) =>
                      updateDraft(label.id, { color: e.target.value })
                    }
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
                    onClick={() =>
                      updateDraft(label.id, { color: preset.value })
                    }
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
                <span
                  className="text-[10px]"
                  style={{ color: 'var(--text-muted)' }}
                >
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
                <div
                  className="text-[11px]"
                  style={{ color: 'var(--destructive)' }}
                >
                  {billingError}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
