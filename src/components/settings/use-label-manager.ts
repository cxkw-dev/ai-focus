'use client'

import * as React from 'react'
import { useChartColors, type ChartColorKey } from '@/hooks/use-chart-colors'
import {
  buildCreatePayload,
  buildUpdatePayload,
  createBillingCodeDraft,
  createDraftFromLabel,
  EMPTY_LABEL_DRAFT,
  getBillingDraftError,
  type BillingCodeDraft,
  type LabelDraft,
} from './label-billing-codes'
import type {
  CreateLabelInput,
  Label as TodoLabel,
  UpdateLabelInput,
} from '@/types/todo'

/** A quick-pick label colour: one of the dawn & dusk set colours, resolved to the hex a label stores. */
export interface PresetColor {
  token: ChartColorKey
  name: string
  /** Paints the swatch from the token, so it follows the theme. */
  className: string
  /** Lowercase #rrggbb, as resolved in the current theme. */
  value: string
}

// The colour set in order (tokens.md). Class names are spelled out so Tailwind generates them.
const SET_COLORS = [
  { token: 'set1', name: 'Honey', className: 'bg-set-1' },
  { token: 'set2', name: 'Amber', className: 'bg-set-2' },
  { token: 'set3', name: 'Apricot', className: 'bg-set-3' },
  { token: 'set4', name: 'Terracotta', className: 'bg-set-4' },
  { token: 'set5', name: 'Rose', className: 'bg-set-5' },
  { token: 'set6', name: 'Wine', className: 'bg-set-6' },
  { token: 'set7', name: 'Ochre', className: 'bg-set-7' },
  { token: 'set8', name: 'Sand', className: 'bg-set-8' },
] as const satisfies readonly Omit<PresetColor, 'value'>[]

/** Labels store `#rrggbb` (the API rejects anything else); expand `#rgb` and skip what isn't a hex yet. */
function toHex(value: string) {
  const v = value.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(v)) return v
  const short = v.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/)
  return short
    ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`
    : null
}

export interface UseLabelManagerParams {
  labels: TodoLabel[]
  onCreateLabel: (data: CreateLabelInput) => Promise<boolean>
  onUpdateLabel: (id: string, data: UpdateLabelInput) => Promise<boolean>
  onDeleteLabel: (id: string) => Promise<boolean>
  onRestoreLabel?: (id: string) => Promise<boolean>
  onPurgeLabel?: (id: string) => Promise<boolean>
}

export interface LabelManagerState {
  /** The create form's draft; its colour falls back to the first set colour until one is picked. */
  newDraft: LabelDraft
  setNewDraft: React.Dispatch<React.SetStateAction<LabelDraft>>
  presetColors: PresetColor[]
  drafts: Record<string, LabelDraft>
  isSaving: boolean
  newDraftError: string | null
  updateDraft: (id: string, updates: Partial<LabelDraft>) => void
  updateDraftBillingCode: (
    id: string,
    index: number,
    updates: Partial<BillingCodeDraft>,
  ) => void
  addDraftBillingCode: (id: string) => void
  removeDraftBillingCode: (id: string, index: number) => void
  updateNewBillingCode: (
    index: number,
    updates: Partial<BillingCodeDraft>,
  ) => void
  handleCreate: () => Promise<void>
  /** Saves a label's draft; resolves true once the update went through. */
  commitUpdate: (label: TodoLabel, draft: LabelDraft) => Promise<boolean>
  handleDelete: (id: string) => Promise<void>
  handleRestore: (id: string) => Promise<void>
  handlePurge: (id: string) => Promise<void>
}

export function useLabelManager({
  labels,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
  onRestoreLabel,
  onPurgeLabel,
}: UseLabelManagerParams): LabelManagerState {
  const colors = useChartColors()
  const presetColors = SET_COLORS.flatMap((preset) => {
    const value = toHex(colors[preset.token])
    return value ? [{ ...preset, value }] : []
  })

  const [newDraftState, setNewDraft] =
    React.useState<LabelDraft>(EMPTY_LABEL_DRAFT)
  const newDraft = newDraftState.color
    ? newDraftState
    : { ...newDraftState, color: presetColors[0]?.value ?? '' }
  const [drafts, setDrafts] = React.useState<Record<string, LabelDraft>>({})
  const [isSaving, setIsSaving] = React.useState(false)
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

  const updateDraft = (id: string, updates: Partial<LabelDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? EMPTY_LABEL_DRAFT),
        ...updates,
      },
    }))
  }

  const updateDraftBillingCode = (
    id: string,
    index: number,
    updates: Partial<BillingCodeDraft>,
  ) => {
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
  }

  const addDraftBillingCode = (id: string) => {
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
  }

  const removeDraftBillingCode = (id: string, index: number) => {
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
  }

  const updateNewBillingCode = (
    index: number,
    updates: Partial<BillingCodeDraft>,
  ) => {
    setNewDraft((prev) => ({
      ...prev,
      billingCodes: prev.billingCodes.map((billingCode, itemIndex) =>
        itemIndex === index ? { ...billingCode, ...updates } : billingCode,
      ),
    }))
  }

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
      return false
    }

    setIsSaving(true)
    const success = await onUpdateLabel(label.id, updates)
    setIsSaving(false)
    return success
  }

  const handleDelete = async (id: string) => {
    setIsSaving(true)
    await onDeleteLabel(id)
    setIsSaving(false)
  }

  const handleRestore = async (id: string) => {
    if (!onRestoreLabel) return
    setIsSaving(true)
    await onRestoreLabel(id)
    setIsSaving(false)
  }

  const handlePurge = async (id: string) => {
    if (!onPurgeLabel) return
    setIsSaving(true)
    await onPurgeLabel(id)
    setIsSaving(false)
  }

  return {
    newDraft,
    setNewDraft,
    presetColors,
    drafts,
    isSaving,
    newDraftError,
    updateDraft,
    updateDraftBillingCode,
    addDraftBillingCode,
    removeDraftBillingCode,
    updateNewBillingCode,
    handleCreate,
    commitUpdate,
    handleDelete,
    handleRestore,
    handlePurge,
  }
}
