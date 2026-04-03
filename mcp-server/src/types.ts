export interface SubtaskResponse {
  id: string
  title: string
  completed: boolean
  order: number
}

export interface StatusUpdateResponse {
  id: string
  content: string
  status: string | null
  todoId: string
  createdAt: string
}

export interface TodoResponse {
  id?: string
  taskNumber: number
  title: string
  status: string
  priority: string
  description?: string | null
  dueDate?: string | null
  archived?: boolean
  labels?: { name: string }[]
  subtasks?: SubtaskResponse[]
  myPrUrls?: string[]
  githubPrUrls?: string[]
  azureWorkItemUrl?: string | null
  azureDepUrls?: string[]
  myIssueUrls?: string[]
  githubIssueUrls?: string[]
  notebookNoteId?: string | null
  sessions?: {
    id: string
    tool: string
    command: string
    workingPath: string
    createdAt: string
  }[]
}
