# AI Sessions Feature — Design Spec

## Overview

Store Claude Code and Codex CLI session references on task cards so users can resume AI sessions from the UI. Sessions are added automatically via MCP tools and resumed by copying commands from the UI.

## Data Model

New `Session` model linked to `Todo` with cascade delete:

```prisma
model Session {
  id          String   @id @default(cuid())
  tool        String   // "claude" | "codex"
  command     String   // Full resume command, e.g. "claude --resume 019d4ebb-e7a3-79a1"
  workingPath String   // Working directory, e.g. "~/ai-focus"
  createdAt   DateTime @default(now())
  todoId      String
  todo        Todo     @relation(fields: [todoId], references: [id], onDelete: Cascade)

  @@index([todoId])
  @@index([createdAt])
}
```

Todo model gets: `sessions Session[]`

## API Endpoints

- `GET /api/todos` — include sessions in todo response (already included via Prisma include)
- `POST /api/todos/:id/sessions` — create session `{ tool, command, workingPath }`
- `DELETE /api/sessions/:id` — delete a session

## MCP Server

New `add_session` tool:
- Params: `taskNumber` (int), `tool` ("claude" | "codex"), `command` (string), `workingPath` (string)
- Resolves taskNumber to todo ID, creates session via API
- Called by the AI agent while working on a task

## UI Design

### Session Row
- Brand icon (Anthropic for Claude via `react-icons/si`, OpenAI for Codex)
- Command in monospace (primary text, truncated with ellipsis)
- Working path + relative time in tiny text below command
- Terminal icon button (Lucide `Terminal`) to copy command to clipboard

### Task Card (todo-item.tsx)
- Collapsible "Sessions (N)" section, same pattern as subtasks
- Grouped by tool: brand icon as group header with "N sessions" count
- Session rows underneath, tinted with tool's brand color
- Collapsed by default, click chevron to expand

### Edit Dialog (edit-todo-dialog.tsx)
- Same grouped layout in right column
- Delete button (X) on hover per session row
- No manual add UI — sessions come from MCP only

## Dependencies

- Install `react-icons` for `SiAnthropic` and `SiOpenai` brand icons

## TypeScript Types

```ts
// src/types/todo.ts
export interface Session {
  id: string
  tool: 'claude' | 'codex'
  command: string
  workingPath: string
  createdAt: string
}

// Add to Todo interface:
// sessions: Session[]
```

## Clipboard Copy

Use `navigator.clipboard.writeText(session.command)` with a brief toast confirmation "Copied to clipboard".

## SSE Integration

Session create/delete endpoints emit `'todos'` event so other tabs get updated.
