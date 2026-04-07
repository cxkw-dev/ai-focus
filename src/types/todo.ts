export const TODO_PRIORITY_VALUES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
export type Priority = (typeof TODO_PRIORITY_VALUES)[number]

export const TODO_STATUS_VALUES = [
  'TODO',
  'IN_PROGRESS',
  'WAITING',
  'UNDER_REVIEW',
  'ON_HOLD',
  'BLOCKED',
  'COMPLETED',
  'CANCELLED',
] as const
export type Status = (typeof TODO_STATUS_VALUES)[number]

export const TODO_SORT_VALUES = ['order', 'completedAt', 'updatedAt'] as const
export type TodoSortBy = (typeof TODO_SORT_VALUES)[number]

export const SESSION_TOOL_VALUES = ['claude', 'codex'] as const
export type SessionTool = (typeof SESSION_TOOL_VALUES)[number]

export interface BillingCode {
  id: string
  type: string
  code: string
  description: string | null
  order: number
  createdAt: string
  updatedAt: string
}

export interface BillingCodeInput {
  type: string
  code: string
  description?: string | null
  order: number
}

export interface Label {
  id: string
  name: string
  color: string
  billingCodes: BillingCode[]
  createdAt: string
  updatedAt: string
}

export interface CreateLabelInput {
  name: string
  color?: string
  billingCodes?: BillingCodeInput[]
}

export interface UpdateLabelInput {
  name?: string
  color?: string
  billingCodes?: BillingCodeInput[]
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
  order: number
}

export interface Todo {
  id: string
  taskNumber: number
  title: string
  description: string | null
  status: Status
  archived: boolean
  priority: Priority
  dueDate: string | null
  order: number
  createdAt: string
  updatedAt: string
  completedAt: string | null
  statusChangedAt: string
  labels: Label[]
  subtasks: Subtask[]
  myPrUrls: string[]
  githubPrUrls: string[]
  azureWorkItemUrl: string | null
  azureDepUrls: string[]
  myIssueUrls: string[]
  githubIssueUrls: string[]
  notebookNoteId: string | null
  notebookNote?: { id: string; title: string } | null
  sessions: Session[]
}

export interface StatusUpdate {
  id: string
  content: string
  status: Status | null
  todoId: string
  createdAt: string
}

export interface Session {
  id: string
  tool: SessionTool
  command: string
  workingPath: string
  createdAt: string
}

export interface TodoContact {
  id: string
  role: string
  order: number
  todoId: string
  personId: string
  person: {
    id: string
    name: string
    email: string
  }
}

export interface AzureWorkItemLink {
  name: string
  url: string
}

export interface AzureWorkItemStatus {
  id: number
  title: string
  state: string
  type: string
  url: string
  assignedTo: string | null
  linkedPrs: AzureWorkItemLink[]
  linkedBranches: AzureWorkItemLink[]
  linkedCommits: AzureWorkItemLink[]
}

export interface GitHubPrStatus {
  state: 'open' | 'merged' | 'closed'
  merged: boolean
  title: string
  url: string
  number: number
  author: string
  draft: boolean
  reviewStatus: 'review_requested' | 'approved' | 'changes_requested' | null
  approvedCount?: number
  reviewerCount?: number
  behindBy?: number
}

export interface GitHubIssueLabel {
  name: string
  color: string
}

export interface GitHubIssueStatus {
  state: 'open' | 'closed'
  stateReason: 'completed' | 'not_planned' | null
  title: string
  url: string
  number: number
  author: string
  labels: GitHubIssueLabel[]
  assignees: string[]
}

export interface PaginatedTodosResponse {
  todos: Todo[]
  total: number
}

export interface TodoBoardResponse {
  active: Todo[]
  completed: Todo[]
  deleted: Todo[]
}

export interface SubtaskInput {
  id?: string
  title: string
  completed?: boolean
  order: number
}

export interface CreateTodoInput {
  title: string
  description?: string
  priority?: Priority
  status?: Status
  dueDate?: string | null
  labelIds?: string[]
  subtasks?: SubtaskInput[]
  myPrUrls?: string[]
  githubPrUrls?: string[]
  azureWorkItemUrl?: string | null
  azureDepUrls?: string[]
  myIssueUrls?: string[]
  githubIssueUrls?: string[]
  notebookNoteId?: string | null
}

export interface UpdateTodoInput {
  title?: string
  description?: string | null
  status?: Status
  priority?: Priority
  dueDate?: string | null
  labelIds?: string[]
  subtasks?: SubtaskInput[]
  myPrUrls?: string[]
  githubPrUrls?: string[]
  azureWorkItemUrl?: string | null
  azureDepUrls?: string[]
  myIssueUrls?: string[]
  githubIssueUrls?: string[]
  notebookNoteId?: string | null
}
