import { z } from 'zod'
import {
  SESSION_TOOL_VALUES,
  TODO_PRIORITY_VALUES,
  TODO_SORT_VALUES,
  TODO_STATUS_VALUES,
} from '@/types/todo'

const optionalSearchParam = (value: string | null) => {
  const trimmedValue = value?.trim()
  return trimmedValue ? trimmedValue : undefined
}

export const todoStatusSchema = z.enum(TODO_STATUS_VALUES)
export const todoPrioritySchema = z.enum(TODO_PRIORITY_VALUES)
export const sessionToolSchema = z.enum(SESSION_TOOL_VALUES)

export const subtaskInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1).max(1000),
  completed: z.boolean().optional(),
  order: z.number().int(),
})

export const createTodoSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().max(10000).optional(),
  priority: todoPrioritySchema.optional(),
  status: todoStatusSchema.optional(),
  dueDate: z.string().datetime().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
  subtasks: z.array(subtaskInputSchema).optional(),
  myPrUrls: z.array(z.string().url()).optional(),
  githubPrUrls: z.array(z.string().url()).optional(),
  azureWorkItemUrl: z.string().url().optional().nullable(),
  azureDepUrls: z.array(z.string().url()).optional(),
  myIssueUrls: z.array(z.string().url()).optional(),
  githubIssueUrls: z.array(z.string().url()).optional(),
  notebookNoteId: z.string().optional().nullable(),
})

export const updateTodoSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(10000).optional().nullable(),
  status: todoStatusSchema.optional(),
  archived: z.boolean().optional(),
  priority: todoPrioritySchema.optional(),
  dueDate: z.string().datetime().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
  subtasks: z.array(subtaskInputSchema).optional(),
  myPrUrls: z.array(z.string().url()).optional(),
  githubPrUrls: z.array(z.string().url()).optional(),
  azureWorkItemUrl: z.string().url().optional().nullable(),
  azureDepUrls: z.array(z.string().url()).optional(),
  myIssueUrls: z.array(z.string().url()).optional(),
  githubIssueUrls: z.array(z.string().url()).optional(),
  notebookNoteId: z.string().optional().nullable(),
})

export const listTodosQuerySchema = z.object({
  completed: z.enum(['true', 'false']).optional(),
  status: todoStatusSchema.optional(),
  priority: todoPrioritySchema.optional(),
  archived: z.enum(['true', 'false']).optional(),
  excludeStatus: todoStatusSchema.optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  sortBy: z.enum(TODO_SORT_VALUES).optional(),
})

export const reorderTodosSchema = z.object({
  orderedIds: z
    .array(z.string().min(1))
    .min(1)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      'orderedIds must be unique',
    ),
})

export const toggleSubtaskSchema = z.object({
  completed: z.boolean(),
})

export const addTodoContactSchema = z.object({
  personId: z.string(),
  role: z.string().trim().min(1).max(100),
})

export const createStatusUpdateSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  status: todoStatusSchema.optional(),
})

export const createSessionSchema = z.object({
  tool: sessionToolSchema,
  command: z.string().trim().min(1),
  workingPath: z.string().trim().min(1),
})

export function parseListTodosQuery(searchParams: URLSearchParams) {
  return listTodosQuerySchema.parse({
    completed: searchParams.get('completed') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    priority: searchParams.get('priority') ?? undefined,
    archived: searchParams.get('archived') ?? undefined,
    excludeStatus: searchParams.get('excludeStatus') ?? undefined,
    search: optionalSearchParam(searchParams.get('search')),
    limit: searchParams.get('limit') ?? undefined,
    offset: searchParams.get('offset') ?? undefined,
    sortBy: searchParams.get('sortBy') ?? undefined,
  })
}
