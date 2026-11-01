import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { TodoItemActions } from './todo-item-actions'
import type { Todo } from '@/types/todo'

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: 't-1',
    taskNumber: 163,
    title: 'Card',
    description: null,
    status: 'IN_PROGRESS',
    archived: false,
    priority: 'MEDIUM',
    dueDate: null,
    order: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    completedAt: null,
    statusChangedAt: '2026-01-01T00:00:00.000Z',
    labels: [],
    subtasks: [],
    myPrUrls: [],
    githubPrUrls: [],
    azureWorkItemUrl: null,
    azureDepUrls: [],
    myIssueUrls: [],
    githubIssueUrls: [],
    notebookNoteId: null,
    sessions: [],
    ...overrides,
  }
}

beforeAll(() => {
  // Radix positions its menu with a ResizeObserver, which jsdom lacks.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})

afterAll(() => {
  vi.unstubAllGlobals()
})

function renderActions(todo = makeTodo()) {
  const handlers = {
    onStatusChange: vi.fn(),
    onPriorityChange: vi.fn(),
    onDelete: vi.fn(),
    onEdit: vi.fn(),
  }
  render(<TodoItemActions todo={todo} viewMode="active" {...handlers} />)
  return handlers
}

describe('TodoItemActions', () => {
  it('changes status and priority from the ⋯ menu, with the current one checked', async () => {
    const user = userEvent.setup()
    const handlers = renderActions()

    await user.click(screen.getByRole('button', { name: 'More actions' }))
    expect(
      screen.getByRole('menuitemradio', { name: 'In Progress' }),
    ).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('menuitemradio', { name: 'Waiting' }))
    expect(handlers.onStatusChange).toHaveBeenCalledWith('t-1', 'WAITING')

    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'Urgent' }))
    expect(handlers.onPriorityChange).toHaveBeenCalledWith('t-1', 'URGENT')
  })

  it('does nothing when the current status is picked again', async () => {
    const user = userEvent.setup()
    const handlers = renderActions()

    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(screen.getByRole('menuitemradio', { name: 'In Progress' }))
    expect(handlers.onStatusChange).not.toHaveBeenCalled()
  })

  it('edits and deletes from the menu', async () => {
    const user = userEvent.setup()
    const todo = makeTodo()
    const handlers = renderActions(todo)

    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }))
    expect(handlers.onEdit).toHaveBeenCalledWith(todo)

    await user.click(screen.getByRole('button', { name: 'More actions' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    expect(handlers.onDelete).toHaveBeenCalledWith('t-1')
  })
})
