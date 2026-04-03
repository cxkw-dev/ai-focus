import { z } from 'zod';
import { apiFetch, textResult } from '../helpers.js';
export function registerLabelTools(server) {
    server.tool('list_labels', 'List all labels. Labels can be attached to todos for categorization and filtering.', {}, async () => {
        const data = await apiFetch('/api/labels');
        return textResult(data);
    });
    server.tool('create_label', 'Create a new label for tagging todos.', {
        name: z.string().min(1).max(40).describe('Label name'),
        color: z.string().optional().describe('Hex color like #FF5733'),
    }, async (params) => {
        const data = await apiFetch('/api/labels', {
            method: 'POST',
            body: JSON.stringify(params),
        });
        return textResult(data);
    });
    server.tool('update_label', "Update a label's name or color.", {
        id: z.string().describe('The label ID to update'),
        name: z.string().min(1).max(40).optional().describe('New label name'),
        color: z.string().optional().describe('New hex color like #FF5733'),
    }, async ({ id, ...updates }) => {
        const data = await apiFetch(`/api/labels/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
        return textResult(data);
    });
    server.tool('delete_label', 'Delete a label. Removes it from all todos that use it.', {
        id: z.string().describe('The label ID to delete'),
    }, async ({ id }) => {
        const data = await apiFetch(`/api/labels/${id}`, { method: 'DELETE' });
        return textResult(data);
    });
}
