import * as React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TodoItemSideTabs } from './todo-item-side-tabs'

function Harness({
  hasBillingEntries = true,
}: {
  hasBillingEntries?: boolean
}) {
  const [billingOpen, setBillingOpen] = React.useState(false)
  const [contactsOpen, setContactsOpen] = React.useState(false)
  const [timelineOpen, setTimelineOpen] = React.useState(false)
  return (
    <TodoItemSideTabs
      hasBillingEntries={hasBillingEntries}
      billingOpen={billingOpen}
      contactsOpen={contactsOpen}
      timelineOpen={timelineOpen}
      setBillingOpen={setBillingOpen}
      setContactsOpen={setContactsOpen}
      setTimelineOpen={setTimelineOpen}
    />
  )
}

describe('TodoItemSideTabs', () => {
  it('opens one drawer at a time and toggles the open one closed', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const billing = screen.getByRole('button', { name: 'Billing codes' })
    const contacts = screen.getByRole('button', { name: 'Contacts' })
    const timeline = screen.getByRole('button', { name: 'Timeline' })

    await user.click(contacts)
    expect(contacts).toHaveAttribute('aria-pressed', 'true')
    expect(billing).toHaveAttribute('aria-pressed', 'false')

    await user.click(timeline)
    expect(timeline).toHaveAttribute('aria-pressed', 'true')
    expect(contacts).toHaveAttribute('aria-pressed', 'false')

    await user.click(timeline)
    expect(timeline).toHaveAttribute('aria-pressed', 'false')
  })

  it('hides the billing tab when the todo has no billing codes', () => {
    render(<Harness hasBillingEntries={false} />)
    expect(
      screen.queryByRole('button', { name: 'Billing codes' }),
    ).not.toBeInTheDocument()
  })
})
