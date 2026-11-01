'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Icon } from '@/components/ui/icon'
import {
  BillingCodeFields,
  createBillingCodeDraft,
  LabelDraftError,
  LabelFields,
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
  const titleId = React.useId()
  const name = newDraft.name.trim()

  return (
    <form
      className="dd-form"
      aria-labelledby={titleId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void handleCreate()
      }}
    >
      <section className="dd-form__section dd-form__section--panel">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="dd-form__head flex-1 basis-60">
            <h2 className="dd-form__title" id={titleId}>
              New label
            </h2>
            <p className="dd-form__desc">
              Its name and colour follow it onto todo columns and chips.
            </p>
          </div>
          {newDraft.color && (
            <Chip color={newDraft.color}>{name || 'Preview'}</Chip>
          )}
        </div>

        <LabelFields
          draft={newDraft}
          presetColors={presetColors}
          disabled={disabled || isSaving}
          onChange={(updates) =>
            setNewDraft((prev) => ({ ...prev, ...updates }))
          }
        />

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
          helperText="Add a code only when tasks with this label need SAP-ready copy. Each one shows in the task’s billing drawer."
          emptyText="No billing codes yet — most labels don’t need one."
          labelName={name || 'Label'}
        />

        {newDraftError && <LabelDraftError>{newDraftError}</LabelDraftError>}

        <div className="dd-form__footer">
          <span className="dd-form__meta">
            <Icon name="info" />
            Then attach it to tasks and copy codes from their billing drawer.
          </span>
          <Button
            type="submit"
            variant="primary"
            disabled={!name || Boolean(newDraftError) || disabled || isSaving}
          >
            <Icon name="plus" />
            Add label
          </Button>
        </div>
      </section>
    </form>
  )
}
