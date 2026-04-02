import type { Todo, TodoBoardResponse, TodoContact, StatusUpdate, Session, CreateTodoInput, UpdateTodoInput, Label, GitHubPrStatus, GitHubIssueStatus, AzureWorkItemStatus, PaginatedTodosResponse } from '@/types/todo'
import type { YearStats } from '@/types/stats'
import type { NotebookNote, CreateNotebookNoteInput, UpdateNotebookNoteInput } from '@/types/notebook'
import type { Person } from '@/types/person'
import type { Accomplishment, CreateAccomplishmentInput, UpdateAccomplishmentInput } from '@/types/accomplishment'

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

const headers = { 'Content-Type': 'application/json' } as const

export const todosApi = {
  board: (): Promise<TodoBoardResponse> =>
    fetch('/api/todos/board').then(r => json(r)),

  list: (params?: { archived?: boolean; excludeStatus?: string; status?: string }): Promise<Todo[]> => {
    const sp = new URLSearchParams()
    if (params?.archived !== undefined) sp.set('archived', String(params.archived))
    if (params?.excludeStatus) sp.set('excludeStatus', params.excludeStatus)
    if (params?.status) sp.set('status', params.status)
    const q = sp.toString()
    return fetch(`/api/todos${q ? `?${q}` : ''}`).then(r => json(r))
  },

  listPaginated: (params: {
    status?: string
    archived?: boolean
    excludeStatus?: string
    search?: string
    limit: number
    offset: number
    sortBy?: string
  }): Promise<PaginatedTodosResponse> => {
    const sp = new URLSearchParams()
    if (params.status) sp.set('status', params.status)
    if (params.archived !== undefined) sp.set('archived', String(params.archived))
    if (params.excludeStatus) sp.set('excludeStatus', params.excludeStatus)
    if (params.search) sp.set('search', params.search)
    sp.set('limit', String(params.limit))
    sp.set('offset', String(params.offset))
    if (params.sortBy) sp.set('sortBy', params.sortBy)
    return fetch(`/api/todos?${sp.toString()}`).then(r => json(r))
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

  createSession: (todoId: string, data: { tool: string; command: string; workingPath: string }): Promise<Session> =>
    fetch(`/api/todos/${todoId}/sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    }).then(r => json(r)),

  deleteSession: (sessionId: string): Promise<{ success: boolean }> =>
    fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' }).then(r => json(r)),
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

export const githubApi = {
  getPrStatus: (url: string): Promise<GitHubPrStatus> =>
    fetch(`/api/github/pr-status?url=${encodeURIComponent(url)}`).then(r => json(r)),

  getIssueStatus: (url: string): Promise<GitHubIssueStatus> =>
    fetch(`/api/github/issue-status?url=${encodeURIComponent(url)}`).then(r => json(r)),
}

export const azureApi = {
  getWorkItemStatus: (url: string): Promise<AzureWorkItemStatus> =>
    fetch(`/api/azure/workitem-status?url=${encodeURIComponent(url)}`).then(r => json(r)),
}

export const peopleApi = {
  list: (): Promise<Person[]> =>
    fetch('/api/people').then(r => json(r)),

  create: (data: Pick<Person, 'name' | 'email'>): Promise<Person> =>
    fetch('/api/people', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    }).then(r => json(r)),

  update: (id: string, data: Partial<Pick<Person, 'name' | 'email'>>): Promise<Person> =>
    fetch(`/api/people/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    }).then(r => json(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`/api/people/${id}`, { method: 'DELETE' }).then(r => json(r)),
}

export const todoContactsApi = {
  list: (todoId: string): Promise<TodoContact[]> =>
    fetch(`/api/todos/${todoId}/contacts`).then(r => json(r)),

  add: (todoId: string, data: { personId: string; role: string }): Promise<TodoContact> =>
    fetch(`/api/todos/${todoId}/contacts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    }).then(r => json(r)),

  update: (todoId: string, contactId: string, data: { role?: string; order?: number }): Promise<TodoContact> =>
    fetch(`/api/todos/${todoId}/contacts/${contactId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    }).then(r => json(r)),

  remove: (todoId: string, contactId: string): Promise<{ success: boolean }> =>
    fetch(`/api/todos/${todoId}/contacts/${contactId}`, { method: 'DELETE' }).then(r => json(r)),
}

export const statusUpdatesApi = {
  list: (todoId: string): Promise<StatusUpdate[]> =>
    fetch(`/api/todos/${todoId}/updates`).then(r => json(r)),

  create: (todoId: string, data: { content: string; status?: string }): Promise<StatusUpdate> =>
    fetch(`/api/todos/${todoId}/updates`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    }).then(r => json(r)),

  remove: (todoId: string, updateId: string): Promise<{ success: boolean }> =>
    fetch(`/api/todos/${todoId}/updates/${updateId}`, { method: 'DELETE' }).then(r => json(r)),
}

export const accomplishmentsApi = {
  list: (year: number): Promise<Accomplishment[]> =>
    fetch(`/api/accomplishments?year=${year}`).then(r => json(r)),

  create: (data: CreateAccomplishmentInput): Promise<Accomplishment> =>
    fetch('/api/accomplishments', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    }).then(r => json(r)),

  update: (id: string, data: UpdateAccomplishmentInput): Promise<Accomplishment> =>
    fetch(`/api/accomplishments/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    }).then(r => json(r)),

  delete: (id: string): Promise<{ success: boolean }> =>
    fetch(`/api/accomplishments/${id}`, { method: 'DELETE' }).then(r => json(r)),
}

export const statsApi = {
  yearReview: (year: number): Promise<YearStats> =>
    fetch(`/api/stats/year?year=${year}`).then(r => json(r)),
}
