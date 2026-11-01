import type { ComponentProps } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NotesSidebar } from '@/components/notes/notes-sidebar'
import type { NotebookNote } from '@/types/notebook'

function makeNote(overrides: Partial<NotebookNote> = {}): NotebookNote {
  const now = new Date().toISOString()
  return {
    id: 'n-1',
    title: 'Hello',
    content: '<p>body</p>',
    pinned: false,
    archived: false,
    createdAt: now,
    updatedAt: now,
    todo: null,
    ...overrides,
  }
}

const notes: NotebookNote[] = [
  makeNote({ id: 'n-1', title: 'Release plan' }),
  makeNote({ id: 'n-2', title: 'Groceries' }),
  makeNote({ id: 'n-3', title: 'Old idea', archived: true }),
  makeNote({
    id: 'n-4',
    title: 'Task notes',
    todo: {
      id: 't-1',
      taskNumber: 42,
      title: 'Ship it',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: null,
      labels: [],
    },
  }),
]

function renderSidebar(
  overrides: Partial<ComponentProps<typeof NotesSidebar>> = {},
) {
  const props: ComponentProps<typeof NotesSidebar> = {
    notes,
    selectedId: null,
    isScratchPadActive: false,
    onSelect: vi.fn(),
    onCreate: vi.fn(),
    onDelete: vi.fn(),
    onOpenScratchPad: vi.fn(),
    isLoading: false,
    ...overrides,
  }
  render(<NotesSidebar {...props} />)
  return props
}

describe('NotesSidebar', () => {
  it('lists standalone notes in their own casing and switches views with the segmented control', () => {
    renderSidebar()

    expect(screen.getByRole('radio', { name: 'Notes' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByText('Release plan')).toBeInTheDocument()
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.queryByText('Old idea')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: 'Tasks' }))
    expect(screen.getByText('Task notes')).toBeInTheDocument()
    expect(screen.getByText('#42')).toBeInTheDocument()
    expect(screen.queryByText('Release plan')).not.toBeInTheDocument()

    fireEvent.keyDown(screen.getByRole('radio', { name: 'Tasks' }), {
      key: 'ArrowRight',
    })
    expect(screen.getByRole('radio', { name: 'Archived' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByText('Old idea')).toBeInTheDocument()
  })

  it('filters by title and says when nothing matches', () => {
    renderSidebar()

    const search = screen.getByRole('textbox', { name: 'Search notes' })
    fireEvent.change(search, { target: { value: 'groc' } })
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.queryByText('Release plan')).not.toBeInTheDocument()

    fireEvent.change(search, { target: { value: 'nothing like this' } })
    expect(screen.getByText('No notes found')).toBeInTheDocument()
  })

  it('selects, deletes, creates and opens the scratch pad', () => {
    const props = renderSidebar({ selectedId: 'n-1' })

    expect(
      screen.getByRole('button', { name: /Release plan/ }),
    ).toHaveAttribute('aria-current', 'page')

    fireEvent.click(screen.getByRole('button', { name: /Groceries/ }))
    expect(props.onSelect).toHaveBeenCalledWith('n-2')

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete note' })[0])
    expect(props.onDelete).toHaveBeenCalledWith('n-1')

    fireEvent.click(screen.getByRole('button', { name: 'New note' }))
    expect(props.onCreate).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /Scratch pad/ }))
    expect(props.onOpenScratchPad).toHaveBeenCalled()
  })
})
