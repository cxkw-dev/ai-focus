import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiFetch, textResult, isApiError, resolveTodoId } from '../helpers.js'

export function registerSessionTools(server: McpServer) {
  server.tool(
    'add_session',
    'Attach an AI coding session to a todo so the user can resume it later. Call this when you start working on a task.',
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
      tool: z
        .enum(['claude', 'codex'])
        .describe('Which AI tool this session is from'),
      command: z
        .string()
        .min(1)
        .describe(
          "Full resume command, e.g. 'claude --resume 019d4ebb-e7a3' or 'codex resume 019d4ebb'",
        ),
      workingPath: z
        .string()
        .min(1)
        .describe("Working directory path, e.g. '~/ai-focus'"),
    },
    async (params) => {
      const resolved = await resolveTodoId(params)
      if ('error' in resolved) return resolved.error

      const data = await apiFetch(
        `/api/todos/${resolved.resolvedId}/sessions`,
        {
          method: 'POST',
          body: JSON.stringify({
            tool: params.tool,
            command: params.command,
            workingPath: params.workingPath,
          }),
        },
      )
      if (isApiError(data)) return textResult(data)
      return textResult({ message: 'Session added to task', session: data })
    },
  )

  server.tool(
    'remove_session',
    'Remove an AI session from a todo.',
    {
      sessionId: z.string().describe('The session cuid to delete'),
    },
    async (params) => {
      const data = await apiFetch(`/api/sessions/${params.sessionId}`, {
        method: 'DELETE',
      })
      if (isApiError(data)) return textResult(data)
      return textResult({ message: 'Session removed' })
    },
  )
}
