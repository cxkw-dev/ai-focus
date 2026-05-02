import { Plus, ReceiptText, Trash2 } from 'lucide-react'
import { buildBillingCodeTitle, formatBillingCodeDisplay } from '@/lib/labels'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  color: string
  billingCodes: BillingCodeDraft[]
}

export const EMPTY_BILLING_CODE_DRAFT: BillingCodeDraft = {
  type: '',
  code: '',
  description: '',
}

export const EMPTY_LABEL_DRAFT: LabelDraft = {
  name: '',
  color: '#22c55e',
  billingCodes: [],
}

export function createBillingCodeDraft(): BillingCodeDraft {
  return { ...EMPTY_BILLING_CODE_DRAFT }
}

export function createDraftFromLabel(label: TodoLabel): LabelDraft {
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

export function buildUpdatePayload(
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

export function hasDraftChanges(label: TodoLabel, draft: LabelDraft) {
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
