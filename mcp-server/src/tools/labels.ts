import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiFetch, textResult } from '../helpers.js'

export function registerLabelTools(server: McpServer) {
  server.tool(
    'list_labels',
    'List labels. Labels can be attached to todos for categorization and filtering. By default only active labels are returned; pass status to include archived ones.',
    {
      status: z
        .enum(['active', 'archived', 'all'])
        .optional()
        .describe('Which labels to list (default: active)'),
    },
    async ({ status }) => {
      const query = status ? `?status=${status}` : ''
      const data = await apiFetch(`/api/labels${query}`)
      return textResult(data)
    },
  )

  server.tool(
    'create_label',
    'Create a new label for tagging todos.',
    {
      name: z.string().min(1).max(40).describe('Label name'),
      color: z.string().optional().describe('Hex color like #FF5733'),
    },
    async (params) => {
      const data = await apiFetch('/api/labels', {
        method: 'POST',
        body: JSON.stringify(params),
      })
      return textResult(data)
    },
  )

  server.tool(
    'update_label',
    "Update a label's name or color.",
    {
      id: z.string().describe('The label ID to update'),
      name: z.string().min(1).max(40).optional().describe('New label name'),
      color: z.string().optional().describe('New hex color like #FF5733'),
    },
    async ({ id, ...updates }) => {
      const data = await apiFetch(`/api/labels/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      return textResult(data)
    },
  )

  server.tool(
    'delete_label',
    'Archive a label (e.g. when a project is done). It keeps every historical todo association intact and is hidden from active lists. Use restore_label to bring it back, or set purge to remove it permanently.',
    {
      id: z.string().describe('The label ID to archive'),
      purge: z
        .boolean()
        .optional()
        .describe(
          'Permanently delete instead of archiving (removes it from all todos). Default: false',
        ),
    },
    async ({ id, purge }) => {
      const query = purge ? '?purge=true' : ''
      const data = await apiFetch(`/api/labels/${id}${query}`, {
        method: 'DELETE',
      })
      return textResult(data)
    },
  )

  server.tool(
    'restore_label',
    'Restore an archived label back to the active list.',
    {
      id: z.string().describe('The label ID to restore'),
    },
    async ({ id }) => {
      const data = await apiFetch(`/api/labels/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ archived: false }),
      })
      return textResult(data)
    },
  )
}
