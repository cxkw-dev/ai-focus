import type { Todo, CreateTodoInput, UpdateTodoInput, Label } from '@/types/todo'
import type { YearStats } from '@/types/stats'
import type { NotebookNote, CreateNotebookNoteInput, UpdateNotebookNoteInput } from '@/types/notebook'

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

  toggleSubtask: (todoId: string, subtaskId: string, completed: boolean): Promise<Todo> =>
    fetch(`/api/todos/${todoId}/subtasks/${subtaskId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ completed }),
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

export const notebookApi = {
  list: (params?: { search?: string }): Promise<NotebookNote[]> => {
    const sp = new URLSearchParams()
    if (params?.search) sp.set('search', params.search)
    const q = sp.toString()
    return fetch(`/api/notebook${q ? `?${q}` : ''}`).then(r => json(r))
  },

  get: (id: string): Promise<NotebookNote> =>
    fetch(`/api/notebook/${id}`).then(r => json(r)),

  create: (data?: CreateNotebookNoteInput): Promise<NotebookNote> =>
    fetch('/api/notebook', {
      method: 'POST',
      headers,
      body: JSON.stringify(data ?? {}),
    }).then(r => json(r)),

  update: (id: string, data: UpdateNotebookNoteInput): Promise<NotebookNote> =>
    fetch(`/api/notebook/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    }).then(r => json(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`/api/notebook/${id}`, { method: 'DELETE' }).then(r => json(r)),
}

export const statsApi = {
  yearReview: (year: number): Promise<YearStats> =>
    fetch(`/api/stats/year?year=${year}`).then(r => json(r)),
}
