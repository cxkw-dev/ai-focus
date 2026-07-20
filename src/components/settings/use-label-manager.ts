'use client'

import * as React from 'react'
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

export interface PresetColor {
  varName: string
  value: string
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
  newDraft: LabelDraft
  setNewDraft: React.Dispatch<React.SetStateAction<LabelDraft>>
  presetColors: PresetColor[]
  drafts: Record<string, LabelDraft>
  isSaving: boolean
  isCompact: boolean
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
  commitUpdate: (label: TodoLabel, draft: LabelDraft) => Promise<void>
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

    const uniquePresets: PresetColor[] = []
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
    isCompact,
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
