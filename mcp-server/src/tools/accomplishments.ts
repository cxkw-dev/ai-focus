import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiFetch, textResult, isApiError, toHtml } from '../helpers.js'

export function registerAccomplishmentTools(server: McpServer) {
  server.tool(
    'list_accomplishments',
    'List accomplishments for a given year. Used for performance review tracking. Shows date, category, title, and description.',
    {
      year: z
        .number()
        .min(2000)
        .max(2100)
        .optional()
        .describe('Year (defaults to current year)'),
    },
    async (params) => {
      const qs = params.year ? `?year=${params.year}` : ''
      const data = await apiFetch(`/api/accomplishments${qs}`)
      if (isApiError(data)) return textResult(data)
      const items = data as {
        id: string
        title: string
        category: string
        date: string
        description?: string | null
      }[]
      if (items.length === 0) {
        return {
          content: [
            { type: 'text' as const, text: 'No accomplishments found.' },
          ],
        }
      }
      const text = items
        .map((a) => {
          const parts = [`${a.date.split('T')[0]} | [${a.category}] ${a.title}`]
          if (a.description) parts.push(`   ${a.description}`)
          parts.push(`   id: ${a.id}`)
          return parts.join('\n')
        })
        .join('\n\n')
      return { content: [{ type: 'text' as const, text }] }
    },
  )

  server.tool(
    'create_accomplishment',
    'Create a new accomplishment for performance review tracking.',
    {
      title: z.string().min(1).max(200).describe('Accomplishment title'),
      description: z
        .string()
        .max(1000)
        .optional()
        .describe('Details (supports markdown)'),
      category: z
        .enum([
          'DELIVERY',
          'HIRING',
          'MENTORING',
          'COLLABORATION',
          'GROWTH',
          'OTHER',
        ])
        .describe(
          'Category: DELIVERY (features/PRs), HIRING (interviews), MENTORING (coaching), COLLABORATION (cross-team), GROWTH (learning), OTHER',
        ),
      date: z
        .string()
        .describe('Date of accomplishment (ISO string, e.g. 2026-01-15)'),
    },
    async (params) => {
      const body: Record<string, unknown> = { ...params }
      if (body.description)
        body.description = toHtml(body.description as string)
      const data = await apiFetch('/api/accomplishments', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      return textResult(data)
    },
  )

  server.tool(
    'update_accomplishment',
    "Update an existing accomplishment's title, description, category, or date.",
    {
      id: z.string().describe('The accomplishment ID'),
      title: z.string().min(1).max(200).optional().describe('New title'),
      description: z
        .string()
        .max(1000)
        .nullable()
        .optional()
        .describe('New description (supports markdown)'),
      category: z
        .enum([
          'DELIVERY',
          'HIRING',
          'MENTORING',
          'COLLABORATION',
          'GROWTH',
          'OTHER',
        ])
        .optional()
        .describe('New category'),
      date: z.string().optional().describe('New date (ISO string)'),
    },
    async ({ id, ...updates }) => {
      if (updates.description) updates.description = toHtml(updates.description)
      const data = await apiFetch(`/api/accomplishments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      return textResult(data)
    },
  )

  server.tool(
    'delete_accomplishment',
    'Delete an accomplishment permanently.',
    {
      id: z.string().describe('The accomplishment ID to delete'),
    },
    async ({ id }) => {
      const data = await apiFetch(`/api/accomplishments/${id}`, {
        method: 'DELETE',
      })
      return textResult(data)
    },
  )
}
