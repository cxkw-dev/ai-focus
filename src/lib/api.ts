import type {
  AzureWorkItemStatus,
  CreateLabelInput,
  CreateTodoInput,
  GitHubIssueStatus,
  GitHubPrStatus,
  Label,
  PaginatedTodosResponse,
  Priority,
  Session,
  SessionTool,
  Status,
  StatusUpdate,
  Todo,
  TodoBoardResponse,
  TodoSortBy,
  TodoContact,
  UpdateTodoInput,
  UpdateLabelInput,
} from '@/types/todo'
import type { YearStats } from '@/types/stats'
import type {
  CreateNotebookNoteInput,
  NotebookNote,
  UpdateNotebookNoteInput,
} from '@/types/notebook'
import type { Person } from '@/types/person'
import type {
  Accomplishment,
  CreateAccomplishmentInput,
  UpdateAccomplishmentInput,
} from '@/types/accomplishment'
import { buildUrl, requestJson, withJsonBody } from '@/lib/http-client'

export interface ListTodosParams {
  archived?: boolean
  excludeStatus?: Status
  priority?: Priority
  status?: Status
}

export interface ListPaginatedTodosParams extends ListTodosParams {
  search?: string
  limit: number
  offset: number
  sortBy?: TodoSortBy
}

export interface CreateSessionInput {
  tool: SessionTool
  command: string
  workingPath: string
}

export interface CreateStatusUpdateInput {
  content: string
  status?: Status
}

export const todosApi = {
  board: (): Promise<TodoBoardResponse> => requestJson('/api/todos/board'),

  list: (params?: ListTodosParams): Promise<Todo[]> =>
    requestJson(buildUrl('/api/todos', params)),

  listPaginated: (
    params: ListPaginatedTodosParams,
  ): Promise<PaginatedTodosResponse> =>
    requestJson(buildUrl('/api/todos', params)),

  create: (data: CreateTodoInput): Promise<Todo> =>
    requestJson('/api/todos', withJsonBody(data, { method: 'POST' })),

  update: (
    id: string,
    data: UpdateTodoInput & { archived?: boolean },
  ): Promise<Todo> =>
    requestJson(`/api/todos/${id}`, withJsonBody(data, { method: 'PATCH' })),

  delete: (id: string): Promise<{ success: boolean }> =>
    requestJson(`/api/todos/${id}`, { method: 'DELETE' }),

  reorder: (orderedIds: string[]): Promise<{ success: boolean }> =>
    requestJson(
      '/api/todos/reorder',
      withJsonBody({ orderedIds }, { method: 'POST' }),
    ),

  toggleSubtask: (
    todoId: string,
    subtaskId: string,
    completed: boolean,
  ): Promise<Todo> =>
    requestJson(
      `/api/todos/${todoId}/subtasks/${subtaskId}`,
      withJsonBody({ completed }, { method: 'PATCH' }),
    ),

  createSession: (
    todoId: string,
    data: CreateSessionInput,
  ): Promise<Session> =>
    requestJson(
      `/api/todos/${todoId}/sessions`,
      withJsonBody(data, { method: 'POST' }),
    ),

  deleteSession: (sessionId: string): Promise<{ success: boolean }> =>
    requestJson(`/api/sessions/${sessionId}`, { method: 'DELETE' }),
}

export const labelsApi = {
  list: (): Promise<Label[]> => requestJson('/api/labels'),

  create: (data: CreateLabelInput): Promise<Label> =>
    requestJson('/api/labels', withJsonBody(data, { method: 'POST' })),

  update: (id: string, data: UpdateLabelInput): Promise<Label> =>
    requestJson(`/api/labels/${id}`, withJsonBody(data, { method: 'PATCH' })),

  delete: (id: string): Promise<{ success: boolean }> =>
    requestJson(`/api/labels/${id}`, { method: 'DELETE' }),
}

