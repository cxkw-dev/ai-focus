export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type Status = 'TODO' | 'IN_PROGRESS' | 'WAITING' | 'UNDER_REVIEW' | 'ON_HOLD' | 'COMPLETED'

export interface Label {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
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
