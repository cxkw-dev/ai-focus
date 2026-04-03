import { db } from '@/lib/db'
import { todoWhere } from '@/lib/todo-queries'

export async function findResolvedTodo(id: string) {
  return db.todo.findUnique({
    where: todoWhere(id),
    select: { id: true },
  })
}
