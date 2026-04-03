import {
  buildBillingCodeTitle,
  formatBillingCodeDisplay,
  getBillingCodeEntries,
  hasBillingCodes,
} from '@/lib/labels'
import type { BillingCode, Label } from '@/types/todo'
import { describe, expect, it } from 'vitest'

function createBillingCode(
  overrides: Partial<BillingCode> = {},
): BillingCode {
  return {
    id: overrides.id ?? 'billing-1',
    type: overrides.type ?? 'WBS',
    code: overrides.code ?? 'CUS/00396-0076.L.01',
    description:
      'description' in overrides
        ? (overrides.description ?? null)
        : 'Amex client work',
    order: overrides.order ?? 0,
    createdAt: overrides.createdAt ?? '2026-04-03T12:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-04-03T12:00:00.000Z',
  }
}

function createLabel(overrides: Partial<Label> = {}): Label {
  return {
    id: overrides.id ?? 'label-1',
    name: overrides.name ?? 'Amex',
    color: overrides.color ?? '#22c55e',
    billingCodes:
      overrides.billingCodes ?? [createBillingCode()],
    createdAt: overrides.createdAt ?? '2026-04-03T12:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-04-03T12:00:00.000Z',
  }
}

describe('labels helpers', () => {
  it('detects when a label has billing codes', () => {
    expect(hasBillingCodes(createLabel())).toBe(true)
    expect(hasBillingCodes(createLabel({ billingCodes: [] }))).toBe(false)
  })

  it('formats billing display with type and code', () => {
    expect(formatBillingCodeDisplay(createBillingCode())).toBe(
      'WBS · CUS/00396-0076.L.01',
    )
  })

  it('builds a descriptive billing title', () => {
    expect(
      buildBillingCodeTitle('Amex', createBillingCode()),
    ).toBe(
      'Amex · WBS · CUS/00396-0076.L.01 · Amex client work',
    )
  })

  it('flattens labels into billing code entries', () => {
    expect(
      getBillingCodeEntries([
        createLabel({
          id: 'amex',
          billingCodes: [
            createBillingCode({ id: 'billing-1', order: 0 }),
            createBillingCode({
              id: 'billing-2',
              order: 1,
              code: 'CUS/00396-0076.L.02',
            }),
          ],
        }),
      ]),
    ).toEqual([
      {
        labelId: 'amex',
        labelName: 'Amex',
        labelColor: '#22c55e',
        billingCode: createBillingCode({ id: 'billing-1', order: 0 }),
      },
      {
        labelId: 'amex',
        labelName: 'Amex',
        labelColor: '#22c55e',
        billingCode: createBillingCode({
          id: 'billing-2',
          order: 1,
          code: 'CUS/00396-0076.L.02',
        }),
      },
    ])
  })
})
