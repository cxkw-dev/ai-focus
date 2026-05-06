import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NoteDrawer } from '@/components/todos/note-drawer'
import { notebookApi } from '@/lib/api'
import { renderWithQueryClient } from '@/test/react-query'
import { makeNotebookNoteRow } from '@/test/fixtures'

vi.mock('@/lib/api', () => ({
  notebookApi: {
    get: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('@/components/ui/rich-text-editor', () => ({
  RichTextEditor: ({
    value,
    onChange,
  }: {
    value: string
    onChange: (value: string) => void
  }) => (
    <textarea
      aria-label="Note content"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}))

describe('NoteDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('loads a task note through React Query and autosaves with a mutation', async () => {
    const note = makeNotebookNoteRow({
      id: 'n-1',
      title: 'Task note',
      content: '<p>Initial body</p>',
      updatedAt: '2026-05-06T10:00:00.000Z',
    })
    const updatedNote = {
      ...note,
      content: '<p>Updated body</p>',
      updatedAt: '2026-05-06T10:01:00.000Z',
    }

    ;(notebookApi.get as ReturnType<typeof vi.fn>).mockResolvedValue(note)
    ;(notebookApi.update as ReturnType<typeof vi.fn>).mockResolvedValue(
      updatedNote,
    )

    const { client } = renderWithQueryClient(
      <NoteDrawer
        noteId="n-1"
        todoTitle="Related task"
        open={true}
        onClose={() => {}}
        onUnlink={() => {}}
      />,
    )

    expect(await screen.findByDisplayValue('Task note')).toBeInTheDocument()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Note content'), {
      target: { value: '<p>Updated body</p>' },
    })

    await waitFor(() => {
      expect(notebookApi.update).toHaveBeenCalledWith('n-1', {
        content: '<p>Updated body</p>',
      })
      expect(client.getQueryData(['notebook', 'n-1'])).toEqual(updatedNote)
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
  })
})
