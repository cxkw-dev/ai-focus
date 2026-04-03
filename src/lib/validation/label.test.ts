import { createLabelSchema, updateLabelSchema } from '@/lib/validation/label'
import { describe, expect, it } from 'vitest'

describe('label validation', () => {
  it('accepts labels without billing fields', () => {
    expect(
      createLabelSchema.parse({
        name: 'Amex',
        color: '#22c55e',
      }),
    ).toEqual({
      name: 'Amex',
      color: '#22c55e',
      billingCodes: undefined,
    })
  })

  it('normalizes blank billing descriptions to null', () => {
    expect(
      updateLabelSchema.parse({
        billingCodes: [
          {
            type: 'WBS',
            code: 'CUS/00396-0076.L.01',
            description: '  ',
            order: 0,
          },
        ],
      }),
    ).toEqual({
      billingCodes: [
        {
          type: 'WBS',
          code: 'CUS/00396-0076.L.01',
          description: null,
          order: 0,
        },
      ],
    })
  })

  it('requires a billing type when a code is set', () => {
    expect(() =>
      createLabelSchema.parse({
        name: 'Amex',
        billingCodes: [
          {
            type: '   ',
            code: 'CUS/00396-0076.L.01',
            order: 0,
          },
        ],
      }),
    ).toThrow('Type is required')
  })

  it('requires a billing code when billing details are present', () => {
    expect(() =>
      createLabelSchema.parse({
        name: 'Amex',
        billingCodes: [
          {
            type: 'WBS',
            code: '   ',
            description: 'Amex client work',
            order: 0,
          },
        ],
      }),
    ).toThrow('Code is required')
  })

  it('accepts complete billing records', () => {
    expect(
      createLabelSchema.parse({
        name: 'Amex',
        billingCodes: [
          {
            type: 'WBS',
            code: 'CUS/00396-0076.L.01',
            description: 'Amex client work',
            order: 0,
          },
          {
            type: 'Cost Center',
            code: 'AMEX-ENG-42',
            order: 1,
          },
        ],
      }),
    ).toEqual({
      name: 'Amex',
      billingCodes: [
        {
          type: 'WBS',
          code: 'CUS/00396-0076.L.01',
          description: 'Amex client work',
          order: 0,
        },
        {
          type: 'Cost Center',
          code: 'AMEX-ENG-42',
          order: 1,
          description: undefined,
        },
      ],
    })
  })

  it('rejects duplicate billing codes for the same label', () => {
    expect(() =>
      createLabelSchema.parse({
        name: 'Amex',
        billingCodes: [
          {
            type: 'WBS',
            code: 'CUS/00396-0076.L.01',
            order: 0,
          },
          {
            type: 'WBS',
            code: 'cus/00396-0076.l.01',
            order: 1,
          },
        ],
      }),
    ).toThrow('Billing codes must be unique within a label')
  })

  it('accepts clearing billing codes on update', () => {
    expect(
      updateLabelSchema.parse({
        billingCodes: [],
      }),
    ).toEqual({
      billingCodes: [],
    })
  })
})
