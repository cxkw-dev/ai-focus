import { Prisma } from '@prisma/client'
import { labelInclude } from '@/lib/label-queries'

export const todoBaseInclude = Prisma.validator<Prisma.TodoInclude>()({
  labels: { orderBy: { name: 'asc' }, include: labelInclude },
  subtasks: { orderBy: { order: 'asc' } },
  notebookNote: { select: { id: true, title: true } },
})

export const todoInclude = Prisma.validator<Prisma.TodoInclude>()({
  ...todoBaseInclude,
  sessions: { orderBy: { createdAt: 'desc' } },
})

export const todoBoardInclude = Prisma.validator<Prisma.TodoInclude>()({
  ...todoBaseInclude,
  sessions: { orderBy: { createdAt: 'desc' }, take: 3 },
})

export const activeTodoOrderBy = Prisma.validator<
  Prisma.TodoOrderByWithRelationInput[]
>()([{ order: 'asc' }, { createdAt: 'desc' }])

export function todoWhere(id: string): Prisma.TodoWhereUniqueInput {
  const taskNumber = Number(id)
  if (Number.isInteger(taskNumber) && taskNumber > 0) {
    return { taskNumber }
  }

  return { id }
}
