import { createRef } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MentionSuggestionList } from '@/components/ui/mention-suggestion'

const people = [
  { id: 'p-1', name: 'Alice', email: 'alice@example.com' },
  { id: 'p-2', name: 'Bob', email: 'bob@example.com' },
]

type ListHandle = { onKeyDown: (props: { event: KeyboardEvent }) => boolean }

describe('MentionSuggestionList', () => {
  it('highlights with the arrow keys and picks with Enter', () => {
    const command = vi.fn()
    const ref = createRef<ListHandle>()
    render(<MentionSuggestionList ref={ref} items={people} command={command} />)

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveClass('is-active')

    act(() => {
      ref.current?.onKeyDown({
        event: new KeyboardEvent('keydown', { key: 'ArrowDown' }),
      })
    })
    expect(screen.getAllByRole('option')[1]).toHaveClass('is-active')

    act(() => {
      ref.current?.onKeyDown({
        event: new KeyboardEvent('keydown', { key: 'Enter' }),
      })
    })
    expect(command).toHaveBeenCalledWith({
      id: 'p-2',
      label: 'Bob',
      email: 'bob@example.com',
    })
  })

  it('picks on click and says when nobody matches', () => {
    const command = vi.fn()
    const { rerender } = render(
      <MentionSuggestionList items={people} command={command} />,
    )

    fireEvent.click(screen.getByRole('option', { name: /Alice/ }))
    expect(command).toHaveBeenCalledWith({
      id: 'p-1',
      label: 'Alice',
      email: 'alice@example.com',
    })

    rerender(<MentionSuggestionList items={[]} command={command} />)
    expect(screen.getByText('No people found')).toBeInTheDocument()
  })
})
