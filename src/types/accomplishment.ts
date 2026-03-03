export type AccomplishmentCategory =
  | 'DELIVERY'
  | 'HIRING'
  | 'MENTORING'
  | 'COLLABORATION'
  | 'GROWTH'
  | 'OTHER'

export interface Accomplishment {
  id: string
  title: string
  description: string | null
  category: AccomplishmentCategory
  date: string
  year: number
  todoId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateAccomplishmentInput {
  title: string
  description?: string
  category: AccomplishmentCategory
  date: string
}

export interface UpdateAccomplishmentInput {
  title?: string
  description?: string | null
  category?: AccomplishmentCategory
  date?: string
}
