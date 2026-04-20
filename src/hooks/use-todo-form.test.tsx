import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useTodoForm } from '@/hooks/use-todo-form'
import type { Todo } from '@/types/todo'

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: 't-1',
    taskNumber: 1,
    title: 'existing',
    description: 'body',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    dueDate: '2026-05-01T00:00:00.000Z',
    labels: [
      {
        id: 'l-1',
        name: 'a',
        color: '#fff',
        billingCodes: [],
        createdAt: '2026-04-01T00:00:00Z',
        updatedAt: '2026-04-01T00:00:00Z',
      },
    ],
    subtasks: [{ id: 's-1', title: 'one', completed: false, order: 0 }],
    myPrUrls: ['https://gh/1'],
    githubPrUrls: [],
    azureWorkItemUrl: null,
    azureDepUrls: [],
    myIssueUrls: [],
    githubIssueUrls: [],
    archived: false,
    order: 0,
    notebookNoteId: null,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
    statusChangedAt: '2026-04-01T00:00:00Z',
    completedAt: null,
    ...overrides,
  } as Todo
}

describe('useTodoForm', () => {
  it('initializes with blank defaults when no todo is passed', () => {
    const { result } = renderHook(() => useTodoForm())
    expect(result.current.title).toBe('')
    expect(result.current.priority).toBe('MEDIUM')
    expect(result.current.status).toBe('TODO')
    expect(result.current.subtasks).toEqual([])
  })

  it('populates from a passed todo', () => {
    const todo = makeTodo()
    const { result } = renderHook(() => useTodoForm(todo))
    expect(result.current.title).toBe('existing')
    expect(result.current.priority).toBe('HIGH')
    expect(result.current.dueDate).toBe('2026-05-01')
    expect(result.current.subtasks).toHaveLength(1)
    expect(result.current.labelIds).toEqual(['l-1'])
  })

  it('addSubtask ignores blank titles and assigns sequential orders', () => {
    const { result } = renderHook(() => useTodoForm())
    act(() => {
      result.current.addSubtask('   ')
      result.current.addSubtask('one')
      result.current.addSubtask('two')
    })
    expect(result.current.subtasks).toHaveLength(2)
    expect(result.current.subtasks.map((s) => s.order)).toEqual([0, 1])
  })

  it('moveSubtask reorders and reassigns orders', () => {
    const { result } = renderHook(() => useTodoForm())
    act(() => {
      result.current.addSubtask('a')
      result.current.addSubtask('b')
      result.current.addSubtask('c')
    })
    act(() => {
      result.current.moveSubtask(2, 0)
    })
    expect(result.current.subtasks.map((s) => s.title)).toEqual(['c', 'a', 'b'])
    expect(result.current.subtasks.map((s) => s.order)).toEqual([0, 1, 2])
  })

  it('addMyPrUrl dedupes and trims', () => {
    const { result } = renderHook(() => useTodoForm())
    act(() => {
      result.current.addMyPrUrl('  https://gh/1  ')
      result.current.addMyPrUrl('https://gh/1')
      result.current.addMyPrUrl('')
    })
    expect(result.current.myPrUrls).toEqual(['https://gh/1'])
  })

  it('reset returns to initial defaults', () => {
    const { result } = renderHook(() => useTodoForm())
    act(() => {
      result.current.setTitle('x')
      result.current.setPriority('URGENT')
      result.current.addSubtask('s1')
    })
    act(() => {
      result.current.reset()
    })
    expect(result.current.title).toBe('')
    expect(result.current.priority).toBe('MEDIUM')
    expect(result.current.subtasks).toEqual([])
  })

  it('toPayload trims title/description, converts dueDate to ISO or null, and renumbers subtask orders', () => {
    const { result } = renderHook(() => useTodoForm())
    act(() => {
      result.current.setTitle('  hello  ')
      result.current.setDescription('   ')
      result.current.setDueDate('2026-04-25')
      result.current.addSubtask('a')
    })
    const payload = result.current.toPayload()
    expect(payload.title).toBe('hello')
    expect(payload.description).toBeUndefined()
    expect(payload.dueDate).toBe(new Date('2026-04-25').toISOString())
    expect(payload.subtasks[0]).toMatchObject({
      title: 'a',
      order: 0,
      completed: false,
    })
  })
})
