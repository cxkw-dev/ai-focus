export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

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
  completed: boolean
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
  dueDate?: string | null
  categoryId?: string | null
}

export interface UpdateTodoInput {
  title?: string
  description?: string | null
  completed?: boolean
  priority?: Priority
  dueDate?: string | null
  categoryId?: string | null
}
