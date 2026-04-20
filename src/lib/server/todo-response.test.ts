import {
  validateTodoBoardForResponse,
  validateTodoForResponse,
} from '@/lib/server/todo-response'
import { describe, expect, it } from 'vitest'

type TodoResponse = Parameters<typeof validateTodoForResponse>[0]

function createSession(
  overrides: Partial<TodoResponse['sessions'][number]> = {},
): TodoResponse['sessions'][number] {
  return {
    id: overrides.id ?? 'session-1',
    tool: overrides.tool ?? 'codex',
    command: overrides.command ?? 'codex resume 019d4ebb',
    workingPath: overrides.workingPath ?? '/Users/andynguyen/ai-focus',
    createdAt: overrides.createdAt ?? new Date('2026-04-02T12:00:00.000Z'),
    todoId: overrides.todoId ?? 'todo-1',
  }
}

function createTodo(overrides: Partial<TodoResponse> = {}): TodoResponse {
  return {
    id: overrides.id ?? 'todo-1',
    taskNumber: overrides.taskNumber ?? 1,
    title: overrides.title ?? 'Ship stricter session validation',
    description: overrides.description ?? null,
    priority: overrides.priority ?? 'MEDIUM',
    dueDate: overrides.dueDate ?? null,
    createdAt: overrides.createdAt ?? new Date('2026-04-01T10:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-04-01T10:00:00.000Z'),
    completedAt: overrides.completedAt ?? null,
    order: overrides.order ?? 0,
    archived: overrides.archived ?? false,
    status: overrides.status ?? 'TODO',
    statusChangedAt:
      overrides.statusChangedAt ?? new Date('2026-04-01T10:00:00.000Z'),
    myPrUrls: overrides.myPrUrls ?? [],
    githubPrUrls: overrides.githubPrUrls ?? [],
    azureWorkItemUrl: overrides.azureWorkItemUrl ?? null,
    azureDepUrls: overrides.azureDepUrls ?? [],
    myIssueUrls: overrides.myIssueUrls ?? [],
    githubIssueUrls: overrides.githubIssueUrls ?? [],
    notebookNoteId: overrides.notebookNoteId ?? null,
    labels: overrides.labels ?? [],
    subtasks: overrides.subtasks ?? [],
    notebookNote: overrides.notebookNote ?? null,
    sessions: overrides.sessions ?? [],
  }
}

describe('todo-response', () => {
  it('accepts todos with supported session tools', () => {
    const todo = createTodo({
      sessions: [
        createSession({ tool: 'codex' }),
        createSession({ tool: 'claude' }),
      ],
    })

    expect(validateTodoForResponse(todo)).toBe(todo)
  })

  it('throws a descriptive error for unsupported persisted session tools', () => {
    const todo = createTodo({
      sessions: [createSession({ id: 'legacy', tool: 'legacy-cli' })],
    })

    expect(() => validateTodoForResponse(todo)).toThrow(
      'Unexpected session tool "legacy-cli" for session legacy on todo todo-1',
    )
  })

  it('validates every column in the todo board payload', () => {
    const board = {
      active: [createTodo({ id: 'active', sessions: [createSession()] })],
      completed: [
        createTodo({
          id: 'completed',
          status: 'COMPLETED',
          archived: true,
          sessions: [createSession({ tool: 'claude' })],
        }),
      ],
      deleted: [],
    }

    expect(validateTodoBoardForResponse(board)).toBe(board)
  })
})
