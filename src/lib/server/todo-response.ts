import type { Prisma } from '@prisma/client'
import { todoInclude } from '@/lib/todo-queries'
import { SESSION_TOOL_VALUES, type SessionTool } from '@/types/todo'

type TodoWithRelations = Prisma.TodoGetPayload<{ include: typeof todoInclude }>

const sessionToolSet = new Set<string>(SESSION_TOOL_VALUES)

function assertValidSessionTool(
  tool: string,
  context: { sessionId: string; todoId: string },
): asserts tool is SessionTool {
  if (sessionToolSet.has(tool)) {
    return
  }

  throw new Error(
    `Unexpected session tool "${tool}" for session ${context.sessionId} on todo ${context.todoId}`,
  )
}

export function validateTodoForResponse(todo: TodoWithRelations) {
  for (const session of todo.sessions) {
    assertValidSessionTool(session.tool, {
      sessionId: session.id,
      todoId: todo.id,
    })
  }

  return todo
}

export function validateTodosForResponse<T extends TodoWithRelations[]>(
  todos: T,
) {
  for (const todo of todos) {
    validateTodoForResponse(todo)
  }

  return todos
}

export function validateTodoBoardForResponse<T extends {
  active: TodoWithRelations[]
  completed: TodoWithRelations[]
  deleted: TodoWithRelations[]
}>(board: T) {
  validateTodosForResponse(board.active)
  validateTodosForResponse(board.completed)
  validateTodosForResponse(board.deleted)

  return board
}
