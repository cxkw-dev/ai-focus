import { z } from 'zod';
import { apiFetch, textResult, isApiError, toHtml, resolveKey, formatTodoSummary, } from '../helpers.js';
export function registerTodoTools(server) {
    server.tool('list_todos', 'List todos from AI Focus. Returns a compact summary by default; set verbose=true for full JSON with IDs and descriptions.', {
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
            .describe('Filter by status'),
        priority: z
            .enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
            .optional()
            .describe('Filter by priority'),
        archived: z
            .boolean()
            .optional()
            .describe('Include archived todos (default false)'),
        verbose: z
            .boolean()
            .optional()
            .describe('Return full JSON instead of compact summary (default false)'),
    }, async (params) => {
        const query = new URLSearchParams();
        if (params.status)
            query.set('status', params.status);
        if (params.priority)
            query.set('priority', params.priority);
        if (params.archived)
            query.set('archived', 'true');
        const qs = query.toString();
        const data = await apiFetch(`/api/todos${qs ? `?${qs}` : ''}`);
        if (isApiError(data))
            return textResult(data);
        if (params.verbose)
            return textResult(data);
        return {
            content: [
                {
                    type: 'text',
                    text: formatTodoSummary(data),
                },
            ],
        };
    });
    server.tool('get_todo', 'Get a single todo by task number (e.g. 7) or ID. Returns full details including description, subtasks, labels, and linked PRs.', {
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
    }, async (params) => {
        const data = await apiFetch(`/api/todos/${resolveKey(params)}`);
        return textResult(data);
    });
    server.tool('create_todo', `Create a new todo in AI Focus. The todo appears at the top of the list.

PATTERN — description brevity:
- The description MUST be a single sentence (~150 chars max) summarizing the task.
- For detailed context, requirements, phases, or notes: first call create_note to create a notebook note, then pass its ID as notebookNoteId.
- For timeline/deadline info, use the dueDate field — never put dates or deadlines in the description.`, {
        title: z.string().min(1).max(200).describe('Task title'),
        description: z
            .string()
            .max(10000)
            .optional()
            .describe('One-sentence summary of the task (~150 chars). Do NOT put detailed context, requirements, phases, or timelines here — use a linked notebook note for details and dueDate for deadlines.'),
        priority: z
            .enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
            .optional()
            .describe('Priority level (default MEDIUM)'),
        status: z
            .enum([
            'TODO',
            'IN_PROGRESS',
            'WAITING',
            'UNDER_REVIEW',
            'ON_HOLD',
            'BLOCKED',
            'COMPLETED',
        ])
            .optional()
            .describe('Initial status (default TODO)'),
        dueDate: z.string().optional().describe('Due date as ISO string'),
        labelIds: z
            .array(z.string())
            .optional()
            .describe('Array of label IDs to attach'),
        subtasks: z
            .array(z.string())
            .optional()
            .describe('Array of subtask titles to create'),
        myPrUrls: z
            .array(z.string())
            .optional()
            .describe("GitHub PR URLs for this task's own PRs"),
        githubPrUrls: z
            .array(z.string())
            .optional()
            .describe('Dependency GitHub PR URLs to wait on'),
        azureWorkItemUrl: z
            .string()
            .nullable()
            .optional()
            .describe('Azure DevOps work item URL'),
        azureDepUrls: z
            .array(z.string())
            .optional()
            .describe('Dependent Azure DevOps work item URLs'),
        myIssueUrls: z
            .array(z.string())
            .optional()
            .describe("GitHub Issue URLs for this task's own issues"),
        githubIssueUrls: z
            .array(z.string())
            .optional()
            .describe('Dependency GitHub Issue URLs to wait on'),
        notebookNoteId: z
            .string()
            .optional()
            .describe('Notebook note ID to link. Create a note first via create_note, then pass its ID here for detailed context.'),
    }, async (params) => {
        const { subtasks: subtaskTitles, ...rest } = params;
        const body = { ...rest };
        if (body.description)
            body.description = toHtml(body.description);
        if (subtaskTitles?.length) {
            body.subtasks = subtaskTitles.map((title, i) => ({ title, order: i }));
        }
        const data = await apiFetch('/api/todos', {
            method: 'POST',
            body: JSON.stringify(body),
        });
        return textResult(data);
    });
    server.tool('update_todo', `Update an existing todo. Supports changing any field: title, description, status, priority, labels, subtasks, PRs, etc.

IMPORTANT — Status updates and progress notes:
- Do NOT append status/progress updates to the description. Use add_status_update instead — it logs to the todo's dedicated timeline.
- The description field is for the task's static context/requirements, not a running log.

Description brevity:
- Descriptions MUST be a single sentence (~150 chars). Detailed context, requirements, or notes belong in a linked notebook note (use notebookNoteId or create one via create_note first).
- Timeline/deadline info should use the dueDate field, not the description.

Description handling:
- By default, descriptionMode is "append" which ADDS to the existing description (preserving all prior content).
- Use descriptionMode "replace" ONLY when the user explicitly asks to overwrite/replace the entire description.
- When appending, the new text is added below the existing content with a date separator.
- Use get_todo first if you need to see the current description.`, {
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
        title: z.string().min(1).max(200).optional().describe('New title'),
        description: z
            .string()
            .max(10000)
            .optional()
            .describe('One-sentence summary (behavior depends on descriptionMode). Keep brief — detailed context belongs in a linked notebook note.'),
        descriptionMode: z
            .enum(['append', 'replace'])
            .optional()
            .describe("'append' (default) adds to existing content; 'replace' overwrites entirely"),
        status: z
            .enum([
            'TODO',
            'IN_PROGRESS',
            'WAITING',
            'UNDER_REVIEW',
            'ON_HOLD',
            'BLOCKED',
            'COMPLETED',
        ])
            .optional()
            .describe('New status'),
        priority: z
            .enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
            .optional()
            .describe('New priority'),
        archived: z.boolean().optional().describe('Archive or unarchive'),
        dueDate: z
            .string()
            .nullable()
            .optional()
            .describe('New due date (ISO string) or null to clear'),
        labelIds: z.array(z.string()).optional().describe('Replace label IDs'),
        subtasks: z
            .array(z.object({
            id: z.string().optional(),
            title: z.string(),
            completed: z.boolean().optional(),
            order: z.number().int(),
        }))
            .optional()
            .describe('Replace all subtasks (declarative sync). Include id for existing subtasks, omit for new ones.'),
        myPrUrls: z
            .array(z.string())
            .optional()
            .describe("GitHub PR URLs for this task's own PRs"),
        githubPrUrls: z
            .array(z.string())
            .optional()
            .describe('Dependency GitHub PR URLs to wait on'),
        azureWorkItemUrl: z
            .string()
            .nullable()
            .optional()
            .describe('Azure DevOps work item URL (null to clear)'),
        azureDepUrls: z
            .array(z.string())
            .optional()
            .describe('Dependent Azure DevOps work item URLs'),
        myIssueUrls: z
            .array(z.string())
            .optional()
            .describe("GitHub Issue URLs for this task's own issues"),
        githubIssueUrls: z
            .array(z.string())
            .optional()
            .describe('Dependency GitHub Issue URLs to wait on'),
        notebookNoteId: z
            .string()
            .nullable()
            .optional()
            .describe('Notebook note ID to link (null to unlink)'),
    }, async ({ taskNumber, id, descriptionMode, ...updates }) => {
        const key = resolveKey({ taskNumber, id });
        if (updates.description) {
            const newHtml = toHtml(updates.description);
            if ((descriptionMode ?? 'append') === 'append') {
                const existing = (await apiFetch(`/api/todos/${key}`));
                if (existing.description) {
                    const date = new Date().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    });
                    const separator = `<p><strong>— Update ${date} —</strong></p>`;
                    updates.description = `${existing.description}${separator}${newHtml}`;
                }
                else {
                    updates.description = newHtml;
                }
            }
            else {
                updates.description = newHtml;
            }
        }
        const data = await apiFetch(`/api/todos/${key}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
        return textResult(data);
    });
    server.tool('delete_todo', 'Permanently delete a todo. This cannot be undone — use archive_todo for soft delete instead.', {
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
    }, async (params) => {
        const data = await apiFetch(`/api/todos/${resolveKey(params)}`, {
            method: 'DELETE',
        });
        return textResult(data);
    });
    server.tool('toggle_subtask', "Toggle a subtask's completed status within a todo.", {
        taskNumber: z
            .number()
            .int()
            .positive()
            .optional()
            .describe('The parent task number'),
        todoId: z
            .string()
            .optional()
            .describe('The parent todo cuid (use taskNumber instead when possible)'),
        subtaskId: z.string().describe('The subtask ID to toggle'),
        completed: z.boolean().describe('Set completed to true or false'),
    }, async ({ taskNumber, todoId, subtaskId, completed }) => {
        const key = resolveKey({ taskNumber, id: todoId });
        const data = await apiFetch(`/api/todos/${key}/subtasks/${subtaskId}`, {
            method: 'PATCH',
            body: JSON.stringify({ completed }),
        });
        return textResult(data);
    });
    server.tool('search_todos', 'Search active todos by title. Uses server-side filtering for efficiency. Returns a compact summary of matching todos.', {
        query: z
            .string()
            .min(1)
            .describe('Search text to match against todo titles (case-insensitive)'),
    }, async ({ query }) => {
        const data = await apiFetch(`/api/todos?search=${encodeURIComponent(query)}`);
        if (isApiError(data))
            return textResult(data);
        return {
            content: [
                {
                    type: 'text',
                    text: formatTodoSummary(data),
                },
            ],
        };
    });
    server.tool('archive_todo', 'Archive a todo (soft delete). The todo can be restored later with restore_todo.', {
        taskNumber: z
            .number()
            .int()
            .positive()
            .optional()
            .describe('The task number (e.g. 7)'),
        id: z.string().optional().describe('The todo cuid'),
    }, async (params) => {
        const data = await apiFetch(`/api/todos/${resolveKey(params)}`, {
            method: 'PATCH',
            body: JSON.stringify({ archived: true }),
        });
        return textResult(data);
    });
    server.tool('restore_todo', 'Restore an archived todo back to the active list.', {
        taskNumber: z
            .number()
            .int()
            .positive()
            .optional()
            .describe('The task number (e.g. 7)'),
        id: z.string().optional().describe('The todo cuid'),
    }, async (params) => {
        const data = await apiFetch(`/api/todos/${resolveKey(params)}`, {
            method: 'PATCH',
            body: JSON.stringify({ archived: false }),
        });
        return textResult(data);
    });
    server.tool('complete_todo', 'Mark a todo as completed. This also auto-archives it. Shortcut for update_todo with status=COMPLETED.', {
        taskNumber: z
            .number()
            .int()
            .positive()
            .optional()
            .describe('The task number (e.g. 7)'),
        id: z.string().optional().describe('The todo cuid'),
    }, async (params) => {
        const data = await apiFetch(`/api/todos/${resolveKey(params)}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'COMPLETED' }),
        });
        return textResult(data);
    });
    server.tool('start_todo', 'Mark a todo as in progress. Shortcut for update_todo with status=IN_PROGRESS.', {
        taskNumber: z
            .number()
            .int()
            .positive()
            .optional()
            .describe('The task number (e.g. 7)'),
        id: z.string().optional().describe('The todo cuid'),
    }, async (params) => {
        const data = await apiFetch(`/api/todos/${resolveKey(params)}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'IN_PROGRESS' }),
        });
        return textResult(data);
    });
    server.tool('reorder_todos', 'Reorder active todos by providing an array of todo IDs in the desired order. Use list_todos with verbose=true first to get the IDs.', {
        orderedIds: z
            .array(z.string().min(1))
            .min(1)
            .describe('Array of todo IDs in the desired display order'),
    }, async ({ orderedIds }) => {
        const data = await apiFetch('/api/todos/reorder', {
            method: 'POST',
            body: JSON.stringify({ orderedIds }),
        });
        return textResult(data);
    });
}