export const notebookApi = {
  list: (params?: { search?: string }): Promise<NotebookNote[]> =>
    requestJson(buildUrl('/api/notebook', params)),

  get: (id: string): Promise<NotebookNote> =>
    requestJson(`/api/notebook/${id}`),

  create: (data?: CreateNotebookNoteInput): Promise<NotebookNote> =>
    requestJson('/api/notebook', withJsonBody(data ?? {}, { method: 'POST' })),

  update: (id: string, data: UpdateNotebookNoteInput): Promise<NotebookNote> =>
    requestJson(`/api/notebook/${id}`, withJsonBody(data, { method: 'PATCH' })),

  delete: (id: string): Promise<{ success: boolean }> =>
    requestJson(`/api/notebook/${id}`, { method: 'DELETE' }),
}

export const githubApi = {
  getPrStatus: (url: string): Promise<GitHubPrStatus> =>
    requestJson(buildUrl('/api/github/pr-status', { url })),

  getIssueStatus: (url: string): Promise<GitHubIssueStatus> =>
    requestJson(buildUrl('/api/github/issue-status', { url })),
}

export const azureApi = {
  getWorkItemStatus: (url: string): Promise<AzureWorkItemStatus> =>
    requestJson(buildUrl('/api/azure/workitem-status', { url })),
}

export const peopleApi = {
  list: (): Promise<Person[]> => requestJson('/api/people'),

  create: (data: Pick<Person, 'name' | 'email'>): Promise<Person> =>
    requestJson('/api/people', withJsonBody(data, { method: 'POST' })),

  update: (
    id: string,
    data: Partial<Pick<Person, 'name' | 'email'>>,
  ): Promise<Person> =>
    requestJson(`/api/people/${id}`, withJsonBody(data, { method: 'PATCH' })),

  delete: (id: string): Promise<{ success: boolean }> =>
    requestJson(`/api/people/${id}`, { method: 'DELETE' }),
}

export const todoContactsApi = {
  list: (todoId: string): Promise<TodoContact[]> =>
    requestJson(`/api/todos/${todoId}/contacts`),

  add: (
    todoId: string,
    data: { personId: string; role: string },
  ): Promise<TodoContact> =>
    requestJson(
      `/api/todos/${todoId}/contacts`,
      withJsonBody(data, { method: 'POST' }),
    ),

  update: (
    todoId: string,
    contactId: string,
    data: { role?: string; order?: number },
  ): Promise<TodoContact> =>
    requestJson(
      `/api/todos/${todoId}/contacts/${contactId}`,
      withJsonBody(data, { method: 'PATCH' }),
    ),

  remove: (todoId: string, contactId: string): Promise<{ success: boolean }> =>
    requestJson(`/api/todos/${todoId}/contacts/${contactId}`, {
      method: 'DELETE',
    }),
}

export const statusUpdatesApi = {
  list: (todoId: string): Promise<StatusUpdate[]> =>
    requestJson(`/api/todos/${todoId}/updates`),

  create: (
    todoId: string,
    data: CreateStatusUpdateInput,
  ): Promise<StatusUpdate> =>
    requestJson(
      `/api/todos/${todoId}/updates`,
      withJsonBody(data, { method: 'POST' }),
    ),

  remove: (todoId: string, updateId: string): Promise<{ success: boolean }> =>
    requestJson(`/api/todos/${todoId}/updates/${updateId}`, {
      method: 'DELETE',
    }),
}

export const accomplishmentsApi = {
  list: (year: number): Promise<Accomplishment[]> =>
    requestJson(buildUrl('/api/accomplishments', { year })),

  create: (data: CreateAccomplishmentInput): Promise<Accomplishment> =>
    requestJson('/api/accomplishments', withJsonBody(data, { method: 'POST' })),

  update: (
    id: string,
    data: UpdateAccomplishmentInput,
  ): Promise<Accomplishment> =>
    requestJson(
      `/api/accomplishments/${id}`,
      withJsonBody(data, { method: 'PATCH' }),
    ),

  delete: (id: string): Promise<{ success: boolean }> =>
    requestJson(`/api/accomplishments/${id}`, { method: 'DELETE' }),
}

export const statsApi = {
  yearReview: (year: number): Promise<YearStats> =>
    requestJson(buildUrl('/api/stats/year', { year })),
}
