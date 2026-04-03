import {
  applyReorderedActiveTodos,
  createEmptyTodoBoard,
  findTodoInBoard,
  placeTodoInBoard,
} from '@/lib/todo-board'
import type { Todo } from '@/types/todo'
import { describe, expect, it } from 'vitest'

function createTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: overrides.id ?? 'todo-1',
    taskNumber: overrides.taskNumber ?? 1,
    title: overrides.title ?? 'Ship refactor',
    description: overrides.description ?? null,
    status: overrides.status ?? 'TODO',
    archived: overrides.archived ?? false,
    priority: overrides.priority ?? 'MEDIUM',
    dueDate: overrides.dueDate ?? null,
    order: overrides.order ?? 0,
    createdAt: overrides.createdAt ?? '2026-04-01T10:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-04-01T10:00:00.000Z',
    completedAt: overrides.completedAt ?? null,
    statusChangedAt: overrides.statusChangedAt ?? '2026-04-01T10:00:00.000Z',
    labels: overrides.labels ?? [],
    subtasks: overrides.subtasks ?? [],
    myPrUrls: overrides.myPrUrls ?? [],
    githubPrUrls: overrides.githubPrUrls ?? [],
    azureWorkItemUrl: overrides.azureWorkItemUrl ?? null,
    azureDepUrls: overrides.azureDepUrls ?? [],
    myIssueUrls: overrides.myIssueUrls ?? [],
    githubIssueUrls: overrides.githubIssueUrls ?? [],
    notebookNoteId: overrides.notebookNoteId ?? null,
    notebookNote: overrides.notebookNote,
    sessions: overrides.sessions ?? [],
  }
}

describe('todo-board', () => {
  it('places todos into the correct board section', () => {
    const board = createEmptyTodoBoard()

    const activeTodo = createTodo({ id: 'active', order: 1 })
    const completedTodo = createTodo({
      id: 'completed',
      status: 'COMPLETED',
      archived: true,
      completedAt: '2026-04-02T12:00:00.000Z',
    })
    const deletedTodo = createTodo({ id: 'deleted', archived: true })

    const withActive = placeTodoInBoard(board, activeTodo)
    const withCompleted = placeTodoInBoard(withActive, completedTodo)
    const withDeleted = placeTodoInBoard(withCompleted, deletedTodo)

    expect(withDeleted.active).toEqual([activeTodo])
    expect(withDeleted.completed).toEqual([completedTodo])
    expect(withDeleted.deleted).toEqual([deletedTodo])
  })

  it('keeps active todos sorted by order and recency when a todo is updated', () => {
    const board = {
      active: [
        createTodo({
          id: 'later',
          order: 0,
          createdAt: '2026-04-01T12:00:00.000Z',
        }),
        createTodo({
          id: 'earlier',
          order: 1,
          createdAt: '2026-04-01T08:00:00.000Z',
        }),
      ],
      completed: [],
      deleted: [],
    }

    const updatedTodo = createTodo({
      id: 'earlier',
      order: 1,
      title: 'Earlier todo, edited',
      createdAt: '2026-04-01T08:00:00.000Z',
    })

    const nextBoard = placeTodoInBoard(board, updatedTodo)

    expect(nextBoard.active.map((todo) => todo.id)).toEqual([
      'later',
      'earlier',
    ])
    expect(nextBoard.active[1].title).toBe('Earlier todo, edited')
  })

  it('applies reordered active todos without disturbing other columns', () => {
    const todoA = createTodo({ id: 'a', order: 0 })
    const todoB = createTodo({ id: 'b', order: 1 })
    const completedTodo = createTodo({
      id: 'completed',
      status: 'COMPLETED',
      archived: true,
    })

    const nextBoard = applyReorderedActiveTodos(
      {
        active: [todoA, todoB],
        completed: [completedTodo],
        deleted: [],
      },
      [todoB, todoA],
    )

    expect(nextBoard.active.map((todo) => todo.id)).toEqual(['b', 'a'])
    expect(findTodoInBoard(nextBoard, 'completed')).toEqual(completedTodo)
  })
})
