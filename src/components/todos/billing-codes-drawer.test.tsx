import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BillingCodesDrawer } from '@/components/todos/billing-codes-drawer'
import type { BillingCodeEntry } from '@/lib/labels'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function createEntry(
  overrides: Partial<BillingCodeEntry> = {},
): BillingCodeEntry {
  return {
    labelId: overrides.labelId ?? 'label-1',
    labelName: overrides.labelName ?? 'PROJECT - AMEX',
    labelColor: overrides.labelColor ?? '#c678dd',
    billingCode: overrides.billingCode ?? {
      id: 'billing-1',
      type: 'WBS',
      code: 'CUS/00396-0076.L.01',
      description: 'Primary billing code',
      order: 0,
      createdAt: '2026-04-03T12:00:00.000Z',
      updatedAt: '2026-04-03T12:00:00.000Z',
    },
  }
}

describe('BillingCodesDrawer', () => {
  const writeText = vi.fn()

  beforeEach(() => {
    writeText.mockResolvedValue(undefined)

    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
  })

  afterEach(() => {
    writeText.mockReset()
  })

  it('renders billing codes in a simplified list', () => {
    render(
      <BillingCodesDrawer
        entries={[
          createEntry(),
          createEntry({
            billingCode: {
              id: 'billing-2',
              type: 'Cost Center',
              code: 'AMEX-ENG-42',
              description: null,
              order: 1,
              createdAt: '2026-04-03T12:00:00.000Z',
              updatedAt: '2026-04-03T12:00:00.000Z',
            },
          }),
        ]}
        open={true}
        onClose={() => {}}
      />,
    )

    expect(screen.queryByText('PROJECT - AMEX')).not.toBeInTheDocument()
    expect(screen.getByText('WBS')).toBeInTheDocument()
    expect(screen.getByText('CUS/00396-0076.L.01')).toBeInTheDocument()
    expect(screen.getByText('Cost Center')).toBeInTheDocument()
    expect(screen.getByText('AMEX-ENG-42')).toBeInTheDocument()
  })

  it('copies only the billing code value and shows inline feedback', async () => {
    render(
      <BillingCodesDrawer
        entries={[createEntry()]}
        open={true}
        onClose={() => {}}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: /cus\/00396-0076\.l\.01/i }),
    )

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('CUS/00396-0076.L.01')
      expect(screen.getByText('Copied')).toBeInTheDocument()
    })
  })
})
