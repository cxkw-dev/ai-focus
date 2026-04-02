# AI Sessions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store Claude Code and Codex session references on task cards so users can copy resume commands and pick up where they left off.

**Architecture:** New `Session` model linked to `Todo` with cascade delete. Sessions created via MCP tool (agent calls `add_session`), displayed on task cards in collapsible groups by tool, copied to clipboard via terminal icon button. `react-icons` for brand icons.

**Tech Stack:** Prisma 7, Next.js API routes, React Query, react-icons, Lucide Terminal icon

---

### Task 1: Prisma Schema — Add Session Model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add Session model to schema**

Add after the `StatusUpdate` model (around line 139):

```prisma
model Session {
  id          String   @id @default(cuid())
  tool        String   // "claude" | "codex"
  command     String
  workingPath String
  createdAt   DateTime @default(now())
  todoId      String
  todo        Todo     @relation(fields: [todoId], references: [id], onDelete: Cascade)

  @@index([todoId])
  @@index([createdAt])
}
```

Add `sessions Session[]` to the `Todo` model (after `statusUpdates   StatusUpdate[]`).

- [ ] **Step 2: Push schema to database**

Run: `npm run db:push`
Expected: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 3: Generate Prisma client**

Run: `npm run db:generate`
Expected: `Generated Prisma Client`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "add session model to prisma schema"
```

---

### Task 2: TypeScript Types + Query Infrastructure

**Files:**
- Modify: `src/types/todo.ts`
- Modify: `src/lib/todo-queries.ts`
- Modify: `src/lib/api.ts`
- Modify: `src/lib/query-keys.ts`

- [ ] **Step 1: Add Session type to `src/types/todo.ts`**

Add after the `StatusUpdate` interface:

```ts
export interface Session {
  id: string
  tool: 'claude' | 'codex'
  command: string
  workingPath: string
  createdAt: string
}
```

Add `sessions: Session[]` to the `Todo` interface (after `notebookNote`).

- [ ] **Step 2: Update `src/lib/todo-queries.ts` to include sessions**

Add `sessions` to the `todoInclude` validator:

```ts
export const todoInclude = Prisma.validator<Prisma.TodoInclude>()({
  labels: { orderBy: { name: 'asc' } },
  subtasks: { orderBy: { order: 'asc' } },
  notebookNote: { select: { id: true, title: true } },
  sessions: { orderBy: { createdAt: 'desc' } },
})
```

- [ ] **Step 3: Add session API methods to `src/lib/api.ts`**

Add to the `todosApi` object:

```ts
  createSession: (todoId: string, data: { tool: string; command: string; workingPath: string }): Promise<Session> =>
    fetch(`/api/todos/${todoId}/sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    }).then(r => json(r)),

  deleteSession: (sessionId: string): Promise<{ success: boolean }> =>
    fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' }).then(r => json(r)),
```

Add `Session` to the import from `@/types/todo`.

- [ ] **Step 4: Commit**

```bash
git add src/types/todo.ts src/lib/todo-queries.ts src/lib/api.ts
git commit -m "add session types, prisma include, and api client methods"
```

---

### Task 3: API Routes — Session CRUD

**Files:**
- Create: `src/app/api/todos/[id]/sessions/route.ts`
- Create: `src/app/api/sessions/[id]/route.ts`

- [ ] **Step 1: Create POST endpoint for sessions at `src/app/api/todos/[id]/sessions/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'
import { todoWhere } from '@/lib/todo-queries'

const createSessionSchema = z.object({
  tool: z.enum(['claude', 'codex']),
  command: z.string().min(1),
  workingPath: z.string().min(1),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const parsed = createSessionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
  }

  const todo = await db.todo.findUnique({ where: todoWhere(id) })
  if (!todo) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
  }

  const session = await db.session.create({
    data: {
      tool: parsed.data.tool,
      command: parsed.data.command,
      workingPath: parsed.data.workingPath,
      todoId: todo.id,
    },
  })

  emit('todos')
  return NextResponse.json(session, { status: 201 })
}
```

- [ ] **Step 2: Create DELETE endpoint at `src/app/api/sessions/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const session = await db.session.findUnique({ where: { id } })
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  await db.session.delete({ where: { id } })
  emit('todos')
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Verify API works**

Run: `curl -X POST http://localhost:3000/api/todos/1/sessions -H 'Content-Type: application/json' -d '{"tool":"claude","command":"claude --resume test123","workingPath":"~/ai-focus"}'`
Expected: JSON with created session including `id`, `tool`, `command`, `workingPath`, `createdAt`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/todos/\[id\]/sessions/route.ts src/app/api/sessions/\[id\]/route.ts
git commit -m "add session api routes (create and delete)"
```

---

### Task 4: Install react-icons

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install react-icons**

Run: `npm install react-icons`

- [ ] **Step 2: Verify installation**

Run: `npm list react-icons`
Expected: Shows `react-icons@5.x.x`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "install react-icons for brand icons"
```

---

### Task 5: Session Display Component

**Files:**
- Create: `src/components/todos/session-list.tsx`

- [ ] **Step 1: Create the SessionList component**

This component renders sessions grouped by tool with collapsible expand/collapse, matching the subtask pattern in `todo-item.tsx`. Used in both the task card and edit dialog.

```tsx
'use client'

import * as React from 'react'
import { ChevronDown, ChevronRight, Terminal, X } from 'lucide-react'
import { SiAnthropic, SiOpenai } from 'react-icons/si'
import { cn, formatRelativeDate } from '@/lib/utils'
import type { Session } from '@/types/todo'

const TOOL_CONFIG = {
  claude: {
    icon: SiAnthropic,
    colorVar: '#d4a574',
    bgTint: 'rgba(212,165,116,0.04)',
    borderTint: 'rgba(212,165,116,0.10)',
    buttonBg: 'rgba(212,165,116,0.10)',
    buttonBorder: 'rgba(212,165,116,0.15)',
  },
  codex: {
    icon: SiOpenai,
    colorVar: '#4ade80',
    bgTint: 'rgba(74,222,128,0.04)',
    borderTint: 'rgba(74,222,128,0.10)',
    buttonBg: 'rgba(74,222,128,0.10)',
    buttonBorder: 'rgba(74,222,128,0.15)',
  },
} as const

interface SessionListProps {
  sessions: Session[]
  onDelete?: (sessionId: string) => void
  compact?: boolean
}

export function SessionList({ sessions, onDelete, compact = false }: SessionListProps) {
  const [expanded, setExpanded] = React.useState(false)
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  if (sessions.length === 0) return null

  const grouped = React.useMemo(() => {
    const groups: Record<string, Session[]> = {}
    for (const session of sessions) {
      if (!groups[session.tool]) groups[session.tool] = []
      groups[session.tool].push(session)
    }
    return groups
  }, [sessions])

  const handleCopy = React.useCallback(async (session: Session) => {
    await navigator.clipboard.writeText(session.command)
    setCopiedId(session.id)
    setTimeout(() => setCopiedId(null), 1500)
  }, [])

  return (
    <div
      className={cn(!compact && 'pt-1.5')}
      style={!compact ? { borderTop: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)' } : undefined}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3" style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
          ) : (
            <ChevronRight className="h-3 w-3" style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
          )}
          <Terminal className="h-3 w-3" style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
            Sessions
          </span>
        </button>
        <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
          {sessions.length}
        </span>
      </div>

      {expanded && (
        <div className="flex flex-col gap-2.5 mt-1">
          {Object.entries(grouped).map(([tool, toolSessions]) => {
            const config = TOOL_CONFIG[tool as keyof typeof TOOL_CONFIG]
            if (!config) return null
            const Icon = config.icon

            return (
              <div key={tool}>
                <div className="flex items-center gap-1.5 mb-1.5 pl-0.5">
                  <Icon style={{ color: config.colorVar, width: 14, height: 14 }} />
                  <span className="text-[8px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    {toolSessions.length} {toolSessions.length === 1 ? 'session' : 'sessions'}
                  </span>
                </div>
                <div className="flex flex-col gap-1 pl-0.5">
                  {toolSessions.map((session) => (
                    <div
                      key={session.id}
                      className="group/session flex items-center gap-1.5 rounded-md px-2 py-1"
                      style={{
                        background: config.bgTint,
                        border: `1px solid ${config.borderTint}`,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[10px] font-mono truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {session.command}
                        </div>
                        <div className="text-[8px] mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                          {session.workingPath} · {formatRelativeDate(session.createdAt)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleCopy(session) }}
                        className="flex-shrink-0 p-1 rounded transition-colors"
                        style={{
                          background: config.buttonBg,
                          border: `1px solid ${config.buttonBorder}`,
                          color: copiedId === session.id ? 'var(--status-done)' : config.colorVar,
                        }}
                        title={copiedId === session.id ? 'Copied!' : 'Copy to terminal'}
                      >
                        <Terminal className="h-2.5 w-2.5" />
                      </button>
                      {onDelete && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onDelete(session.id) }}
                          className="flex-shrink-0 p-0.5 rounded opacity-0 group-hover/session:opacity-100 transition-opacity"
                          style={{ color: 'var(--destructive)' }}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/todos/session-list.tsx
git commit -m "add session-list component with grouped display and copy"
```

---

### Task 6: Integrate SessionList into TodoItem

**Files:**
- Modify: `src/components/todos/todo-item.tsx`

- [ ] **Step 1: Add SessionList to TodoItem card**

Import at top of file:
```ts
import { SessionList } from './session-list'
```

In the `TodoItemContent` component, add the sessions section after the subtasks section (after the closing `</div>` of the subtasks block, around line 880). Find the subtask section's closing `</div>` that corresponds to `{!compact && shouldShowSubtasks && (` and add after it:

```tsx
      {!compact && todo.sessions && todo.sessions.length > 0 && (
        <SessionList sessions={todo.sessions} />
      )}
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:3000/todos. If a task has sessions (created via the API curl in Task 3), the collapsible "Sessions" section should appear on the card. Check:
- Chevron expand/collapse works
- Sessions grouped by tool with brand icons
- Command is primary text in monospace
- Working path + relative time in tiny font below
- Terminal copy button copies to clipboard

- [ ] **Step 3: Commit**

```bash
git add src/components/todos/todo-item.tsx
git commit -m "integrate session-list into todo item card"
```

---

### Task 7: Integrate SessionList into EditTodoDialog

**Files:**
- Modify: `src/components/todos/edit-todo-dialog.tsx`

- [ ] **Step 1: Add SessionList with delete to the edit dialog right column**

Import at top:
```ts
import { SessionList } from './session-list'
```

Add `deleteSession` mutation. Import `todosApi` if not already imported (it is imported). Add a delete handler inside the `EditTodoDialog` component:

```ts
  const handleDeleteSession = React.useCallback(async (sessionId: string) => {
    await todosApi.deleteSession(sessionId)
    queryClient.invalidateQueries({ queryKey: queryKeys.todoBoard })
  }, [queryClient])
```

In the right column section, after the "Connected Note" section and before the "Contacts" section (around line 698), add:

```tsx
                {/* Sessions */}
                {todo?.sessions && todo.sessions.length > 0 && (
                  <div className="space-y-2">
                    <SessionList
                      sessions={todo.sessions}
                      onDelete={handleDeleteSession}
                      compact
                    />
                  </div>
                )}
```

- [ ] **Step 2: Verify in browser**

Open a task's edit dialog. Check:
- Sessions section appears in right column
- Delete button (X) appears on hover
- Deleting a session removes it and refreshes
- Copy still works

- [ ] **Step 3: Commit**

```bash
git add src/components/todos/edit-todo-dialog.tsx
git commit -m "add session-list with delete to edit dialog"
```

---

### Task 8: MCP Server — add_session Tool

**Files:**
- Create: `mcp-server/src/tools/sessions.ts`
- Modify: `mcp-server/src/index.ts`

- [ ] **Step 1: Create `mcp-server/src/tools/sessions.ts`**

```ts
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiFetch, textResult, isApiError, resolveTodoId } from "../helpers.js";

