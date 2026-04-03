import { createTodoSchema, updateTodoSchema } from '@/lib/validation/todo'
import { describe, expect, it } from 'vitest'

describe('todo validation', () => {
  it('accepts unique subtask ids', () => {
    expect(
      updateTodoSchema.parse({
        subtasks: [
          { id: 'new-a', title: 'First', order: 0 },
          { id: 'new-b', title: 'Second', order: 1 },
        ],
      }),
    ).toEqual({
      subtasks: [
        { id: 'new-a', title: 'First', order: 0 },
        { id: 'new-b', title: 'Second', order: 1 },
      ],
    })
  })

  it('rejects duplicate subtask ids on update', () => {
    expect(() =>
      updateTodoSchema.parse({
        subtasks: [
          { id: 'new-a', title: 'First', order: 0 },
          { id: 'new-a', title: 'Second', order: 1 },
        ],
      }),
    ).toThrow('Subtask ids must be unique')
  })

  it('rejects duplicate subtask ids on create', () => {
    expect(() =>
      createTodoSchema.parse({
        title: 'Ship it',
        subtasks: [
          { id: 'new-a', title: 'First', order: 0 },
          { id: 'new-a', title: 'Second', order: 1 },
        ],
      }),
    ).toThrow('Subtask ids must be unique')
  })
})
