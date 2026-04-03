import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  apiFetch,
  textResult,
  isApiError,
  resolveKey,
  parseAzureWorkItemId,
  buildAzureContextQuery,
} from '../helpers.js'
import type { TodoResponse } from '../types.js'

export function registerAzureTools(server: McpServer) {
  server.tool(
    'get_azure_work_item_context',
    'Get Azure DevOps planning context in one call: work item details, relations, PR links, and optionally comments/updates. The primary tool for understanding Azure work items.',
    {
      workItemId: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('Azure DevOps work item ID'),
      workItemUrl: z
        .string()
        .optional()
        .describe('Azure DevOps work item URL (alternative to workItemId)'),
      includeComments: z
        .boolean()
        .optional()
        .describe('Include comments (default true)'),
      includeUpdates: z
        .boolean()
        .optional()
        .describe('Include change history (default false)'),
      maxComments: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe('Max comments to return (default 20)'),
      maxUpdates: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe('Max updates to return (default 20)'),
    },
    async ({
      workItemId,
      workItemUrl,
      includeComments = true,
      includeUpdates = false,
      maxComments = 20,
      maxUpdates = 20,
    }) => {
      const parsedFromUrl = parseAzureWorkItemId(workItemUrl ?? null)
      const resolvedWorkItemId = workItemId ?? parsedFromUrl
      if (!resolvedWorkItemId) {
        throw new Error('Provide either workItemId or a valid workItemUrl')
      }

      const qs = buildAzureContextQuery({
        includeComments,
        includeUpdates,
        maxComments,
        maxUpdates,
      })
      const data = await apiFetch(
        `/api/azure/workitems/${resolvedWorkItemId}/context?${qs}`,
      )
      return textResult(data)
    },
  )

  server.tool(
    'get_todo_execution_context',
    'Get a todo and its linked Azure DevOps context in one call. Optimized for kickstarting implementation — fetches the todo, then automatically hydrates Azure planning context if an Azure work item is linked.',
    {
      taskNumber: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('The task number (e.g. 7)'),
      id: z
        .string()
        .optional()
        .describe('The todo cuid (use taskNumber instead when possible)'),
      includeComments: z
        .boolean()
        .optional()
        .describe('Include Azure comments (default true)'),
      includeUpdates: z
        .boolean()
        .optional()
        .describe('Include Azure change history (default false)'),
      maxComments: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe('Max Azure comments (default 20)'),
      maxUpdates: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe('Max Azure updates (default 20)'),
    },
    async ({
      taskNumber,
      id,
      includeComments = true,
      includeUpdates = false,
      maxComments = 20,
      maxUpdates = 20,
    }) => {
      const key = resolveKey({ taskNumber, id })
      const todoData = await apiFetch(`/api/todos/${key}`)
      if (isApiError(todoData)) return textResult(todoData)

      const todo = todoData as TodoResponse
      const azureWorkItemId = parseAzureWorkItemId(todo.azureWorkItemUrl)

      if (!azureWorkItemId) {
        return textResult({
          todo,
          azure: {
            linked: false,
            reason: 'No valid azureWorkItemUrl found on this todo',
          },
        })
      }

      const qs = buildAzureContextQuery({
        includeComments,
        includeUpdates,
        maxComments,
        maxUpdates,
      })
      const context = await apiFetch(
        `/api/azure/workitems/${azureWorkItemId}/context?${qs}`,
      )

      return textResult({
        todo,
        azure: { linked: true, workItemId: azureWorkItemId, context },
      })
    },
  )
}
