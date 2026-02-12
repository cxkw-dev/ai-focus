#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE = process.env.AI_FOCUS_API_URL || "http://localhost:4444";

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

// Convert plain text to HTML paragraphs for the rich text editor.
// Supports basic markdown-like syntax: **bold**, *italic*, - bullet lists.
function toHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      // Check if block is a bullet list
      const lines = trimmed.split("\n");
      const isList = lines.every((l) => /^[-*]\s/.test(l.trim()));
      if (isList) {
        const items = lines
          .map((l) => `<li>${inlineFormat(l.replace(/^[-*]\s+/, ""))}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }
      // Regular paragraph
      return `<p>${inlineFormat(trimmed.replace(/\n/g, "<br/>"))}</p>`;
    })
    .filter(Boolean)
    .join("");
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

interface SubtaskResponse {
  id: string;
  title: string;
  completed: boolean;
  order: number;
}

interface TodoResponse {
  taskNumber: number;
  title: string;
  status: string;
  priority: string;
  description?: string | null;
  dueDate?: string | null;
  archived?: boolean;
  labels?: { name: string }[];
  subtasks?: SubtaskResponse[];
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
    return parts.join("\n");
  }).join("\n\n");
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
      .enum(["TODO", "IN_PROGRESS", "WAITING", "ON_HOLD", "COMPLETED"])
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
      .max(1000)
      .optional()
      .describe("Task description (supports markdown)"),
    priority: z
      .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
      .optional()
      .describe("Priority level (default MEDIUM)"),
    status: z
      .enum(["TODO", "IN_PROGRESS", "WAITING", "ON_HOLD", "COMPLETED"])
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
      .max(1000)
      .optional()
      .describe("Description content. Behavior depends on descriptionMode."),
    descriptionMode: z
      .enum(["append", "replace"])
      .optional()
      .describe("How to handle description updates. 'append' (default) adds to existing content. 'replace' overwrites it entirely."),
    status: z
      .enum(["TODO", "IN_PROGRESS", "WAITING", "ON_HOLD", "COMPLETED"])
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
    content: z.string().max(100000).optional().describe("Note content"),
  },
  async (params) => {
    const data = await apiFetch("/api/notebook", {
      method: "POST",
      body: JSON.stringify(params),
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
    content: z.string().max(100000).optional().describe("New content"),
    pinned: z.boolean().optional().describe("Pin or unpin the note"),
  },
  async ({ id, ...updates }) => {
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
    content: z.string().max(20000).describe("New scratch pad content"),
  },
  async (params) => {
    const data = await apiFetch("/api/note", {
      method: "PUT",
      body: JSON.stringify(params),
    });
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
  "search_todos",
  "Search todos by title or description text. Returns matching active todos.",
  {
    query: z.string().min(1).describe("Search text to match against todo titles"),
  },
  async ({ query }) => {
    const data = await apiFetch("/api/todos");
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