export function registerSessionTools(server: McpServer) {
  server.tool(
    "add_session",
    "Attach an AI coding session to a todo so the user can resume it later. Call this when you start working on a task.",
    {
      taskNumber: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("The task number (e.g. 7)"),
      id: z
        .string()
        .optional()
        .describe("The todo cuid (use taskNumber instead when possible)"),
      tool: z
        .enum(["claude", "codex"])
        .describe("Which AI tool this session is from"),
      command: z
        .string()
        .min(1)
        .describe("Full resume command, e.g. 'claude --resume 019d4ebb-e7a3' or 'codex resume 019d4ebb'"),
      workingPath: z
        .string()
        .min(1)
        .describe("Working directory path, e.g. '~/ai-focus'"),
    },
    async (params) => {
      const resolved = await resolveTodoId(params);
      if ("error" in resolved) return resolved.error;

      const data = await apiFetch(`/api/todos/${resolved.resolvedId}/sessions`, {
        method: "POST",
        body: JSON.stringify({
          tool: params.tool,
          command: params.command,
          workingPath: params.workingPath,
        }),
      });
      if (isApiError(data)) return textResult(data);
      return textResult({ message: `Session added to task`, session: data });
    }
  );

  server.tool(
    "remove_session",
    "Remove an AI session from a todo.",
    {
      sessionId: z.string().describe("The session cuid to delete"),
    },
    async (params) => {
      const data = await apiFetch(`/api/sessions/${params.sessionId}`, {
        method: "DELETE",
      });
      if (isApiError(data)) return textResult(data);
      return textResult({ message: "Session removed" });
    }
  );
}
```

- [ ] **Step 2: Register in `mcp-server/src/index.ts`**

Add import:
```ts
import { registerSessionTools } from "./tools/sessions.js";
```

Add registration call after `registerStatusUpdateTools(server);`:
```ts
registerSessionTools(server);
```

- [ ] **Step 3: Build MCP server**

Run: `cd mcp-server && npm run build`
Expected: Clean build with no errors

- [ ] **Step 4: Commit**

```bash
git add mcp-server/src/tools/sessions.ts mcp-server/src/index.ts
git commit -m "add session mcp tools (add_session, remove_session)"
```

---

### Task 9: Add Sessions to MCP Todo Summary

**Files:**
- Modify: `mcp-server/src/helpers.ts`
- Modify: `mcp-server/src/types.ts`

- [ ] **Step 1: Update `mcp-server/src/types.ts`**

Add `sessions` to the `TodoResponse` type. Find the type and add:

```ts
sessions?: { id: string; tool: string; command: string; workingPath: string; createdAt: string }[]
```

- [ ] **Step 2: Update `formatTodoSummary` in `mcp-server/src/helpers.ts`**

Add after the `githubIssueUrls` block (around line 107):

```ts
      if (t.sessions?.length) {
        const sessionLines = t.sessions.map(
          (s) => `     ${s.tool}: ${s.command} (${s.workingPath})`
        );
        parts.push(`   sessions:\n${sessionLines.join("\n")}`);
      }
