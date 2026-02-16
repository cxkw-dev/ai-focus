export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type Status = 'TODO' | 'IN_PROGRESS' | 'WAITING' | 'ON_HOLD' | 'COMPLETED'

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
  labels: Label[]
  subtasks: Subtask[]
  myPrUrl: string | null
  githubPrUrls: string[]
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
  myPrUrl?: string | null
  githubPrUrls?: string[]
}

export interface UpdateTodoInput {
  title?: string
  description?: string | null
  status?: Status
  priority?: Priority
  dueDate?: string | null
  labelIds?: string[]
  subtasks?: SubtaskInput[]
  myPrUrl?: string | null
  githubPrUrls?: string[]
}
