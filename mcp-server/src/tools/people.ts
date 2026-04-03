import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiFetch, textResult } from '../helpers.js'

export function registerPeopleTools(server: McpServer) {
  server.tool(
    'list_people',
    'List all people in the directory (name + email). People are used for @mentions in task descriptions and as todo contacts.',
    {},
    async () => {
      const data = await apiFetch('/api/people')
      return textResult(data)
    },
  )

  server.tool(
    'create_person',
    'Add a person to the directory. Their email must be unique.',
    {
      name: z.string().min(1).max(100).describe("Person's name"),
      email: z.string().email().max(200).describe("Person's email address"),
    },
    async (params) => {
      const data = await apiFetch('/api/people', {
        method: 'POST',
        body: JSON.stringify(params),
      })
      return textResult(data)
    },
  )

  server.tool(
    'update_person',
    "Update a person's name or email.",
    {
      id: z.string().describe("The person's ID"),
      name: z.string().min(1).max(100).optional().describe('New name'),
      email: z
        .string()
        .email()
        .max(200)
        .optional()
        .describe('New email address'),
    },
    async ({ id, ...updates }) => {
      const data = await apiFetch(`/api/people/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      return textResult(data)
    },
  )

  server.tool(
    'delete_person',
    'Remove a person from the directory.',
    {
      id: z.string().describe("The person's ID"),
    },
    async ({ id }) => {
      const data = await apiFetch(`/api/people/${id}`, { method: 'DELETE' })
      return textResult(data)
    },
  )
}
