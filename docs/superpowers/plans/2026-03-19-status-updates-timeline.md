# Status Updates Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the pattern of AI agents appending status updates into the todo description body with a dedicated StatusUpdate model, timeline drawer UI, and MCP tools+resources so agents can intelligently add and read status updates.

**Architecture:** New `StatusUpdate` model with `todoId`, `content`, optional `status` snapshot. REST API at `/api/todos/{id}/updates`. Timeline side-drawer on todo cards (mirrors contacts drawer pattern — right-side tab with Clock icon). MCP server gets `add_status_update` tool and `todo-updates://` resource URI so LLMs discover the timeline data natively. SSE event `todoUpdates` for real-time sync.

**Tech Stack:** Prisma 7, Next.js 16 API routes, React 19, React Query, Framer Motion, Zod v4, MCP SDK

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `prisma/schema.prisma` (modify) | Add `StatusUpdate` model |
| Create | `src/types/todo.ts` (modify) | Add `StatusUpdate` interface |
| Create | `src/app/api/todos/[id]/updates/route.ts` | GET (list) + POST (create) status updates |
| Create | `src/app/api/todos/[id]/updates/[updateId]/route.ts` | DELETE single update |
| Create | `src/lib/api.ts` (modify) | Add `statusUpdatesApi` client |
| Create | `src/lib/query-keys.ts` (modify) | Add `todoUpdates` key |
| Create | `src/hooks/use-status-updates.ts` | React Query hook for status updates |
| Create | `src/components/todos/status-updates-drawer.tsx` | Timeline drawer component |
| Modify | `src/components/todos/todo-item.tsx` | Add timeline tab + drawer |
| Modify | `src/app/globals.css` | Add `.todo-timeline-tab` styles |
| Create | `mcp-server/src/tools/status-updates.ts` | MCP tools: `add_status_update`, `list_status_updates` |
| Modify | `mcp-server/src/index.ts` | Register status update tools + resources |
| Modify | `mcp-server/src/types.ts` | Add `StatusUpdateResponse` type |

---

### Task 1: Database — Add StatusUpdate model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add StatusUpdate model to schema**

Add after the `TodoContact` model:

```prisma
model StatusUpdate {
  id        String   @id @default(cuid())
  content   String
  status    Status?
  todoId    String
  todo      Todo     @relation(fields: [todoId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@index([todoId])
  @@index([createdAt])
}
```

Add relation to `Todo` model (after `contacts` line):

```prisma
  statusUpdates   StatusUpdate[]
```

- [ ] **Step 2: Push schema to database**

Run: `npm run db:push`
Expected: Schema synced, no errors.

- [ ] **Step 3: Generate Prisma client**

