#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { marked } from "marked";
import { z } from "zod";

const API_BASE = process.env.AI_FOCUS_API_URL || "http://localhost:4444";
const EXPOSE_AZURE_LOW_LEVEL = ["1", "true", "yes", "on"].includes(
  (process.env.MCP_EXPOSE_AZURE_LOW_LEVEL ?? "").toLowerCase()
);

// --- helpers ---

async function apiFetch(path: string, init?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch (err) {
    return { _error: true, message: `Cannot reach AI Focus at ${API_BASE}. Is the Docker container running?`, details: String(err) };
  }
  if (!res.ok) {
    const body = await res.text();
    return { _error: true, status: res.status, message: body };
  }
  return res.json();
}

function textResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function isApiError(data: unknown): data is { _error: true; message: string; status?: number; details?: string } {
  return Boolean(data && typeof data === "object" && "_error" in data);
}

// Configure marked for TipTap-compatible HTML output.
marked.setOptions({ breaks: true, gfm: true });

// Convert markdown text to HTML for the rich text editor.
function toHtml(text: string): string {
  // If already HTML, return as-is
  if (text.trimStart().startsWith("<")) return text;
  return marked.parse(text, { async: false }) as string;
}

interface SubtaskResponse {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

interface TodoResponse {
  id?: string;
  taskNumber: number;
  title: string;
  status: string;
  priority: string;
  description?: string | null;
  dueDate?: string | null;
  archived?: boolean;
  labels?: { name: string }[];
  subtasks?: SubtaskResponse[];
  myPrUrls?: string[];
  githubPrUrls?: string[];
  azureWorkItemUrl?: string | null;
  azureDepUrls?: string[];
  myIssueUrls?: string[];
  githubIssueUrls?: string[];
  notebookNoteId?: string | null;
}

function formatTodoSummary(todos: TodoResponse[]) {
  if (todos.length === 0) return "No todos found.";
  return todos.map((t) => {
    const parts = [`#${t.taskNumber} | ${t.title}`];
    parts.push(`   status: ${t.status} | priority: ${t.priority}`);
    if (t.labels?.length) parts.push(`   labels: ${t.labels.map((l) => l.name).join(", ")}`);
    if (t.dueDate) parts.push(`   due: ${t.dueDate.split("T")[0]}`);
    if (t.subtasks?.length) {
      const done = t.subtasks.filter((s) => s.completed).length;
      parts.push(`   subtasks: ${done}/${t.subtasks.length} done`);
    }
    if (t.myPrUrls?.length) {
      parts.push(`   my prs: ${t.myPrUrls.join(", ")}`);
    }
    if (t.githubPrUrls?.length) {
      parts.push(`   waiting on: ${t.githubPrUrls.join(", ")}`);
    }
    if (t.azureWorkItemUrl) {
      parts.push(`   azure: ${t.azureWorkItemUrl}`);
    }
    if (t.azureDepUrls?.length) {
      parts.push(`   azure deps: ${t.azureDepUrls.join(", ")}`);
    }
    if (t.myIssueUrls?.length) {
      parts.push(`   my issues: ${t.myIssueUrls.join(", ")}`);
    }
    if (t.githubIssueUrls?.length) {
      parts.push(`   waiting on issues: ${t.githubIssueUrls.join(", ")}`);
    }
    if (t.notebookNoteId) {
      parts.push(`   note: ${t.notebookNoteId}`);
    }
    return parts.join("\n");
  }).join("\n\n");
}

const AZURE_WORK_ITEM_URL_REGEX = /^https?:\/\/dev\.azure\.com\/[^/]+\/[^/]+\/_workitems\/edit\/(\d+)(?:[/?#]|$)/i;

function parseAzureWorkItemId(url?: string | null): number | null {
  if (!url) return null;
  const match = url.trim().match(AZURE_WORK_ITEM_URL_REGEX);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function buildAzureContextQuery(params: {
  includeComments: boolean;
  includeUpdates: boolean;
  maxComments: number;
  maxUpdates: number;
}) {
  const query = new URLSearchParams();
  query.set("includeComments", String(params.includeComments));
  query.set("includeUpdates", String(params.includeUpdates));
  query.set("maxComments", String(params.maxComments));
  query.set("maxUpdates", String(params.maxUpdates));
  return query.toString();
}

// --- server ---

const server = new McpServer({
  name: "ai-focus",
  version: "1.0.0",
});

// ─── Todos ───

server.tool(
  "list_todos",
  "List todos/tasks from AI Focus. Returns a compact summary by default. Use verbose=true for full JSON.",
  {
    status: z
      .enum(["TODO", "IN_PROGRESS", "WAITING", "UNDER_REVIEW", "ON_HOLD", "COMPLETED"])
      .optional()
      .describe("Filter by status"),
    priority: z
      .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
      .optional()
      .describe("Filter by priority"),
    archived: z
      .boolean()
      .optional()
      .describe("Include archived todos (default false)"),
    verbose: z
      .boolean()
      .optional()
      .describe("Return full JSON instead of compact summary (default false)"),
  },
  async (params) => {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.priority) query.set("priority", params.priority);
    if (params.archived) query.set("archived", "true");
    const qs = query.toString();
    const data = await apiFetch(`/api/todos${qs ? `?${qs}` : ""}`);
    if (isApiError(data)) return textResult(data);
    if (params.verbose) return textResult(data);
    return {
      content: [{ type: "text" as const, text: formatTodoSummary(data as TodoResponse[]) }],
    };
  }
);

server.tool(
  "get_todo",
  "Get a single todo/task by task number (e.g. 7) or ID.",
  {
    taskNumber: z.number().int().positive().optional().describe("The task number (e.g. 7)"),
    id: z.string().optional().describe("The todo cuid (use taskNumber instead when possible)"),
  },
  async (params) => {
    const key = params.taskNumber?.toString() ?? params.id;
    if (!key) throw new Error("Provide either taskNumber or id");
    const data = await apiFetch(`/api/todos/${key}`);
    return textResult(data);
  }
);

server.tool(
  "create_todo",
  "Create a new todo/task in AI Focus.",
  {
    title: z.string().min(1).max(200).describe("Task title"),
    description: z
      .string()
      .max(10000)
      .optional()
      .describe("Task description (supports markdown)"),
    priority: z
      .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
      .optional()
      .describe("Priority level (default MEDIUM)"),
    status: z
      .enum(["TODO", "IN_PROGRESS", "WAITING", "UNDER_REVIEW", "ON_HOLD", "COMPLETED"])
      .optional()
      .describe("Initial status (default TODO)"),
    dueDate: z
      .string()
      .optional()
      .describe("Due date as ISO string"),
    labelIds: z
      .array(z.string())
      .optional()
      .describe("Array of label IDs to attach"),
    subtasks: z
      .array(z.string())
      .optional()
      .describe("Array of subtask titles to create"),
    myPrUrls: z
      .array(z.string())
      .optional()
      .describe("GitHub PR URLs for this task's own PRs"),
    githubPrUrls: z
      .array(z.string())
      .optional()
      .describe("Array of dependency GitHub PR URLs to wait on"),
    azureWorkItemUrl: z
      .string()
      .nullable()
      .optional()
      .describe("Azure DevOps work item URL for this task"),
    azureDepUrls: z
      .array(z.string())
      .optional()
      .describe("Array of dependent Azure DevOps work item URLs to wait on"),
    myIssueUrls: z
      .array(z.string())
      .optional()
      .describe("GitHub Issue URLs for this task's own issues"),
    githubIssueUrls: z
      .array(z.string())
      .optional()
      .describe("Array of dependency GitHub Issue URLs to wait on"),
  },
  async (params) => {
    const { subtasks: subtaskTitles, ...rest } = params;
    const body: Record<string, unknown> = { ...rest };
    if (body.description) body.description = toHtml(body.description as string);
    if (subtaskTitles?.length) {
      body.subtasks = subtaskTitles.map((title, i) => ({ title, order: i }));
    }
    const data = await apiFetch("/api/todos", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return textResult(data);
  }
);

server.tool(
  "update_todo",
  `Update an existing todo/task. Use this to update progress, change status, edit description, etc.

IMPORTANT — Description handling:
- By default, descriptionMode is "append" which ADDS to the existing description (preserving all prior content).
- Use descriptionMode "replace" ONLY when the user explicitly asks to overwrite/replace the entire description.
- When appending, the new text is added as a new paragraph below the existing content.
- If you need to see the current description first, use get_todo before updating.`,
  {
    taskNumber: z.number().int().positive().optional().describe("The task number (e.g. 7)"),
    id: z.string().optional().describe("The todo cuid (use taskNumber instead when possible)"),
    title: z.string().min(1).max(200).optional().describe("New title"),
    description: z
      .string()
      .max(10000)
      .optional()
      .describe("Description content. Behavior depends on descriptionMode."),
    descriptionMode: z
      .enum(["append", "replace"])
      .optional()
      .describe("How to handle description updates. 'append' (default) adds to existing content. 'replace' overwrites it entirely."),
    status: z
      .enum(["TODO", "IN_PROGRESS", "WAITING", "UNDER_REVIEW", "ON_HOLD", "COMPLETED"])
      .optional()
      .describe("New status"),
    priority: z
      .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
      .optional()
      .describe("New priority"),
    archived: z.boolean().optional().describe("Archive or unarchive"),
    dueDate: z
      .string()
      .nullable()
      .optional()
      .describe("New due date (ISO string) or null to clear"),
    labelIds: z
      .array(z.string())
      .optional()
      .describe("Replace label IDs"),
    subtasks: z
      .array(z.object({
        id: z.string().optional(),
        title: z.string(),
        completed: z.boolean().optional(),
        order: z.number().int(),
      }))
      .optional()
      .describe("Replace all subtasks (declarative sync). Include id for existing subtasks, omit for new ones."),
    myPrUrls: z
      .array(z.string())
      .optional()
      .describe("GitHub PR URLs for this task's own PRs"),
    githubPrUrls: z
      .array(z.string())
      .optional()
      .describe("Array of dependency GitHub PR URLs to wait on"),
    azureWorkItemUrl: z
      .string()
      .nullable()
      .optional()
      .describe("Azure DevOps work item URL for this task"),
    azureDepUrls: z
      .array(z.string())
      .optional()
      .describe("Array of dependent Azure DevOps work item URLs to wait on"),
    myIssueUrls: z
      .array(z.string())
      .optional()
      .describe("GitHub Issue URLs for this task's own issues"),
    githubIssueUrls: z
      .array(z.string())
      .optional()
      .describe("Array of dependency GitHub Issue URLs to wait on"),
    notebookNoteId: z
      .string()
      .nullable()
      .optional()
      .describe("Notebook note ID to link (or null to unlink)"),
  },
  async ({ taskNumber, id, descriptionMode, ...updates }) => {
    const key = taskNumber?.toString() ?? id;
    if (!key) throw new Error("Provide either taskNumber or id");

    if (updates.description) {
      const newHtml = toHtml(updates.description);

      if ((descriptionMode ?? "append") === "append") {
        const existing = await apiFetch(`/api/todos/${key}`) as { description?: string | null };
        if (existing.description) {
          const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          const separator = `<p><strong>— Update ${date} —</strong></p>`;
          updates.description = `${existing.description}${separator}${newHtml}`;
        } else {
          updates.description = newHtml;
        }
      } else {
        updates.description = newHtml;
      }
    }

    const data = await apiFetch(`/api/todos/${key}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return textResult(data);
  }
);

server.tool(
  "delete_todo",
  "Permanently delete a todo/task.",
  {
    taskNumber: z.number().int().positive().optional().describe("The task number (e.g. 7)"),
    id: z.string().optional().describe("The todo cuid (use taskNumber instead when possible)"),
  },
  async ({ taskNumber, id }) => {
    const key = taskNumber?.toString() ?? id;
    if (!key) throw new Error("Provide either taskNumber or id");
    const data = await apiFetch(`/api/todos/${key}`, { method: "DELETE" });
    return textResult(data);
  }
);

server.tool(
  "toggle_subtask",
  "Toggle a subtask's completed status.",
  {
    taskNumber: z.number().int().positive().optional().describe("The parent task number"),
    todoId: z.string().optional().describe("The parent todo cuid (use taskNumber instead when possible)"),
    subtaskId: z.string().describe("The subtask ID to toggle"),
    completed: z.boolean().describe("Set completed to true or false"),
  },
  async ({ taskNumber, todoId, subtaskId, completed }) => {
    const key = taskNumber?.toString() ?? todoId;
    if (!key) throw new Error("Provide either taskNumber or todoId");
    const data = await apiFetch(`/api/todos/${key}/subtasks/${subtaskId}`, {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    });
    return textResult(data);
  }
);

// ─── Labels ───

server.tool(
  "list_labels",
  "List all available labels for tagging todos.",
  {},
  async () => {
    const data = await apiFetch("/api/labels");
    return textResult(data);
  }
);

// ─── Labels (extended) ───

server.tool(
  "create_label",
  "Create a new label for tagging todos.",
  {
    name: z.string().min(1).max(40).describe("Label name"),
    color: z.string().optional().describe("Hex color like #FF5733"),
  },
  async (params) => {
    const data = await apiFetch("/api/labels", {
      method: "POST",
      body: JSON.stringify(params),
    });
    return textResult(data);
  }
);

server.tool(
  "delete_label",
  "Delete a label.",
  {
    id: z.string().describe("The label ID to delete"),
  },
  async ({ id }) => {
    const data = await apiFetch(`/api/labels/${id}`, { method: "DELETE" });
    return textResult(data);
  }
);

// ─── People ───

server.tool(
  "list_people",
  "List all people in the directory (name + email). Used for @mentions in task descriptions.",
  {},
  async () => {
    const data = await apiFetch("/api/people");
    return textResult(data);
  }
);

server.tool(
  "create_person",
  "Add a person to the directory.",
  {
    name: z.string().min(1).max(100).describe("Person's name"),
    email: z.string().email().max(200).describe("Person's email address"),
  },
  async (params) => {
    const data = await apiFetch("/api/people", {
      method: "POST",
      body: JSON.stringify(params),
    });
    return textResult(data);
  }
);

server.tool(
  "delete_person",
  "Remove a person from the directory.",
  {
    id: z.string().describe("The person's ID"),
  },
  async ({ id }) => {
    const data = await apiFetch(`/api/people/${id}`, { method: "DELETE" });
    return textResult(data);
  }
);

// ─── Notebook ───

server.tool(
  "list_notes",
  "List notebook notes. Optionally search by title.",
  {
    search: z.string().optional().describe("Search notes by title"),
  },
  async (params) => {
    const qs = params.search ? `?search=${encodeURIComponent(params.search)}` : "";
    const data = await apiFetch(`/api/notebook${qs}`);
    return textResult(data);
  }
);

server.tool(
  "get_note",
  "Get a single notebook note by ID with full content.",
  {
    id: z.string().describe("The note ID"),
  },
  async ({ id }) => {
    const data = await apiFetch(`/api/notebook/${id}`);
    return textResult(data);
  }
);

server.tool(
  "create_note",
  "Create a new notebook note.",
  {
    title: z.string().max(200).optional().describe("Note title"),
    content: z.string().max(100000).optional().describe("Note content (supports markdown)"),
  },
  async (params) => {
    const body = { ...params };
    if (body.content) body.content = toHtml(body.content);
    const data = await apiFetch("/api/notebook", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return textResult(data);
  }
);

server.tool(
  "update_note",
  "Update a notebook note.",
  {
    id: z.string().describe("The note ID"),
    title: z.string().max(200).optional().describe("New title"),
    content: z.string().max(100000).optional().describe("New content (supports markdown)"),
    pinned: z.boolean().optional().describe("Pin or unpin the note"),
  },
  async ({ id, ...updates }) => {
    if (updates.content) updates.content = toHtml(updates.content);
    const data = await apiFetch(`/api/notebook/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return textResult(data);
  }
);

server.tool(
  "delete_note",
  "Delete a notebook note.",
  {
    id: z.string().describe("The note ID to delete"),
  },
  async ({ id }) => {
    const data = await apiFetch(`/api/notebook/${id}`, { method: "DELETE" });
    return textResult(data);
  }
);

// ─── Scratch Pad ───

server.tool(
  "get_scratchpad",
  "Get the scratch pad content. A single persistent note for quick thoughts.",
  {},
  async () => {
    const data = await apiFetch("/api/note");
    return textResult(data);
  }
);

server.tool(
  "update_scratchpad",
  "Update the scratch pad content. Useful for leaving yourself reminders or quick notes.",
  {
    content: z.string().max(20000).describe("New scratch pad content (supports markdown)"),
  },
  async (params) => {
    const body = { content: toHtml(params.content) };
    const data = await apiFetch("/api/note", {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return textResult(data);
  }
);

// ─── Azure DevOps ───

if (EXPOSE_AZURE_LOW_LEVEL) {
  server.tool(
    "get_azure_work_item",
    "[deprecated] Low-level Azure tool. Prefer get_azure_work_item_context.",
    {
      workItemId: z.number().int().positive().describe("Azure DevOps work item ID"),
    },
    async ({ workItemId }) => {
      const data = await apiFetch(`/api/azure/workitems/${workItemId}`);
      return textResult(data);
    }
  );

  server.tool(
    "get_azure_work_item_comments",
    "[deprecated] Low-level Azure tool. Prefer get_azure_work_item_context.",
    {
      workItemId: z.number().int().positive().describe("Azure DevOps work item ID"),
    },
    async ({ workItemId }) => {
      const data = await apiFetch(`/api/azure/workitems/${workItemId}/comments`);
      return textResult(data);
    }
  );

  server.tool(
    "get_azure_work_item_relations",
    "[deprecated] Low-level Azure tool. Prefer get_azure_work_item_context.",
    {
      workItemId: z.number().int().positive().describe("Azure DevOps work item ID"),
    },
    async ({ workItemId }) => {
      const data = await apiFetch(`/api/azure/workitems/${workItemId}/relations`);
      return textResult(data);
    }
  );

  server.tool(
    "get_azure_work_item_updates",
    "[deprecated] Low-level Azure tool. Prefer get_azure_work_item_context.",
    {
      workItemId: z.number().int().positive().describe("Azure DevOps work item ID"),
    },
    async ({ workItemId }) => {
      const data = await apiFetch(`/api/azure/workitems/${workItemId}/updates`);
      return textResult(data);
    }
  );

  server.tool(
    "get_azure_pr_links",
    "[deprecated] Low-level Azure tool. Prefer get_azure_work_item_context.",
    {
      workItemId: z.number().int().positive().describe("Azure DevOps work item ID"),
    },
    async ({ workItemId }) => {
      const data = await apiFetch(`/api/azure/workitems/${workItemId}/pr-links`);
      return textResult(data);
    }
  );
}

server.tool(
  "get_azure_work_item_context",
  "Get optimized Azure DevOps planning context in one call (details + relations + PR links + optional comments/updates). Prefer this over calling multiple Azure tools.",
  {
    workItemId: z.number().int().positive().optional().describe("Azure DevOps work item ID"),
    workItemUrl: z
      .string()
      .optional()
      .describe("Azure DevOps work item URL (alternative to workItemId)"),
    includeComments: z
      .boolean()
      .optional()
      .describe("Include Azure comments (default true)"),
    includeUpdates: z
      .boolean()
      .optional()
      .describe("Include Azure updates/change history (default false)"),
    maxComments: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Max Azure comments to return when includeComments=true (default 20)"),
    maxUpdates: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Max Azure updates to return when includeUpdates=true (default 20)"),
  },
  async ({
    workItemId,
    workItemUrl,
    includeComments = true,
    includeUpdates = false,
    maxComments = 20,
    maxUpdates = 20,
  }) => {
    const parsedFromUrl = parseAzureWorkItemId(workItemUrl ?? null);
    const resolvedWorkItemId = workItemId ?? parsedFromUrl;
    if (!resolvedWorkItemId) {
      throw new Error("Provide either workItemId or a valid workItemUrl");
    }

    const qs = buildAzureContextQuery({
      includeComments,
      includeUpdates,
      maxComments,
      maxUpdates,
    });
    const data = await apiFetch(`/api/azure/workitems/${resolvedWorkItemId}/context?${qs}`);
    return textResult(data);
  }
);

// ─── Accomplishments ───

server.tool(
  "list_accomplishments",
  "List accomplishments for a given year. Used for performance review tracking.",
  {
    year: z.number().min(2000).max(2100).optional().describe("Year (defaults to current year)"),
  },
  async (params) => {
    const qs = params.year ? `?year=${params.year}` : "";
    const data = await apiFetch(`/api/accomplishments${qs}`);
    if (isApiError(data)) return textResult(data);
    const items = data as { id: string; title: string; category: string; date: string; description?: string | null }[];
    if (items.length === 0) return { content: [{ type: "text" as const, text: "No accomplishments found." }] };
    const text = items.map((a) => {
      const parts = [`${a.date.split("T")[0]} | [${a.category}] ${a.title}`];
      if (a.description) parts.push(`   ${a.description}`);
      parts.push(`   id: ${a.id}`);
      return parts.join("\n");
    }).join("\n\n");
    return { content: [{ type: "text" as const, text }] };
  }
);

server.tool(
  "create_accomplishment",
  "Create a new accomplishment entry for performance review tracking.",
  {
    title: z.string().min(1).max(200).describe("Accomplishment title"),
    description: z.string().max(1000).optional().describe("Details about the accomplishment (supports markdown)"),
    category: z
      .enum(["DELIVERY", "HIRING", "MENTORING", "COLLABORATION", "GROWTH", "OTHER"])
      .describe("Category: DELIVERY (features/PRs), HIRING (interviews), MENTORING (coaching), COLLABORATION (cross-team), GROWTH (learning), OTHER (doesn't fit above)"),
    date: z.string().describe("Date of accomplishment (ISO string, e.g. 2026-01-15)"),
  },
  async (params) => {
    const body: Record<string, unknown> = { ...params };
    if (body.description) body.description = toHtml(body.description as string);
    const data = await apiFetch("/api/accomplishments", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return textResult(data);
  }
);

server.tool(
  "update_accomplishment",
  "Update an existing accomplishment.",
  {
    id: z.string().describe("The accomplishment ID"),
    title: z.string().min(1).max(200).optional().describe("New title"),
    description: z.string().max(1000).nullable().optional().describe("New description (supports markdown)"),
    category: z
      .enum(["DELIVERY", "HIRING", "MENTORING", "COLLABORATION", "GROWTH", "OTHER"])
      .optional()
      .describe("New category"),
    date: z.string().optional().describe("New date (ISO string)"),
  },
  async ({ id, ...updates }) => {
    if (updates.description) updates.description = toHtml(updates.description);
    const data = await apiFetch(`/api/accomplishments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return textResult(data);
  }
);

server.tool(
  "delete_accomplishment",
  "Delete an accomplishment.",
  {
    id: z.string().describe("The accomplishment ID to delete"),
  },
  async ({ id }) => {
    const data = await apiFetch(`/api/accomplishments/${id}`, { method: "DELETE" });
    return textResult(data);
  }
);

// ─── Stats ───

server.tool(
  "get_year_stats",
  "Get year-in-review statistics: completion rates, streaks, busiest months, etc.",
  {
    year: z.number().min(2000).max(2100).optional().describe("Year (defaults to current year)"),
  },
  async (params) => {
    const qs = params.year ? `?year=${params.year}` : "";
    const data = await apiFetch(`/api/stats/year${qs}`);
    return textResult(data);
  }
);

// ─── Bulk / Workflow helpers ───

server.tool(
  "get_todo_execution_context",
  "Get a todo by task number or id and hydrate linked Azure planning context in one call. Optimized for kickstarting implementation work.",
  {
    taskNumber: z.number().int().positive().optional().describe("The task number (e.g. 7)"),
    id: z.string().optional().describe("The todo cuid (use taskNumber instead when possible)"),
    includeComments: z
      .boolean()
      .optional()
      .describe("Include Azure comments (default true)"),
    includeUpdates: z
      .boolean()
      .optional()
      .describe("Include Azure updates/change history (default false)"),
    maxComments: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Max Azure comments to return when includeComments=true (default 20)"),
    maxUpdates: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Max Azure updates to return when includeUpdates=true (default 20)"),
  },
  async ({
    taskNumber,
    id,
    includeComments = true,
    includeUpdates = false,
    maxComments = 20,
    maxUpdates = 20,
  }) => {
    const key = taskNumber?.toString() ?? id;
    if (!key) throw new Error("Provide either taskNumber or id");

    const todoData = await apiFetch(`/api/todos/${key}`);
    if (isApiError(todoData)) return textResult(todoData);

    const todo = todoData as TodoResponse;
    const azureWorkItemId = parseAzureWorkItemId(todo.azureWorkItemUrl);

    if (!azureWorkItemId) {
      return textResult({
        todo,
        azure: {
          linked: false,
          reason: "No valid azureWorkItemUrl found on this todo",
        },
      });
    }

    const qs = buildAzureContextQuery({
      includeComments,
      includeUpdates,
      maxComments,
      maxUpdates,
    });
    const context = await apiFetch(`/api/azure/workitems/${azureWorkItemId}/context?${qs}`);

    return textResult({
      todo,
      azure: {
        linked: true,
        workItemId: azureWorkItemId,
        context,
      },
    });
  }
);

server.tool(
  "search_todos",
  "Search todos by title or description text. Returns matching active todos.",
  {
    query: z.string().min(1).describe("Search text to match against todo titles"),
  },
  async ({ query }) => {
    const data = await apiFetch("/api/todos");
    if (isApiError(data)) return textResult(data);
    const q = query.toLowerCase();
    const filtered = (data as TodoResponse[]).filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
    return {
      content: [{ type: "text" as const, text: formatTodoSummary(filtered) }],
    };
  }
);

server.tool(
  "archive_todo",
  "Archive a todo (soft delete). The todo can be restored later.",
  {
    taskNumber: z.number().int().positive().optional().describe("The task number (e.g. 7)"),
    id: z.string().optional().describe("The todo cuid"),
  },
  async ({ taskNumber, id }) => {
    const key = taskNumber?.toString() ?? id;
    if (!key) throw new Error("Provide either taskNumber or id");
    const data = await apiFetch(`/api/todos/${key}`, {
      method: "PATCH",
      body: JSON.stringify({ archived: true }),
    });
    return textResult(data);
  }
);

server.tool(
  "restore_todo",
  "Restore an archived todo back to active.",
  {
    taskNumber: z.number().int().positive().optional().describe("The task number (e.g. 7)"),
    id: z.string().optional().describe("The todo cuid"),
  },
  async ({ taskNumber, id }) => {
    const key = taskNumber?.toString() ?? id;
    if (!key) throw new Error("Provide either taskNumber or id");
    const data = await apiFetch(`/api/todos/${key}`, {
      method: "PATCH",
      body: JSON.stringify({ archived: false }),
    });
    return textResult(data);
  }
);

server.tool(
  "complete_todo",
  "Mark a todo as completed.",
  {
    taskNumber: z.number().int().positive().optional().describe("The task number (e.g. 7)"),
    id: z.string().optional().describe("The todo cuid"),
  },
  async ({ taskNumber, id }) => {
    const key = taskNumber?.toString() ?? id;
    if (!key) throw new Error("Provide either taskNumber or id");
    const data = await apiFetch(`/api/todos/${key}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    return textResult(data);
  }
);

server.tool(
  "start_todo",
  "Mark a todo as in progress.",
  {
    taskNumber: z.number().int().positive().optional().describe("The task number (e.g. 7)"),
    id: z.string().optional().describe("The todo cuid"),
  },
  async ({ taskNumber, id }) => {
    const key = taskNumber?.toString() ?? id;
    if (!key) throw new Error("Provide either taskNumber or id");
    const data = await apiFetch(`/api/todos/${key}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "IN_PROGRESS" }),
    });
    return textResult(data);
  }
);

// ─── Todo Contacts ───

server.tool(
  "list_todo_contacts",
  "List contacts assigned to a todo/task. Each contact has a person (name, email) and a role.",
  {
    taskNumber: z.number().int().positive().optional().describe("Task number (e.g. 7)"),
    id: z.string().optional().describe("Todo cuid (use taskNumber instead when possible)"),
  },
  async (params) => {
    let resolvedId = params.id;
    if (params.taskNumber && !params.id) {
      const todo = await apiFetch(`/api/todos/${params.taskNumber}`);
      if (isApiError(todo)) return textResult(todo);
      resolvedId = todo.id;
    }
    if (!resolvedId) return textResult({ _error: true, message: "Provide taskNumber or id" });
    const data = await apiFetch(`/api/todos/${resolvedId}/contacts`);
    if (isApiError(data)) return textResult(data);
    return textResult(data);
  }
);

server.tool(
  "add_todo_contact",
  "Add a contact (person) to a todo/task with a role.",
  {
    taskNumber: z.number().int().positive().optional().describe("Task number (e.g. 7)"),
    id: z.string().optional().describe("Todo cuid"),
    personId: z.string().describe("Person ID to add as contact"),
    role: z.string().describe("Role this person plays (e.g. 'reviewer', 'stakeholder')"),
  },
  async (params) => {
    let resolvedId = params.id;
    if (params.taskNumber && !params.id) {
      const todo = await apiFetch(`/api/todos/${params.taskNumber}`);
      if (isApiError(todo)) return textResult(todo);
      resolvedId = todo.id;
    }
    if (!resolvedId) return textResult({ _error: true, message: "Provide taskNumber or id" });
    const data = await apiFetch(`/api/todos/${resolvedId}/contacts`, {
      method: "POST",
      body: JSON.stringify({ personId: params.personId, role: params.role }),
    });
    if (isApiError(data)) return textResult(data);
    return textResult(data);
  }
);

server.tool(
  "remove_todo_contact",
  "Remove a contact from a todo/task.",
  {
    taskNumber: z.number().int().positive().optional().describe("Task number"),
    id: z.string().optional().describe("Todo cuid"),
    contactId: z.string().describe("The TodoContact ID to remove"),
  },
  async (params) => {
    let resolvedId = params.id;
    if (params.taskNumber && !params.id) {
      const todo = await apiFetch(`/api/todos/${params.taskNumber}`);
      if (isApiError(todo)) return textResult(todo);
      resolvedId = todo.id;
    }
    if (!resolvedId) return textResult({ _error: true, message: "Provide taskNumber or id" });
    const data = await apiFetch(`/api/todos/${resolvedId}/contacts/${params.contactId}`, {
      method: "DELETE",
    });
    if (isApiError(data)) return textResult(data);
    return textResult(data);
  }
);

// ─── Start ───

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AI Focus MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
