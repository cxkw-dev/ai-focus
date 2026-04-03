import type { BillingCode, Label } from '@/types/todo'

export const LABELS_ROUTE = '/labels'

export function openLabelsRoute() {
  window.open(LABELS_ROUTE, '_blank', 'noopener,noreferrer')
}

export type BillingCodeEntry = {
  labelId: string
  labelName: string
  labelColor: string
  billingCode: BillingCode
}

export function hasBillingCodes(label: Pick<Label, 'billingCodes'>) {
  return label.billingCodes.length > 0
}

export function formatBillingCodeDisplay(
  billingCode: Pick<BillingCode, 'type' | 'code'>,
) {
  return `${billingCode.type} · ${billingCode.code}`
}

export function buildBillingCodeTitle(
  labelName: string,
  billingCode: {
    type: string
    code: string
    description?: string | null
  },
) {
  const parts = [labelName, billingCode.type, billingCode.code]

  if (billingCode.description) {
    parts.push(billingCode.description)
  }

  return parts.join(' · ')
}

export function getBillingCodeEntries(labels: Label[]): BillingCodeEntry[] {
  return labels.flatMap((label) =>
    label.billingCodes.map((billingCode) => ({
      labelId: label.id,
      labelName: label.name,
      labelColor: label.color,
      billingCode,
    })),
  )
}
