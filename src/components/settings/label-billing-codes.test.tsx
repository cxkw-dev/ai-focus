import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  buildCreatePayload,
  buildUpdatePayload,
  EMPTY_LABEL_DRAFT,
  getBillingDraftError,
  LabelColorPicker,
} from './label-billing-codes'
import type { PresetColor } from './use-label-manager'
import type { Label } from '@/types/todo'

const label: Label = {
  id: 'label-1',
  name: 'Amex',
  color: '#c8694a',
  repoUrl: null,
  billingCodes: [
    {
      id: 'billing-1',
      type: 'WBS',
      code: 'CUS/00396',
      description: null,
      order: 0,
      createdAt: '2026-04-03T12:00:00.000Z',
      updatedAt: '2026-04-03T12:00:00.000Z',
    },
  ],
  archived: false,
  archivedAt: null,
  createdAt: '2026-04-03T12:00:00.000Z',
  updatedAt: '2026-04-03T12:00:00.000Z',
}

const presets: PresetColor[] = [
  { token: 'set1', name: 'Honey', className: 'bg-set-1', value: '#e0b04f' },
  { token: 'set2', name: 'Amber', className: 'bg-set-2', value: '#d9913c' },
]

describe('label drafts', () => {
  it('leaves the colour to the server until one is picked', () => {
    expect(
      buildCreatePayload({ ...EMPTY_LABEL_DRAFT, name: ' Amex ' }),
    ).toEqual({ name: 'Amex' })
  })

  it('sends the picked colour, repo and non-empty billing codes', () => {
    expect(
      buildCreatePayload({
        name: 'Amex',
        color: '#e0b04f',
        repoUrl: ' https://github.com/org/repo ',
        billingCodes: [
          { type: 'WBS', code: 'A-1', description: '' },
          { type: '', code: '', description: '' },
        ],
      }),
    ).toEqual({
      name: 'Amex',
      color: '#e0b04f',
      repoUrl: 'https://github.com/org/repo',
      billingCodes: [{ type: 'WBS', code: 'A-1', description: null, order: 0 }],
    })
  })

  it('updates only what changed', () => {
    expect(
      buildUpdatePayload(label, {
        name: 'Amex',
        color: '#e0b04f',
        repoUrl: '',
        billingCodes: [{ type: 'WBS', code: 'CUS/00396', description: '' }],
      }),
    ).toEqual({ color: '#e0b04f' })
  })

  it('explains an incomplete or duplicate billing code', () => {
    expect(
      getBillingDraftError([{ type: '', code: 'A-1', description: '' }]),
    ).toBe('Billing code 1 needs a type.')
    expect(
      getBillingDraftError([
        { type: 'WBS', code: 'A-1', description: '' },
        { type: 'WBS', code: 'a-1', description: '' },
      ]),
    ).toBe('Billing code 2 duplicates billing code 1.')
  })
})

describe('LabelColorPicker', () => {
  it('marks the current set colour and picks another', () => {
    const onChange = vi.fn()
    render(
      <LabelColorPicker
        color="#E0B04F"
        presetColors={presets}
        onChange={onChange}
      />,
    )

    expect(screen.getByRole('button', { name: 'Use honey' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Use amber' }))
    expect(onChange).toHaveBeenCalledWith('#d9913c')
    expect(screen.getByLabelText('Label color')).toHaveValue('#e0b04f')
  })
})
