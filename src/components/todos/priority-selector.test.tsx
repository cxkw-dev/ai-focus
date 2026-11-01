import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PrioritySelector } from './priority-selector'

describe('PrioritySelector', () => {
  it('checks the current priority and reports a new choice', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PrioritySelector value="MEDIUM" onChange={onChange} />)

    expect(screen.getByRole('radio', { name: 'Medium' })).toBeChecked()

    await user.click(screen.getByRole('radio', { name: 'Urgent' }))
    expect(onChange).toHaveBeenCalledWith('URGENT')
  })

  it('disables every option', () => {
    render(<PrioritySelector value="LOW" onChange={() => {}} disabled />)
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeDisabled()
    }
  })
})
