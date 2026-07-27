import type { Todo, TodoBoardResponse } from '@/types/todo'

export function createEmptyTodoBoard(): TodoBoardResponse {
  return {
    active: [],
    deleted: [],
    completedCounts: { total: 0, byProject: {} },
  }
}

/** Terminal statuses live outside the board, in the lazy completed list. */
export function isCompletedTodo(todo: Todo) {
  return todo.status === 'COMPLETED' || todo.status === 'CANCELLED'
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

  return [...board.active, ...board.deleted].find((todo) => todo.id === todoId)
}

export function updateTodoInBoard(
  board: TodoBoardResponse,
  todoId: string,
  updater: (todo: Todo) => Todo,
): TodoBoardResponse {
  return {
    ...board,
    active: board.active.map((todo) =>
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

/**
 * Routes a todo to the one list it belongs in. A finished todo belongs to
 * neither — it leaves the board entirely and reappears in the lazily-fetched
 * completed list, so here it is only evicted.
 */
export function placeTodoInBoard(
  board: TodoBoardResponse,
  todo: Todo,
): TodoBoardResponse {
  const nextBoard = {
    ...board,
    active: removeTodoFromList(board.active, todo.id),
    deleted: removeTodoFromList(board.deleted, todo.id),
  }

  if (isCompletedTodo(todo)) {
    return nextBoard
  }

  if (todo.archived) {
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
