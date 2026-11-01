import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TodoItemMetaRow } from './todo-item-meta-row'
import type { Label, Todo } from '@/types/todo'

function makeLabel(id: string, name: string): Label {
  return {
    id,
    name,
    color: '#22c55e',
    repoUrl: null,
    billingCodes: [],
    archived: false,
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: 't-1',
    taskNumber: 163,
    title: 'Card',
    description: null,
    status: 'TODO',
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

const amex = makeLabel('p-amex', 'AMEX')
const kaf = makeLabel('p-kaf', 'KAF')

describe('TodoItemMetaRow', () => {
  it('shows the task number and nothing else for a plain card', () => {
    render(<TodoItemMetaRow todo={makeTodo()} viewMode="active" />)
    expect(screen.getByText('#163')).toBeInTheDocument()
    expect(screen.queryByText('To Do')).not.toBeInTheDocument()
    expect(screen.queryByText('Medium')).not.toBeInTheDocument()
  })

  it("leaves off the board's own project but keeps other labels", () => {
    const todo = makeTodo({ labels: [amex, kaf] })
    const { rerender } = render(
      <TodoItemMetaRow todo={todo} viewMode="active" projectId="p-amex" />,
    )
    expect(screen.queryByText('AMEX')).not.toBeInTheDocument()
    expect(screen.getByText('KAF')).toBeInTheDocument()

    rerender(<TodoItemMetaRow todo={todo} viewMode="active" />)
    expect(screen.getByText('AMEX')).toBeInTheDocument()
  })

  it('shows the status only where the lane mixes several, or off the board', () => {
    const { rerender } = render(
      <TodoItemMetaRow
        todo={makeTodo({ status: 'IN_PROGRESS' })}
        viewMode="active"
      />,
    )
    expect(screen.queryByText('In Progress')).not.toBeInTheDocument()

    rerender(
      <TodoItemMetaRow
        todo={makeTodo({ status: 'WAITING' })}
        viewMode="active"
      />,
    )
    expect(screen.getByText('Waiting')).toBeInTheDocument()

    rerender(<TodoItemMetaRow todo={makeTodo()} viewMode="deleted" />)
    expect(screen.getByText('To Do')).toBeInTheDocument()
  })

  it('shows the priority only when it is raised', () => {
    const { rerender } = render(
      <TodoItemMetaRow
        todo={makeTodo({ priority: 'LOW' })}
        viewMode="active"
      />,
    )
    expect(screen.queryByText('Low')).not.toBeInTheDocument()

    rerender(
      <TodoItemMetaRow
        todo={makeTodo({ priority: 'HIGH' })}
        viewMode="active"
      />,
    )
    expect(screen.getByText('High')).toBeInTheDocument()

    rerender(
      <TodoItemMetaRow
        todo={makeTodo({ priority: 'URGENT' })}
        viewMode="active"
      />,
    )
    expect(screen.getByText('Urgent')).toBeInTheDocument()
  })
})
