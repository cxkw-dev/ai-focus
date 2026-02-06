export interface NotebookNote {
  id: string
  title: string
  content: string
  pinned: boolean
  createdAt: string
  updatedAt: string
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
