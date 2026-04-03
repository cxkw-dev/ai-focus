import { z } from 'zod';
import { apiFetch, textResult, toHtml } from '../helpers.js';
export function registerNotebookTools(server) {
    // --- Notebook Notes ---
    server.tool('list_notes', 'List notebook notes. Optionally search by title. Returns titles and IDs (use get_note for full content).', {
        search: z.string().optional().describe('Search notes by title'),
    }, async (params) => {
        const qs = params.search
            ? `?search=${encodeURIComponent(params.search)}`
            : '';
        const data = await apiFetch(`/api/notebook${qs}`);
        return textResult(data);
    });
    server.tool('get_note', 'Get a single notebook note by ID with full content.', {
        id: z.string().describe('The note ID'),
    }, async ({ id }) => {
        const data = await apiFetch(`/api/notebook/${id}`);
        return textResult(data);
    });
    server.tool('create_note', 'Create a new notebook note. Content supports markdown (converted to HTML for the rich text editor). TIP: Use this to store detailed context for a todo — create the note first, then pass its ID as notebookNoteId when calling create_todo or update_todo.', {
        title: z.string().max(200).optional().describe('Note title'),
        content: z
            .string()
            .max(100000)
            .optional()
            .describe('Note content (supports markdown)'),
    }, async (params) => {
        const body = { ...params };
        if (body.content)
            body.content = toHtml(body.content);
        const data = await apiFetch('/api/notebook', {
            method: 'POST',
            body: JSON.stringify(body),
        });
        return textResult(data);
    });
    server.tool('update_note', "Update a notebook note's title, content, or pinned status.", {
        id: z.string().describe('The note ID'),
        title: z.string().max(200).optional().describe('New title'),
        content: z
            .string()
            .max(100000)
            .optional()
            .describe('New content (supports markdown)'),
        pinned: z.boolean().optional().describe('Pin or unpin the note'),
    }, async ({ id, ...updates }) => {
        if (updates.content)
            updates.content = toHtml(updates.content);
        const data = await apiFetch(`/api/notebook/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
        return textResult(data);
    });
    server.tool('delete_note', 'Delete a notebook note permanently.', {
        id: z.string().describe('The note ID to delete'),
    }, async ({ id }) => {
        const data = await apiFetch(`/api/notebook/${id}`, { method: 'DELETE' });
        return textResult(data);
    });
    // --- Scratch Pad ---
    server.tool('get_scratchpad', 'Get the scratch pad content. A single persistent note for quick thoughts, visible on the todos page.', {}, async () => {
        const data = await apiFetch('/api/note');
        return textResult(data);
    });
    server.tool('update_scratchpad', 'Update the scratch pad content. Content supports markdown.', {
        content: z
            .string()
            .max(20000)
            .describe('New scratch pad content (supports markdown)'),
    }, async (params) => {
        const body = { content: toHtml(params.content) };
        const data = await apiFetch('/api/note', {
            method: 'PUT',
            body: JSON.stringify(body),
        });
        return textResult(data);
    });
}
