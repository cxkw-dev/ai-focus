'use client'

import * as React from 'react'
import { Plus, ReceiptText, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buildBillingCodeTitle, formatBillingCodeDisplay } from '@/lib/labels'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type {
  BillingCodeInput,
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

type BillingCodeDraft = {
  type: string
  code: string
  description: string
}

type LabelDraft = {
  name: string
  color: string
  billingCodes: BillingCodeDraft[]
}

const EMPTY_BILLING_CODE_DRAFT: BillingCodeDraft = {
  type: '',
  code: '',
  description: '',
}

const EMPTY_LABEL_DRAFT: LabelDraft = {
  name: '',
  color: '#22c55e',
  billingCodes: [],
}

function createBillingCodeDraft(): BillingCodeDraft {
  return { ...EMPTY_BILLING_CODE_DRAFT }
}

function createDraftFromLabel(label: TodoLabel): LabelDraft {
  return {
    name: label.name,
    color: label.color,
    billingCodes: label.billingCodes.map((billingCode) => ({
      type: billingCode.type,
      code: billingCode.code,
      description: billingCode.description ?? '',
    })),
  }
}

function normalizeField(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeBillingCodes(
  billingCodes: BillingCodeDraft[],
): BillingCodeInput[] {
  return billingCodes.flatMap((billingCode, index) => {
    const type = normalizeField(billingCode.type)
    const code = normalizeField(billingCode.code)
    const description = normalizeField(billingCode.description)

    if (!type && !code && !description) {
      return []
    }

    return [
      {
        type: type ?? '',
        code: code ?? '',
        description,
        order: index,
      },
    ]
  })
}

function getBillingDraftError(billingCodes: BillingCodeDraft[]) {
  const seenCodes = new Map<string, number>()

  for (const [index, billingCode] of billingCodes.entries()) {
    const type = normalizeField(billingCode.type)
    const code = normalizeField(billingCode.code)
    const description = normalizeField(billingCode.description)

    if (!type && !code && !description) {
      continue
    }

    if (!type) {
      return `Billing code ${index + 1} needs a type.`
    }

    if (!code) {
      return `Billing code ${index + 1} needs a code.`
    }

    const normalizedCode = code.toLowerCase()
    const existingIndex = seenCodes.get(normalizedCode)

    if (existingIndex !== undefined) {
      return `Billing code ${index + 1} duplicates billing code ${existingIndex + 1}.`
    }

    seenCodes.set(normalizedCode, index)
  }

  return null
}

function buildCreatePayload(draft: LabelDraft): CreateLabelInput {
  const billingCodes = normalizeBillingCodes(draft.billingCodes)

  return {
    name: draft.name.trim(),
    color: draft.color,
    ...(billingCodes.length > 0 ? { billingCodes } : {}),
  }
}

function areBillingCodesEqual(
  left: BillingCodeInput[],
  right: BillingCodeInput[],
) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function buildUpdatePayload(
  label: TodoLabel,
  draft: LabelDraft,
): UpdateLabelInput {
  const updates: UpdateLabelInput = {}
  const normalizedName = draft.name.trim()
  const normalizedBillingCodes = normalizeBillingCodes(draft.billingCodes)
  const currentBillingCodes = label.billingCodes.map((billingCode) => ({
    type: billingCode.type,
    code: billingCode.code,
    description: billingCode.description,
    order: billingCode.order,
  }))

  if (normalizedName && normalizedName !== label.name) {
    updates.name = normalizedName
  }

  if (draft.color !== label.color) {
    updates.color = draft.color
  }

  if (!areBillingCodesEqual(normalizedBillingCodes, currentBillingCodes)) {
    updates.billingCodes = normalizedBillingCodes
  }

  return updates
}

function hasDraftChanges(label: TodoLabel, draft: LabelDraft) {
  return Object.keys(buildUpdatePayload(label, draft)).length > 0
}

interface BillingCodeFieldsProps {
  billingCodes: BillingCodeDraft[]
  disabled?: boolean
  onAdd: () => void
  onChange: (index: number, updates: Partial<BillingCodeDraft>) => void
  onRemove: (index: number) => void
  helperText: string
  emptyText: string
  labelName: string
}

function BillingCodeFields({
  billingCodes,
  disabled,
  onAdd,
  onChange,
  onRemove,
  helperText,
  emptyText,
  labelName,
}: BillingCodeFieldsProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ReceiptText
            className="h-4 w-4"
            style={{ color: 'var(--primary)' }}
          />
          <span
            className="text-xs font-semibold tracking-wide uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            Billing Codes
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          disabled={disabled}
          className="h-8 px-2.5 text-xs"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add code
        </Button>
      </div>

      {billingCodes.length === 0 ? (
        <div
          className="rounded-lg border border-dashed px-3 py-3 text-xs"
          style={{
            borderColor: 'var(--border-color)',
            color: 'var(--text-muted)',
            backgroundColor:
              'color-mix(in srgb, var(--surface) 60%, transparent)',
          }}
        >
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {billingCodes.map((billingCode, index) => {
            const type = normalizeField(billingCode.type)
            const code = normalizeField(billingCode.code)
            const description = normalizeField(billingCode.description)
            const canPreview = Boolean(type && code)

            return (
              <div
                key={index}
                className="rounded-lg border p-3"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor:
                    'color-mix(in srgb, var(--surface) 68%, transparent)',
                }}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span
                      className="text-[10px] font-semibold tracking-wide uppercase"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Billing code {index + 1}
                    </span>
                    {canPreview && (
                      <span
                        className="inline-flex h-5 max-w-[18rem] items-center gap-1 rounded px-1.5 text-[10px] font-semibold"
                        style={{
                          backgroundColor:
                            'color-mix(in srgb, var(--surface-2) 80%, transparent)',
                          color: 'var(--text-primary)',
                        }}
                        title={buildBillingCodeTitle(labelName, {
                          type: type!,
                          code: code!,
                          description,
                        })}
                      >
                        <ReceiptText className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate font-mono">
                          {formatBillingCodeDisplay({
                            type: type!,
                            code: code!,
                          })}
                        </span>
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onRemove(index)}
                    disabled={disabled}
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                    aria-label={`Remove billing code ${index + 1}`}
                    title="Remove billing code"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    value={billingCode.type}
                    onChange={(e) => onChange(index, { type: e.target.value })}
                    disabled={disabled}
                    className="text-sm"
                    placeholder="Type, e.g. WBS"
                  />
                  <Input
                    value={billingCode.code}
                    onChange={(e) => onChange(index, { code: e.target.value })}
                    disabled={disabled}
                    className="font-mono text-sm"
                    placeholder="Billing code"
                  />
                </div>

                <textarea
                  value={billingCode.description}
                  onChange={(e) =>
                    onChange(index, { description: e.target.value })
                  }
                  disabled={disabled}
                  rows={2}
                  placeholder="Description (optional)"
                  className="mt-3 w-full rounded-md border bg-transparent px-3 py-2 text-sm transition-colors outline-none"
                  style={{
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            )
          })}
        </div>
      )}

      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
        {helperText}
      </div>
    </div>
  )
}

export function LabelManager({
  labels,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
  disabled,
}: LabelManagerProps) {
  const [newDraft, setNewDraft] = React.useState<LabelDraft>(EMPTY_LABEL_DRAFT)
  const [presetColors, setPresetColors] = React.useState<
    Array<{ varName: string; value: string }>
  >([])
  const [drafts, setDrafts] = React.useState<Record<string, LabelDraft>>({})
  const [isSaving, setIsSaving] = React.useState(false)
  const isCompact = labels.length > 6
  const newDraftError = getBillingDraftError(newDraft.billingCodes)

  React.useEffect(() => {
    const nextDrafts: Record<string, LabelDraft> = {}
    labels.forEach((label) => {
      nextDrafts[label.id] = createDraftFromLabel(label)
    })
    setDrafts(nextDrafts)
  }, [labels])

  React.useEffect(() => {
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
    setPresetColors(uniquePresets)
  }, [])

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
