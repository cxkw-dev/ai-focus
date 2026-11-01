'use client'

import * as React from 'react'
import { buildBillingCodeTitle, formatBillingCodeDisplay } from '@/lib/labels'
import { Button, IconButton } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { Icon } from '@/components/ui/icon'
import { Input, Textarea, TextField } from '@/components/ui/input'
import { Tip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { PresetColor } from './use-label-manager'
import type {
  BillingCodeInput,
  CreateLabelInput,
  Label as TodoLabel,
  UpdateLabelInput,
} from '@/types/todo'

export type BillingCodeDraft = {
  type: string
  code: string
  description: string
}

export type LabelDraft = {
  name: string
  /** Hex colour; empty on a new draft until one is picked (the manager fills in the first set colour). */
  color: string
  repoUrl: string
  billingCodes: BillingCodeDraft[]
}

export const EMPTY_BILLING_CODE_DRAFT: BillingCodeDraft = {
  type: '',
  code: '',
  description: '',
}

export const EMPTY_LABEL_DRAFT: LabelDraft = {
  name: '',
  color: '',
  repoUrl: '',
  billingCodes: [],
}

export function createBillingCodeDraft(): BillingCodeDraft {
  return { ...EMPTY_BILLING_CODE_DRAFT }
}

export function createDraftFromLabel(label: TodoLabel): LabelDraft {
  return {
    name: label.name,
    color: label.color,
    repoUrl: label.repoUrl ?? '',
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

export function normalizeBillingCodes(
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

export function getBillingDraftError(billingCodes: BillingCodeDraft[]) {
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

export function buildCreatePayload(draft: LabelDraft): CreateLabelInput {
  const billingCodes = normalizeBillingCodes(draft.billingCodes)
  const repoUrl = normalizeField(draft.repoUrl)

  return {
    name: draft.name.trim(),
    ...(draft.color ? { color: draft.color } : {}),
    ...(repoUrl ? { repoUrl } : {}),
    ...(billingCodes.length > 0 ? { billingCodes } : {}),
  }
}

function areBillingCodesEqual(
  left: BillingCodeInput[],
  right: BillingCodeInput[],
) {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function buildUpdatePayload(
  label: TodoLabel,
  draft: LabelDraft,
): UpdateLabelInput {
  const updates: UpdateLabelInput = {}
  const normalizedName = draft.name.trim()
  const normalizedRepoUrl = normalizeField(draft.repoUrl)
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

  if (normalizedRepoUrl !== label.repoUrl) {
    updates.repoUrl = normalizedRepoUrl
  }

  if (!areBillingCodesEqual(normalizedBillingCodes, currentBillingCodes)) {
    updates.billingCodes = normalizedBillingCodes
  }

  return updates
}

export function hasDraftChanges(label: TodoLabel, draft: LabelDraft) {
  return Object.keys(buildUpdatePayload(label, draft)).length > 0
}

/** A form-level problem (a billing code missing its type, a duplicate code), in the field error style. */
export function LabelDraftError({ children }: { children: React.ReactNode }) {
  return (
    <p className="dd-field__error" role="alert">
      <Icon name="error" />
      {children}
    </p>
  )
}

interface LabelColorPickerProps {
  color: string
  presetColors: PresetColor[]
  disabled?: boolean
  onChange: (color: string) => void
  className?: string
}

/** The colour set as round swatches, plus a native picker for any other colour. Stores a hex either way. */
export function LabelColorPicker({
  color,
  presetColors,
  disabled,
  onChange,
  className,
}: LabelColorPickerProps) {
  return (
    <fieldset
      className={cn('m-0 flex min-w-0 flex-col border-0 p-0', className)}
      disabled={disabled}
    >
      <legend className="dd-radio-group__legend">Colour</legend>
      <div className="flex flex-wrap items-center gap-2">
        {presetColors.map((preset) => {
          const selected = color.toLowerCase() === preset.value
          return (
            <Tip key={preset.token} label={preset.name}>
              <button
                type="button"
                aria-pressed={selected}
                aria-label={`Use ${preset.name.toLowerCase()}`}
                onClick={() => onChange(preset.value)}
                className={cn(
                  'ease-gentle size-6 rounded-full outline-offset-2 transition-transform duration-[var(--dd-dur-fast)] hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50',
                  preset.className,
                  selected && 'outline-text outline-2',
                )}
              />
            </Tip>
          )
        })}
        {color && (
          <span className="flex items-center gap-2">
            <span
              className="bg-border mx-1 hidden h-5 w-px sm:block"
              aria-hidden="true"
            />
            <Tip label="Any colour">
              <input
                type="color"
                value={color}
                onChange={(e) => onChange(e.target.value)}
                aria-label="Label color"
                className="app-color-swatch size-6 cursor-pointer rounded-full border-0 bg-transparent p-0 disabled:cursor-not-allowed"
              />
            </Tip>
            <span className="dd-mono text-quiet text-xs">{color}</span>
          </span>
        )}
      </div>
    </fieldset>
  )
}

interface LabelFieldsProps {
  draft: LabelDraft
  presetColors: PresetColor[]
  disabled?: boolean
  onChange: (updates: Partial<LabelDraft>) => void
}

/** Name, repository and colour: the label's identity, shared by the create form and the edit drawer. */
export function LabelFields({
  draft,
  presetColors,
  disabled,
  onChange,
}: LabelFieldsProps) {
  const repoId = React.useId()
  return (
    <div className="dd-form__grid">
      <TextField
        label="Name"
        value={draft.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="e.g. AMEX"
        autoComplete="off"
        disabled={disabled}
      />
      <div className="dd-field">
        <label className="dd-field__label" htmlFor={repoId}>
          GitHub repo <span className="dd-field__opt">· optional</span>
        </label>
        <Input
          id={repoId}
          type="url"
          inputMode="url"
          value={draft.repoUrl}
          onChange={(e) => onChange({ repoUrl: e.target.value })}
          placeholder="https://github.com/org/repo"
          disabled={disabled}
        />
      </div>
      <LabelColorPicker
        className="dd-form__span"
        color={draft.color}
        presetColors={presetColors}
        disabled={disabled}
        onChange={(color) => onChange({ color })}
      />
    </div>
  )
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

export function BillingCodeFields({
  billingCodes,
  disabled,
  onAdd,
  onChange,
  onRemove,
  helperText,
  emptyText,
  labelName,
}: BillingCodeFieldsProps) {
  const headingId = React.useId()

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className="flex min-w-0 flex-col gap-3"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-1 basis-60 flex-col gap-0.5">
          <h3 id={headingId} className="m-0 text-sm font-semibold">
            Billing codes
          </h3>
          <p className="text-muted m-0 text-xs">{helperText}</p>
        </div>
        <Button type="button" size="sm" onClick={onAdd} disabled={disabled}>
          <Icon name="plus" />
          Add code
        </Button>
      </div>

      {billingCodes.length === 0 ? (
        <p className="bg-surface-2 rounded-box text-muted m-0 flex items-center gap-2 px-3 py-2.5 text-xs">
          <Icon name="file" className="text-quiet" />
          {emptyText}
        </p>
      ) : (
        <ol className="m-0 flex list-none flex-col p-0">
          {billingCodes.map((billingCode, index) => {
            const type = normalizeField(billingCode.type)
            const code = normalizeField(billingCode.code)
            const description = normalizeField(billingCode.description)

            return (
              <li
                key={index}
                className="border-border flex flex-col gap-2 border-t py-3 first:border-t-0 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="dd-eyebrow flex-none">Code {index + 1}</span>
                  {type && code && (
                    <Chip
                      className="min-w-0"
                      title={buildBillingCodeTitle(labelName, {
                        type,
                        code,
                        description,
                      })}
                    >
                      <Icon name="file" />
                      <span className="truncate font-mono">
                        {formatBillingCodeDisplay({ type, code })}
                      </span>
                    </Chip>
                  )}
                  <IconButton
                    icon="trash"
                    label={`Remove billing code ${index + 1}`}
                    size="sm"
                    className="ml-auto flex-none"
                    onClick={() => onRemove(index)}
                    disabled={disabled}
                  />
                </div>
                <BillingCodeInputs
                  billingCode={billingCode}
                  disabled={disabled}
                  onChange={(updates) => onChange(index, updates)}
                />
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

function BillingCodeInputs({
  billingCode,
  disabled,
  onChange,
}: {
  billingCode: BillingCodeDraft
  disabled?: boolean
  onChange: (updates: Partial<BillingCodeDraft>) => void
}) {
  const descriptionId = React.useId()
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-3 gap-y-3">
      <TextField
        label="Type"
        value={billingCode.type}
        onChange={(e) => onChange({ type: e.target.value })}
        placeholder="e.g. WBS"
        autoComplete="off"
        disabled={disabled}
      />
      <TextField
        label="Code"
        value={billingCode.code}
        onChange={(e) => onChange({ code: e.target.value })}
        className="dd-mono"
        autoComplete="off"
        disabled={disabled}
      />
      <div className="dd-field col-span-2">
        <label className="dd-field__label" htmlFor={descriptionId}>
          Description <span className="dd-field__opt">· optional</span>
        </label>
        <Textarea
          id={descriptionId}
          value={billingCode.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={2}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
