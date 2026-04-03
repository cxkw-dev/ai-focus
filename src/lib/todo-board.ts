import type { Todo, TodoBoardResponse } from '@/types/todo'

export function createEmptyTodoBoard(): TodoBoardResponse {
  return { active: [], completed: [], deleted: [] }
}

export function removeTodoFromList(todos: Todo[], todoId: string) {
  return todos.filter((todo) => todo.id !== todoId)
}

export function findTodoInBoard(
  board: TodoBoardResponse | undefined,
  todoId: string,
) {
  if (!board) {
    return undefined
  }

  return [...board.active, ...board.completed, ...board.deleted].find(
    (todo) => todo.id === todoId,
  )
}

export function updateTodoInBoard(
  board: TodoBoardResponse,
  todoId: string,
  updater: (todo: Todo) => Todo,
): TodoBoardResponse {
  return {
    active: board.active.map((todo) =>
      todo.id === todoId ? updater(todo) : todo,
    ),
    completed: board.completed.map((todo) =>
      todo.id === todoId ? updater(todo) : todo,
    ),
    deleted: board.deleted.map((todo) =>
      todo.id === todoId ? updater(todo) : todo,
    ),
  }
}

export function sortTodosByBoardPosition(todos: Todo[]) {
  return [...todos].sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order
    }

    return (
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
  })
}

function getBoardSection(todo: Todo) {
  if (todo.status === 'COMPLETED' || todo.status === 'CANCELLED') {
    return 'completed' as const
  }

  if (todo.archived) {
    return 'deleted' as const
  }

  return 'active' as const
}

export function placeTodoInBoard(
  board: TodoBoardResponse,
  todo: Todo,
): TodoBoardResponse {
  const nextBoard = {
    active: removeTodoFromList(board.active, todo.id),
    completed: removeTodoFromList(board.completed, todo.id),
    deleted: removeTodoFromList(board.deleted, todo.id),
  }

  const section = getBoardSection(todo)

  if (section === 'completed') {
    return {
      ...nextBoard,
      completed: sortTodosByBoardPosition([...nextBoard.completed, todo]),
    }
  }

  if (section === 'deleted') {
    return {
      ...nextBoard,
      deleted: sortTodosByBoardPosition([...nextBoard.deleted, todo]),
    }
  }

  return {
    ...nextBoard,
    active: sortTodosByBoardPosition([...nextBoard.active, todo]),
  }
}

export function applyReorderedActiveTodos(
  board: TodoBoardResponse,
  reorderedTodos: Todo[],
): TodoBoardResponse {
  const orderMap = new Map(
    reorderedTodos.map((todo, index) => [todo.id, index]),
  )

  return {
    ...board,
    active: sortTodosByBoardPosition(
      board.active.map((todo) =>
        orderMap.has(todo.id)
          ? { ...todo, order: orderMap.get(todo.id)! }
          : todo,
      ),
    ),
  }
}
