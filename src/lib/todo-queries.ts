import { Prisma } from '@prisma/client'

export const todoInclude = Prisma.validator<Prisma.TodoInclude>()({
  labels: { orderBy: { name: 'asc' } },
  subtasks: { orderBy: { order: 'asc' } },
  notebookNote: { select: { id: true, title: true } },
  sessions: { orderBy: { createdAt: 'desc' } },
})

export const activeTodoOrderBy = Prisma.validator<Prisma.TodoOrderByWithRelationInput[]>()([
  { order: 'asc' },
  { createdAt: 'desc' },
])

export function todoWhere(id: string): Prisma.TodoWhereUniqueInput {
  const taskNumber = Number(id)
  if (Number.isInteger(taskNumber) && taskNumber > 0) {
    return { taskNumber }
  }

  return { id }
}