Run: `npm run db:generate`
Expected: Client generated with `StatusUpdate` model.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "add status update model to schema"
```

---

### Task 2: TypeScript types

**Files:**
- Modify: `src/types/todo.ts`
- Modify: `mcp-server/src/types.ts`

- [ ] **Step 1: Add StatusUpdate interface to frontend types**

In `src/types/todo.ts`, add after the `TodoContact` interface:

```typescript
export interface StatusUpdate {
  id: string
  content: string
  status: Status | null
  todoId: string
  createdAt: string
}
```

- [ ] **Step 2: Add StatusUpdateResponse to MCP types**

In `mcp-server/src/types.ts`, add:

```typescript
export interface StatusUpdateResponse {
  id: string;
  content: string;
  status: string | null;
  todoId: string;
  createdAt: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types/todo.ts mcp-server/src/types.ts
git commit -m "add status update types"
```

---

### Task 3: API routes — GET + POST + DELETE

**Files:**
- Create: `src/app/api/todos/[id]/updates/route.ts`
- Create: `src/app/api/todos/[id]/updates/[updateId]/route.ts`

- [ ] **Step 1: Create GET + POST route**

Create `src/app/api/todos/[id]/updates/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'

const createSchema = z.object({
  content: z.string().min(1).max(5000),
  status: z.enum(['TODO', 'IN_PROGRESS', 'WAITING', 'UNDER_REVIEW', 'ON_HOLD', 'COMPLETED']).optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const updates = await db.statusUpdate.findMany({
    where: { todoId: id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(updates)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const data = createSchema.parse(body)

  const update = await db.statusUpdate.create({
    data: {
      todoId: id,
      content: data.content,
      status: data.status ?? null,
    },
  })
  emit('todoUpdates', { todoId: id })
  return NextResponse.json(update, { status: 201 })
}
```

- [ ] **Step 2: Create DELETE route**

Create `src/app/api/todos/[id]/updates/[updateId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; updateId: string }> }
) {
  const { id, updateId } = await params
  await db.statusUpdate.delete({
    where: { id: updateId, todoId: id },
  })
  emit('todoUpdates', { todoId: id })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Verify API works**

Start dev server if not running. Test with curl:
```bash
# Create an update (use a real todo ID from your DB)
curl -X POST http://localhost:4444/api/todos/<todoId>/updates \
  -H 'Content-Type: application/json' \
  -d '{"content":"Started working on this"}'

# List updates
curl http://localhost:4444/api/todos/<todoId>/updates
```
Expected: 201 created, then array with the update.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/todos/\[id\]/updates/
git commit -m "add status updates api routes"
```

---

### Task 4: API client + query keys

**Files:**
- Modify: `src/lib/api.ts`
- Modify: `src/lib/query-keys.ts`

- [ ] **Step 1: Add statusUpdatesApi to api.ts**

In `src/lib/api.ts`, add import for `StatusUpdate` at top:

```typescript
import type { Todo, TodoBoardResponse, TodoContact, StatusUpdate, CreateTodoInput, ... } from '@/types/todo'
```

Add after `todoContactsApi`:

```typescript
export const statusUpdatesApi = {
  list: (todoId: string): Promise<StatusUpdate[]> =>
    fetch(`/api/todos/${todoId}/updates`).then(r => json(r)),

  create: (todoId: string, data: { content: string; status?: string }): Promise<StatusUpdate> =>
    fetch(`/api/todos/${todoId}/updates`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    }).then(r => json(r)),

  remove: (todoId: string, updateId: string): Promise<{ success: boolean }> =>
    fetch(`/api/todos/${todoId}/updates/${updateId}`, { method: 'DELETE' }).then(r => json(r)),
}
```

- [ ] **Step 2: Add query key**

In `src/lib/query-keys.ts`, add:

```typescript
todoUpdates: (todoId: string) => ['todo-updates', todoId] as const,
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.ts src/lib/query-keys.ts
git commit -m "add status updates api client and query keys"
```

---

### Task 5: React Query hook

**Files:**
- Create: `src/hooks/use-status-updates.ts`

- [ ] **Step 1: Create the hook**

Create `src/hooks/use-status-updates.ts`:

```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { statusUpdatesApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import type { StatusUpdate } from '@/types/todo'

export function useStatusUpdates(todoId: string, enabled = true) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const updatesQuery = useQuery({
    queryKey: queryKeys.todoUpdates(todoId),
    queryFn: () => statusUpdatesApi.list(todoId),
    enabled,
  })

  const add = useMutation({
    mutationFn: (data: { content: string; status?: string }) =>
      statusUpdatesApi.create(todoId, data),
    onSuccess: (newUpdate) => {
      queryClient.setQueryData<StatusUpdate[]>(
        queryKeys.todoUpdates(todoId),
        (prev = []) => [newUpdate, ...prev]
      )
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add update.', variant: 'destructive' })
    },
  })

  const remove = useMutation({
    mutationFn: (updateId: string) =>
      statusUpdatesApi.remove(todoId, updateId),
    onSuccess: (_data, updateId) => {
      queryClient.setQueryData<StatusUpdate[]>(
        queryKeys.todoUpdates(todoId),
        (prev = []) => prev.filter(u => u.id !== updateId)
      )
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to remove update.', variant: 'destructive' })
    },
  })

  return {
    updates: updatesQuery.data ?? [],
    isLoading: updatesQuery.isLoading,
    addUpdate: add.mutateAsync,
    removeUpdate: remove.mutateAsync,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-status-updates.ts
git commit -m "add use-status-updates react query hook"
```

---

### Task 6: Timeline drawer component

**Files:**
- Create: `src/components/todos/status-updates-drawer.tsx`

- [ ] **Step 1: Create the drawer**

Create `src/components/todos/status-updates-drawer.tsx`. This mirrors `contacts-drawer.tsx` structure but displays a vertical timeline with an add form at the bottom.

```typescript
'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Trash2, Send } from 'lucide-react'
import { useStatusUpdates } from '@/hooks/use-status-updates'
import type { Status } from '@/types/todo'

const STATUS_LABELS: Record<Status, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  WAITING: 'Waiting',
  UNDER_REVIEW: 'Under Review',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
}

const STATUS_COLORS: Record<Status, string> = {
  TODO: 'var(--status-todo)',
  IN_PROGRESS: 'var(--status-in-progress)',
  WAITING: 'var(--status-waiting)',
  UNDER_REVIEW: 'var(--status-under-review)',
  ON_HOLD: 'var(--status-on-hold)',
  COMPLETED: 'var(--status-done)',
}

function formatTimestamp(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface StatusUpdatesDrawerProps {
  todoId: string
  open: boolean
  onClose: () => void
}

export function StatusUpdatesDrawer({ todoId, open, onClose }: StatusUpdatesDrawerProps) {
  const { updates, isLoading, addUpdate, removeUpdate } = useStatusUpdates(todoId, open)
  const [newContent, setNewContent] = React.useState('')
  const drawerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  const handleAdd = async () => {
    const text = newContent.trim()
    if (!text) return
    await addUpdate({ content: text })
    setNewContent('')
  }

  // Close on click outside
  React.useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (target.closest('.todo-timeline-tab')) return
      if (drawerRef.current && !drawerRef.current.contains(target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  React.useEffect(() => {
    if (!open) {
      setNewContent('')
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={drawerRef}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="absolute top-0 right-0 bottom-0 z-30 overflow-hidden rounded-r-lg"
          style={{
            backgroundColor: 'var(--surface)',
            borderLeft: '1px solid var(--border-color)',
            boxShadow: '-4px 0 16px rgba(0,0,0,0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full w-[280px]">
            {/* Header */}
            <div
              className="flex items-center justify-between px-3 py-1.5 border-b shrink-0"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Timeline
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-0.5 rounded transition-colors hover:bg-black/10"
              >
                <X className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {/* Timeline entries */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {isLoading && (
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Loading...</p>
              )}
              {!isLoading && updates.length === 0 && (
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>No updates yet.</p>
              )}
              {!isLoading && updates.length > 0 && (
                <div className="relative">
                  {/* Vertical line */}
                  <div
                    className="absolute left-[5px] top-2 bottom-2 w-px"
                    style={{ backgroundColor: 'var(--border-color)' }}
                  />
                  <div className="space-y-3">
                    {updates.map((update) => (
                      <div key={update.id} className="relative pl-5 group/update">
                        {/* Dot */}
                        <div
                          className="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2"
                          style={{
                            borderColor: update.status
                              ? STATUS_COLORS[update.status as Status] ?? 'var(--border-color)'
                              : 'var(--border-color)',
                            backgroundColor: update.status
                              ? STATUS_COLORS[update.status as Status] ?? 'var(--surface)'
                              : 'var(--surface)',
                          }}
                        />
                        <div className="min-w-0">
                          {/* Status badge */}
                          {update.status && (
                            <span
                              className="inline-block text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full mb-1"
                              style={{
                                backgroundColor: `color-mix(in srgb, ${STATUS_COLORS[update.status as Status] ?? 'var(--text-muted)'} 20%, transparent)`,
                                color: STATUS_COLORS[update.status as Status] ?? 'var(--text-muted)',
                              }}
                            >
                              {STATUS_LABELS[update.status as Status] ?? update.status}
                            </span>
                          )}
                          {/* Content */}
                          <p className="text-[11px] leading-relaxed break-words" style={{ color: 'var(--text-primary)' }}>
                            {update.content}
                          </p>
                          {/* Timestamp + delete */}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              {formatTimestamp(update.createdAt)}
                            </span>
                            <button
                              onClick={() => removeUpdate(update.id)}
                              className="p-0.5 rounded opacity-0 group-hover/update:opacity-100 transition-opacity"
                              title="Remove update"
                            >
                              <Trash2 className="h-2.5 w-2.5" style={{ color: 'var(--destructive)' }} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Add update */}
            <div
              className="px-3 py-2 border-t shrink-0"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex gap-1.5">
                <textarea
                  ref={inputRef}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Add an update..."
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd()
                  }}
                  className="flex-1 text-[11px] rounded px-2 py-1.5 bg-transparent border outline-none resize-none"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
                <button
                  onClick={handleAdd}
                  disabled={!newContent.trim()}
                  className="self-end p-1.5 rounded disabled:opacity-30 transition-colors"
                  style={{ color: 'var(--primary)' }}
                  title="Add update (⌘+Enter)"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/todos/status-updates-drawer.tsx
git commit -m "add status updates timeline drawer component"
```

---

### Task 7: Integrate drawer into TodoItem

**Files:**
- Modify: `src/components/todos/todo-item.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add CSS for timeline tab**

In `src/app/globals.css`, after the `.todo-note-tab-active` block (~line 649), add:

```css
/* Timeline drawer tab */
.todo-timeline-tab {
  background-color: var(--surface-2);
  color: color-mix(in srgb, var(--text-muted) 40%, transparent);
}
.todo-timeline-tab:hover {
  color: var(--primary);
}
.todo-timeline-tab-active {
  color: var(--primary);
}
```

- [ ] **Step 2: Add imports to todo-item.tsx**

Add `Clock` to the lucide-react import (it's already imported — verify). Add the drawer import:

```typescript
import { StatusUpdatesDrawer } from '@/components/todos/status-updates-drawer'
```

- [ ] **Step 3: Add state + drawer + tab to TodoItem component**

In the `TodoItem` function (~line 903), add state next to `contactsOpen`:

```typescript
const [timelineOpen, setTimelineOpen] = React.useState(false)
```

**Mutual exclusion:** When one drawer opens, close the other. Update the contacts tab onClick and the timeline tab onClick to close the other:

```typescript
// Contacts tab onClick becomes:
onClick={(e) => { e.stopPropagation(); setContactsOpen(prev => !prev); setTimelineOpen(false) }}

// Timeline tab onClick:
onClick={(e) => { e.stopPropagation(); setTimelineOpen(prev => !prev); setContactsOpen(false) }}
```

Inside the card `<div>` (after `<ContactsDrawer .../>` at ~line 1013), add:

```typescript
<StatusUpdatesDrawer
  todoId={todo.id}
  open={timelineOpen}
  onClose={() => setTimelineOpen(false)}
/>
```

After the contacts side tab button (~line 1028), add a second tab:

```typescript
{/* Side tab — timeline */}
{!dragging && (
  <button
    onClick={(e) => { e.stopPropagation(); setTimelineOpen(prev => !prev) }}
    className={cn(
      'todo-timeline-tab flex-shrink-0 self-stretch w-5 flex items-center justify-center transition-all duration-150',
      timelineOpen && 'todo-timeline-tab-active'
    )}
    title="Timeline"
  >
    <Clock className="h-3 w-3" />
  </button>
)}
```

**Important:** The contacts tab currently has `rounded-r-lg`. Now that there are two tabs, contacts tab should NOT have `rounded-r-lg` — only the last tab (timeline) gets `rounded-r-lg`. Update the contacts tab className to remove `rounded-r-lg`, and add `rounded-r-lg` to the timeline tab.

- [ ] **Step 4: Verify in browser**

Open the app. Each todo card should now have two narrow side tabs on the right: Users icon (contacts) and Clock icon (timeline). Clicking the clock tab should open a 280px drawer with the timeline.

- [ ] **Step 5: Commit**

```bash
git add src/components/todos/todo-item.tsx src/app/globals.css
git commit -m "integrate timeline drawer into todo cards"
```

---

### Task 8: SSE integration for real-time sync

**Files:**
- Modify: `src/hooks/use-sse.ts`

- [ ] **Step 1: Add todoUpdates to SSE handler**

Read `src/hooks/use-sse.ts` and add `todoUpdates` to the entity invalidation mapping. It should invalidate the `['todo-updates']` query key prefix when a `todoUpdates` event is received — similar to how `todoContacts` is handled.

The SSE hook likely has an entity→queryKey map. Add:

```typescript
todoUpdates: (payload) => queryClient.invalidateQueries({
  queryKey: ['todo-updates', payload?.todoId]
})
```

(Adapt to match the existing pattern in the file.)

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-sse.ts
git commit -m "add sse invalidation for status updates"
```

---

### Task 9: MCP server — tools + resources

**Files:**
- Create: `mcp-server/src/tools/status-updates.ts`
- Modify: `mcp-server/src/index.ts`

- [ ] **Step 1: Create status updates tools file**

Create `mcp-server/src/tools/status-updates.ts`:

```typescript
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  apiFetch,
  textResult,
  isApiError,
  toHtml,
  resolveTodoId,
} from "../helpers.js";
import type { StatusUpdateResponse } from "../types.js";

export function registerStatusUpdateTools(server: McpServer) {
  // --- Tool: add a status update to a todo's timeline ---
  server.tool(
    "add_status_update",
    `Add a status update to a todo's timeline. Use this to log progress, blockers, decisions, or any notable event for a task.

This is the PREFERRED way to record progress on a task — do NOT append status updates to the todo description. The timeline is purpose-built for chronological updates.

Examples:
- "Started investigating the auth bug, found the issue in token validation"
- "Blocked on PR review from platform team"
- "Deployed to staging, running smoke tests"`,
    {
      taskNumber: z.number().int().positive().optional().describe("The task number (e.g. 7)"),
      id: z.string().optional().describe("The todo cuid (use taskNumber instead when possible)"),
      content: z
        .string()
        .min(1)
        .max(5000)
        .describe("The update text — what happened, what's the current state, any blockers"),
      status: z
        .enum(["TODO", "IN_PROGRESS", "WAITING", "UNDER_REVIEW", "ON_HOLD", "COMPLETED"])
        .optional()
        .describe("Optionally set the todo's status at the same time as adding this update"),
    },
    async ({ taskNumber, id, content, status }) => {
      const resolved = await resolveTodoId({ taskNumber, id });
      if ("error" in resolved) return resolved.error;

      // If status change requested, update the todo first
      if (status) {
        const key = taskNumber?.toString() ?? resolved.resolvedId;
        const todoUpdate = await apiFetch(`/api/todos/${key}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        if (isApiError(todoUpdate)) return textResult(todoUpdate);
      }

      const data = await apiFetch(`/api/todos/${resolved.resolvedId}/updates`, {
        method: "POST",
        body: JSON.stringify({ content, status: status ?? undefined }),
      });
      return textResult(data);
    }
  );

  // --- Tool: list status updates ---
  server.tool(
    "list_status_updates",
    "List all status updates for a todo, newest first. Use this to review the history/timeline of a task.",
    {
      taskNumber: z.number().int().positive().optional().describe("The task number (e.g. 7)"),
      id: z.string().optional().describe("The todo cuid (use taskNumber instead when possible)"),
    },
    async ({ taskNumber, id }) => {
      const resolved = await resolveTodoId({ taskNumber, id });
      if ("error" in resolved) return resolved.error;

      const data = await apiFetch(`/api/todos/${resolved.resolvedId}/updates`);
      if (isApiError(data)) return textResult(data);

      const updates = data as StatusUpdateResponse[];
      if (updates.length === 0) return textResult("No status updates yet.");

      const formatted = updates
        .map((u) => {
          const date = new Date(u.createdAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });
          const statusTag = u.status ? ` [${u.status}]` : "";
          return `${date}${statusTag}: ${u.content}`;
        })
        .join("\n");
      return { content: [{ type: "text" as const, text: formatted }] };
    }
  );

  // --- Resource: todo timeline (so LLMs can read timeline data via resource URI) ---
  server.resource(
    "todo-updates",
    new ResourceTemplate("todo-updates://{todoId}", { list: undefined }),
    {
      description: "Timeline of status updates for a todo. Provides chronological progress history.",
      mimeType: "text/plain",
    },
    async (uri, variables) => {
      const todoId = variables.todoId as string;
      const data = await apiFetch(`/api/todos/${todoId}/updates`);
      if (isApiError(data)) {
        return {
          contents: [{ uri: uri.href, mimeType: "text/plain", text: `Error: ${(data as { message: string }).message}` }],
        };
      }
      const updates = data as StatusUpdateResponse[];
      if (updates.length === 0) {
        return {
          contents: [{ uri: uri.href, mimeType: "text/plain", text: "No status updates yet." }],
        };
      }
      const text = updates
        .map((u) => {
          const date = new Date(u.createdAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });
          const statusTag = u.status ? ` [${u.status}]` : "";
          return `${date}${statusTag}: ${u.content}`;
        })
        .join("\n");
      return {
        contents: [{ uri: uri.href, mimeType: "text/plain", text }],
      };
    }
  );
}
```

- [ ] **Step 2: Register in index.ts**

In `mcp-server/src/index.ts`, add import:

```typescript
import { registerStatusUpdateTools } from "./tools/status-updates.js";
```

Add registration call after `registerStatsTools(server);`:

```typescript
registerStatusUpdateTools(server);
```

- [ ] **Step 3: Build MCP server**

Run: `cd mcp-server && npm run build`
Expected: No TypeScript errors, compiles clean.

- [ ] **Step 4: Commit**

```bash
git add mcp-server/src/tools/status-updates.ts mcp-server/src/index.ts mcp-server/src/types.ts
git commit -m "add mcp tools and resource for status updates"
```

---

### Task 10: Update MCP update_todo to guide agents toward timeline

**Files:**
- Modify: `mcp-server/src/tools/todos.ts`

- [ ] **Step 1: Update update_todo description**

In `mcp-server/src/tools/todos.ts`, update the `update_todo` tool description (line 108) to add guidance about the timeline:

Replace the current description with:

```
Update an existing todo. Supports changing any field: title, description, status, priority, labels, subtasks, PRs, etc.

IMPORTANT — Status updates and progress notes:
- Do NOT append status/progress updates to the description. Use add_status_update instead — it logs to the todo's dedicated timeline.
- The description field is for the task's static context/requirements, not a running log.

Description handling:
- By default, descriptionMode is "append" which ADDS to the existing description (preserving all prior content).
- Use descriptionMode "replace" ONLY when the user explicitly asks to overwrite/replace the entire description.
- When appending, the new text is added below the existing content with a date separator.
- Use get_todo first if you need to see the current description.
```

- [ ] **Step 2: Build MCP server**

Run: `cd mcp-server && npm run build`
Expected: Clean compile.

- [ ] **Step 3: Commit**

```bash
git add mcp-server/src/tools/todos.ts
git commit -m "update mcp update_todo to guide agents toward timeline"
```

---

### Task 11: Final verification

- [ ] **Step 1: Open the app in browser**

Navigate to the todos page. Verify:
- Each active todo card has two side tabs (Users + Clock icons)
- Clicking Clock opens the timeline drawer (280px, slides from right)
- The drawer shows "No updates yet." for cards without updates
- You can type an update and submit with Cmd+Enter or the send button
- Updates appear in the timeline with relative timestamps
- Hovering an entry shows a delete button
- Click outside or X closes the drawer
- Contacts drawer still works independently

- [ ] **Step 2: Test MCP tools**

Test the MCP server tools work by using them from a Claude/Codex session:
- `add_status_update` with a taskNumber and content
- `list_status_updates` for that same task
- Verify the update appears in the UI timeline immediately (SSE)

- [ ] **Step 3: Final commit if any fixes needed**
