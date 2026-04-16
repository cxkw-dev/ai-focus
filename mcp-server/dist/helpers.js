import { marked } from 'marked';
const API_BASE = process.env.AI_FOCUS_API_URL || 'http://localhost:4444';
const DEFAULT_TIMEOUT_MS = Number.parseInt(process.env.AI_FOCUS_API_TIMEOUT_MS ?? '15000', 10);
// --- API helpers ---
export async function apiFetch(path, init) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    let res;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            ...init,
            signal: init?.signal ?? controller.signal,
            headers: { 'Content-Type': 'application/json', ...init?.headers },
        });
    }
    catch (err) {
        const aborted = err instanceof Error &&
            (err.name === 'AbortError' || err.name === 'TimeoutError');
        return {
            _error: true,
            message: aborted
                ? `Request to AI Focus at ${API_BASE} timed out after ${DEFAULT_TIMEOUT_MS}ms.`
                : `Cannot reach AI Focus at ${API_BASE}. Is the Docker container running?`,
            details: String(err),
        };
    }
    finally {
        clearTimeout(timeout);
    }
    if (!res.ok) {
        const body = await res.text();
        return { _error: true, status: res.status, message: body };
    }
    return res.json();
}
export function textResult(data) {
    return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
}
export function isApiError(data) {
    return Boolean(data && typeof data === 'object' && '_error' in data);
}
// --- Markdown ---
marked.setOptions({ breaks: true, gfm: true });
export function toHtml(text) {
    if (text.trimStart().startsWith('<'))
        return text;
    return marked.parse(text, { async: false });
}
// --- Todo key resolution ---
/**
 * Resolve a taskNumber or id to the API path key.
 * Throws if neither is provided.
 */
export function resolveKey(params) {
    const key = params.taskNumber?.toString() ?? params.id;
    if (!key)
        throw new Error('Provide either taskNumber or id');
    return key;
}
/**
 * Resolve a taskNumber to the actual todo UUID by fetching the todo.
 * Falls back to params.id if no taskNumber.
 * Returns the resolved UUID or an error result.
 */
export async function resolveTodoId(params) {
    if (params.id && !params.taskNumber) {
        return { resolvedId: params.id };
    }
    if (!params.taskNumber && !params.id) {
        return {
            error: textResult({ _error: true, message: 'Provide taskNumber or id' }),
        };
    }
    const todo = await apiFetch(`/api/todos/${params.taskNumber}`);
    if (isApiError(todo)) {
        return { error: textResult(todo) };
    }
    return { resolvedId: todo.id };
}
// --- Formatting ---
export function formatTodoSummary(todos) {
    if (todos.length === 0)
        return 'No todos found.';
    return todos
        .map((t) => {
        const parts = [`#${t.taskNumber} | ${t.title}`];
        parts.push(`   status: ${t.status} | priority: ${t.priority}`);
        if (t.labels?.length)
            parts.push(`   labels: ${t.labels.map((l) => l.name).join(', ')}`);
        if (t.dueDate)
            parts.push(`   due: ${t.dueDate.split('T')[0]}`);
        if (t.subtasks?.length) {
            const done = t.subtasks.filter((s) => s.completed).length;
            parts.push(`   subtasks: ${done}/${t.subtasks.length} done`);
        }
        if (t.myPrUrls?.length)
            parts.push(`   my prs: ${t.myPrUrls.join(', ')}`);
        if (t.githubPrUrls?.length)
            parts.push(`   waiting on: ${t.githubPrUrls.join(', ')}`);
        if (t.azureWorkItemUrl)
            parts.push(`   azure: ${t.azureWorkItemUrl}`);
        if (t.azureDepUrls?.length)
            parts.push(`   azure deps: ${t.azureDepUrls.join(', ')}`);
        if (t.myIssueUrls?.length)
            parts.push(`   my issues: ${t.myIssueUrls.join(', ')}`);
        if (t.githubIssueUrls?.length)
            parts.push(`   waiting on issues: ${t.githubIssueUrls.join(', ')}`);
        if (t.notebookNoteId)
            parts.push(`   note: ${t.notebookNoteId}`);
        if (t.sessions?.length) {
            const sessionLines = t.sessions.map((s) => `     ${s.tool}: ${s.command} (${s.workingPath})`);
            parts.push(`   sessions:\n${sessionLines.join('\n')}`);
        }
        return parts.join('\n');
    })
        .join('\n\n');
}
// --- Azure helpers ---
export const AZURE_WORK_ITEM_URL_REGEX = /^https?:\/\/dev\.azure\.com\/[^/]+\/[^/]+\/_workitems\/edit\/(\d+)(?:[/?#]|$)/i;
export function parseAzureWorkItemId(url) {
    if (!url)
        return null;
    const match = url.trim().match(AZURE_WORK_ITEM_URL_REGEX);
    if (!match)
        return null;
    const parsed = Number.parseInt(match[1], 10);
    if (!Number.isInteger(parsed) || parsed <= 0)
        return null;
    return parsed;
}
export function buildAzureContextQuery(params) {
    const query = new URLSearchParams();
    query.set('includeComments', String(params.includeComments));
    query.set('includeUpdates', String(params.includeUpdates));
    query.set('maxComments', String(params.maxComments));
    query.set('maxUpdates', String(params.maxUpdates));
    return query.toString();
}
