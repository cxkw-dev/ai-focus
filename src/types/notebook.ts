export interface NotebookNoteTodo {
  id: string
  taskNumber: number
  title: string
  status: import('@/types/todo').Status
  priority: import('@/types/todo').Priority
  dueDate: string | null
  labels: { id: string; name: string; color: string }[]
}

export interface NotebookNote {
  id: string
  title: string
  content: string
  pinned: boolean
  archived: boolean
  createdAt: string
  updatedAt: string
  todo?: NotebookNoteTodo | null
}

export interface CreateNotebookNoteInput {
  title?: string
  content?: string
}

export interface UpdateNotebookNoteInput {
  title?: string
  content?: string
  pinned?: boolean
}
