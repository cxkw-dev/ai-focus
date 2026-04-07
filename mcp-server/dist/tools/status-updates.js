import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { apiFetch, textResult, isApiError, resolveTodoId } from '../helpers.js';
function formatUpdates(updates) {
    return updates
        .map((u) => {
        const date = new Date(u.createdAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
        const statusTag = u.status ? ` [${u.status}]` : '';
        return `${date}${statusTag}: ${u.content}`;
    })
        .join('\n');
}
export function registerStatusUpdateTools(server) {
    server.tool('add_status_update', `Add a status update to a todo's timeline. Use this to log progress, blockers, decisions, or any notable event for a task.

This is the PREFERRED way to record progress on a task — do NOT append status updates to the todo description. The timeline is purpose-built for chronological updates.

Examples:
- "Started investigating the auth bug, found the issue in token validation"
- "Blocked on PR review from platform team"
- "Deployed to staging, running smoke tests"`, {
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
        content: z
            .string()
            .min(1)
            .max(5000)
            .describe("The update text — what happened, what's the current state, any blockers"),
        status: z
            .enum([
            'TODO',
            'IN_PROGRESS',
            'WAITING',
            'UNDER_REVIEW',
            'ON_HOLD',
            'BLOCKED',
            'COMPLETED',
            'CANCELLED',
        ])
            .optional()
            .describe("Optionally set the todo's status at the same time as adding this update"),
    }, async ({ taskNumber, id, content, status }) => {
        const resolved = await resolveTodoId({ taskNumber, id });
        if ('error' in resolved)
            return resolved.error;
        // If status change requested, update the todo first
        if (status) {
            const key = taskNumber?.toString() ?? resolved.resolvedId;
            const todoUpdate = await apiFetch(`/api/todos/${key}`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            if (isApiError(todoUpdate))
                return textResult(todoUpdate);
        }
        const data = await apiFetch(`/api/todos/${resolved.resolvedId}/updates`, {
            method: 'POST',
            body: JSON.stringify({ content, status: status ?? undefined }),
        });
        return textResult(data);
    });
    server.tool('list_status_updates', 'List all status updates for a todo, newest first. Use this to review the history/timeline of a task.', {
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
    }, async ({ taskNumber, id }) => {
        const resolved = await resolveTodoId({ taskNumber, id });
        if ('error' in resolved)
            return resolved.error;
        const data = await apiFetch(`/api/todos/${resolved.resolvedId}/updates`);
        if (isApiError(data))
            return textResult(data);
        const updates = data;
        if (updates.length === 0)
            return textResult('No status updates yet.');
        return {
            content: [{ type: 'text', text: formatUpdates(updates) }],
        };
    });
    // Resource: todo timeline (so LLMs can read timeline data via resource URI)
    server.resource('todo-updates', new ResourceTemplate('todo-updates://{todoId}', { list: undefined }), {
        description: 'Timeline of status updates for a todo. Provides chronological progress history.',
        mimeType: 'text/plain',
    }, async (uri, variables) => {
        const todoId = variables.todoId;
        const data = await apiFetch(`/api/todos/${todoId}/updates`);
        if (isApiError(data)) {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: 'text/plain',
                        text: `Error: ${data.message}`,
                    },
                ],
            };
        }
        const updates = data;
        if (updates.length === 0) {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: 'text/plain',
                        text: 'No status updates yet.',
                    },
                ],
            };
        }
        return {
            contents: [
                {
                    uri: uri.href,
                    mimeType: 'text/plain',
                    text: formatUpdates(updates),
                },
            ],
        };
    });
}
