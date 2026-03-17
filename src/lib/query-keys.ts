export const queryKeys = {
  todoBoard: ['todo-board'] as const,
  todoContacts: (todoId: string) => ['todo-contacts', todoId] as const,
  labels: ['labels'] as const,
  people: ['people'] as const,
  notebook: ['notebook'] as const,
  accomplishments: (year: number) => ['accomplishments', year] as const,
  yearStats: (year: number) => ['stats', 'year', year] as const,
}
