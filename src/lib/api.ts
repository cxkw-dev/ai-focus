import type { Todo, CreateTodoInput, UpdateTodoInput, Label, Category } from '@/types/todo'

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

const headers = { 'Content-Type': 'application/json' } as const

export const todosApi = {
  list: (params?: { archived?: boolean }): Promise<Todo[]> => {
    const sp = new URLSearchParams()
    if (params?.archived !== undefined) sp.set('archived', String(params.archived))
    const q = sp.toString()
    return fetch(`/api/todos${q ? `?${q}` : ''}`).then(r => json(r))
  },

  create: (data: CreateTodoInput): Promise<Todo> =>
    fetch('/api/todos', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    }).then(r => json(r)),

  update: (id: string, data: UpdateTodoInput & { archived?: boolean }): Promise<Todo> =>
    fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    }).then(r => json(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`/api/todos/${id}`, { method: 'DELETE' }).then(r => json(r)),

  reorder: (orderedIds: string[]): Promise<{ success: boolean }> =>
    fetch('/api/todos/reorder', {
      method: 'POST',
      headers,
      body: JSON.stringify({ orderedIds }),
    }).then(r => json(r)),
}

export const labelsApi = {
  list: (): Promise<Label[]> =>
    fetch('/api/labels').then(r => json(r)),

  create: (data: Pick<Label, 'name' | 'color'>): Promise<Label> =>
    fetch('/api/labels', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    }).then(r => json(r)),

  update: (id: string, data: Partial<Pick<Label, 'name' | 'color'>>): Promise<Label> =>
    fetch(`/api/labels/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    }).then(r => json(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`/api/labels/${id}`, { method: 'DELETE' }).then(r => json(r)),
}

export const categoriesApi = {
  list: (): Promise<Category[]> =>
    fetch('/api/categories').then(r => json(r)),
}
