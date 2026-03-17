import type { TodoResponse } from "./types.js";
export declare function apiFetch(path: string, init?: RequestInit): Promise<any>;
export declare function textResult(data: unknown): {
    content: {
        type: "text";
        text: string;
    }[];
};
export declare function isApiError(data: unknown): data is {
    _error: true;
    message: string;
    status?: number;
    details?: string;
};
export declare function toHtml(text: string): string;
/**
 * Resolve a taskNumber or id to the API path key.
 * Throws if neither is provided.
 */
export declare function resolveKey(params: {
    taskNumber?: number;
    id?: string;
}): string;
/**
 * Resolve a taskNumber to the actual todo UUID by fetching the todo.
 * Falls back to params.id if no taskNumber.
 * Returns the resolved UUID or an error result.
 */
export declare function resolveTodoId(params: {
    taskNumber?: number;
    id?: string;
}): Promise<{
    resolvedId: string;
} | {
    error: ReturnType<typeof textResult>;
}>;
export declare function formatTodoSummary(todos: TodoResponse[]): string;
export declare const AZURE_WORK_ITEM_URL_REGEX: RegExp;
export declare function parseAzureWorkItemId(url?: string | null): number | null;
export declare function buildAzureContextQuery(params: {
    includeComments: boolean;
    includeUpdates: boolean;
    maxComments: number;
    maxUpdates: number;
}): string;