```

- [ ] **Step 3: Rebuild MCP server**

Run: `cd mcp-server && npm run build`
Expected: Clean build

- [ ] **Step 4: Commit**

```bash
git add mcp-server/src/helpers.ts mcp-server/src/types.ts
git commit -m "include sessions in mcp todo summary output"
```

---

### Task 10: Verify formatRelativeDate Handles Sessions

**Files:**
- Check: `src/lib/utils.ts`

- [ ] **Step 1: Verify `formatRelativeDate` exists and works for session timestamps**

The `SessionList` component uses `formatRelativeDate` from `@/lib/utils`. Verify this function exists and handles ISO date strings. If it only handles dates (not datetime), it may need adjustment to show "2h ago" style relative times.

Check the function signature. If it only returns date-relative strings like "today" / "yesterday" / "3 days ago", that's fine for sessions too. If it doesn't exist or doesn't handle recent timestamps well, add a simple relative time formatter.

- [ ] **Step 2: Commit if changes were needed**

```bash
git add src/lib/utils.ts
git commit -m "ensure relative date formatting handles session timestamps"
```

---

### Task 11: Final Verification + Rebuild MCP

**Files:** None new

- [ ] **Step 1: Verify full flow in browser**

1. Create a session via curl: `curl -X POST http://localhost:3000/api/todos/1/sessions -H 'Content-Type: application/json' -d '{"tool":"claude","command":"claude --resume 019d4ebb-e7a3-79a1","workingPath":"~/ai-focus"}'`
2. Create another: `curl -X POST http://localhost:3000/api/todos/1/sessions -H 'Content-Type: application/json' -d '{"tool":"codex","command":"codex resume 019d4ebb-e7a3-79a1-90da","workingPath":"~/work/api"}'`
3. Open http://localhost:3000/todos
4. Verify sessions collapsible on card — grouped by Claude/Codex
5. Click terminal button — verify clipboard copy
6. Open edit dialog — verify sessions appear with delete
7. Delete a session — verify it removes

- [ ] **Step 2: Rebuild MCP server**

Run: `cd mcp-server && npm run build`

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "ai sessions feature: store and resume claude/codex sessions on tasks"
```
