export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type Status = 'TODO' | 'IN_PROGRESS' | 'WAITING' | 'ON_HOLD' | 'COMPLETED'

export interface Category {
  id: string
  name: string
  color: string
  icon: string | null
  createdAt: string
  updatedAt: string
}

export interface Todo {
  id: string
  title: string
  description: string | null
  status: Status
  archived: boolean
  priority: Priority
  dueDate: string | null
  order: number
  createdAt: string
  updatedAt: string
  categoryId: string | null
  category: Category | null
}

export interface CreateTodoInput {
  title: string
  description?: string
  priority?: Priority
  status?: Status
  dueDate?: string | null
  categoryId?: string | null
}

export interface UpdateTodoInput {
  title?: string
  description?: string | null
  status?: Status
  priority?: Priority
  dueDate?: string | null
  categoryId?: string | null
}
