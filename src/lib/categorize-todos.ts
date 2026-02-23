import type { Todo } from '@/types/todo'

export type TodoCategory = 'kaf' | 'projects' | 'others'

export interface CategorizedTodos {
  kaf: Todo[]
  projects: Todo[]
  others: Todo[]
}

export function getTodoCategory(todo: Todo): TodoCategory {
  const labels = todo.labels ?? []

  // KAF takes priority — exact match (case-insensitive)
  if (labels.some(l => l.name.toLowerCase() === 'kaf')) {
    return 'kaf'
  }

  // Projects — label name contains "project" (case-insensitive)
  if (labels.some(l => l.name.toLowerCase().includes('project'))) {
    return 'projects'
  }

  return 'others'
}

export function categorizeTodos(todos: Todo[]): CategorizedTodos {
  const result: CategorizedTodos = { kaf: [], projects: [], others: [] }

  for (const todo of todos) {
    result[getTodoCategory(todo)].push(todo)
  }

  return result
}
