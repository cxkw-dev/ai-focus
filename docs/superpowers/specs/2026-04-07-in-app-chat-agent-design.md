# In-App Chat Agent — Design

**Date:** 2026-04-07
**Status:** Drafted, awaiting user review

## 1. Scope

Four bundled changes shipping as a single feature:

1. **Remove the Compact/Comfortable density toggle** from the todos page. The user does not use it; "Show blocked" stays.
2. **Relocate the Ollama status pill** from the page `Header` (top-right) to the `Sidebar` (bottom-left, above the existing bottom nav group near Settings).
3. **Add a chat drawer** triggered from the page header. The drawer slides in from the right edge, supports multi-conversation threads (notebook-style), persists to Postgres, and runs a TanStack AI chat agent backed by Ollama. The agent has full CRUD parity with the existing MCP server's tool surface, with an in-UI confirmation step gating destructive operations.
4. **Switch the default Ollama model** from `gemma3:latest` to `gemma4:latest`. This affects both the new chat agent and the existing accomplishment-evaluation agent.

The standalone `mcp-server/` package is **untouched**. It keeps working for Codex/Claude Code as before. The new in-app agent runs in parallel and shares the same REST API surface as its tool implementation layer.

## 2. Non-goals

- Multi-user / authentication. The app is single-user; the chat history has no `userId`.
- Image attachments, voice input, file uploads. Text-only chat.
- Cross-thread search, full-text search of chat history. Threads list sorts by recency only.
- A standalone `/chat` page. Chat lives in a drawer.
- Refactoring REST routes to extract shared business logic into pure functions. The duplication between the in-app agent tools and `mcp-server/src/tools/*.ts` is acknowledged and accepted; both layers call the same REST API.
- Replacing the existing MCP server. It continues to serve external CLI clients independently.

## 3. Architectural decisions

### 3.1 How the agent's tools talk to the app: REST hops

Each TanStack AI tool implementation makes an internal `fetch('http://localhost:4444/api/...')` call to the app's existing REST routes, mirroring how `mcp-server/src/helpers.ts:apiFetch` works today.

**Rationale.** The REST routes already perform validation, side effects (`emit('todos')` for SSE cache invalidation), `taskNumber → cuid` resolution, the accomplishment-agent trigger on `COMPLETED` status, and archive-with-undo behavior. Calling Prisma directly (TanStack AI's documented idiom for tool implementations) would skip all of this and require reimplementing it in the tool layer. The most surgical fix is to keep the API layer as the side-effect substrate and have both surfaces (REST UI clients, the new in-app agent, the standalone MCP server) treat it as the source of truth.

The cost is a duplicated set of zod input schemas across `src/lib/agent-tools/` and `mcp-server/src/tools/`. This is accepted as the lesser evil compared to either (a) refactoring side-effect logic out of route handlers into shared functions, or (b) bridging the stdio MCP server back into the Next.js process via subprocess.

### 3.2 Data persistence: multi-thread, server-stored

Chat history persists to Postgres via two new Prisma models (`ChatThread`, `ChatMessage`). Threads are listed in a sidebar inside the drawer, can be revisited, renamed, and deleted. Single-user, no auth, no `userId` column.

### 3.3 Tool surface: full parity with the MCP server

All 41 tools currently exposed by `mcp-server/src/tools/*.ts` are mirrored in the in-app agent. Destructive operations (delete, archive, remove) are gated behind an in-chat confirmation card.

### 3.4 Streaming framework: TanStack AI

Per the user's stated requirement, the agent is built on `@tanstack/ai` (core), `@tanstack/ai-ollama` (provider adapter), and `@tanstack/ai-react` (`useChat` hook). Server route uses `chat({...}) → toServerSentEventsResponse(...)`. Client renders via `useChat` with `fetchServerSentEvents`.

## 4. Data model (Prisma)

```prisma
model ChatThread {
  id        String        @id @default(cuid())
  title     String        // auto-generated from first turn, user-editable
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  messages  ChatMessage[]

  @@index([updatedAt])
}

model ChatMessage {
  id         String     @id @default(cuid())
  threadId   String
  thread     ChatThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  role       ChatRole
  content    String     // text body; for tool messages, JSON-stringified result
  toolCalls  Json?      // assistant turns: [{id, name, arguments}] when LLM requests tools
  toolCallId String?    // tool turns: links result back to the call that produced it
  createdAt  DateTime   @default(now())

  @@index([threadId, createdAt])
}

enum ChatRole {
  USER
  ASSISTANT
  TOOL
  SYSTEM
}
```

**Migration:** `npm run db:push` per the project's Prisma 7 conventions.

**Title generation:** After the first assistant turn in a thread, fire a one-shot `gemma4:latest` Ollama call (~10 tokens, prompt: "Summarize this conversation in 4-6 words, no quotes") and `PATCH` the thread title. Fire-and-forget; the chat response does not wait on it. Threads start as `"New chat"`.

## 5. API surface

All routes live under `src/app/api/chat/`.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/chat/threads` | Create empty thread |
| `GET` | `/api/chat/threads` | List threads sorted by `updatedAt DESC` (returns `id, title, updatedAt, messageCount`) |
| `GET` | `/api/chat/threads/:id` | Get one thread + ordered messages |
| `PATCH` | `/api/chat/threads/:id` | Inline rename (`{ title }`) |
| `DELETE` | `/api/chat/threads/:id` | Delete thread (cascades messages) |
| `POST` | `/api/chat/threads/:id/messages` | Streaming chat endpoint — accepts new user message, runs TanStack AI agent loop, streams SSE response |
| `POST` | `/api/chat/threads/:id/confirm-tool` | Resume the agent loop after the user confirms or cancels a destructive tool call |

### 5.1 Streaming chat route shape

```ts
// src/app/api/chat/threads/[id]/messages/route.ts
import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { ollamaText } from '@tanstack/ai-ollama'
import { db } from '@/lib/db'
import { agentTools, AGENT_SYSTEM_PROMPT } from '@/lib/agent-tools'
import { persistOnComplete, toAgentMessages } from '@/lib/agent-tools/streaming'

export const runtime = 'nodejs'  // not edge — needs Prisma + node fetch + child fetch to localhost

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: threadId } = await params
  const { message } = await req.json()

  // This route handles new user messages only. Resumption after a destructive-tool
  // confirmation goes through POST /api/chat/threads/:id/confirm-tool, which does
  // not insert a USER row.
  await db.chatMessage.create({
    data: { threadId, role: 'USER', content: message },
  })

  const history = await db.chatMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' },
  })

  const stream = chat({
    adapter: ollamaText(process.env.OLLAMA_MODEL ?? 'gemma4:latest'),
    messages: toAgentMessages(history),
    tools: agentTools,
    system: AGENT_SYSTEM_PROMPT(new Date()),
  })

  return toServerSentEventsResponse(persistOnComplete(stream, threadId))
}
```

### 5.2 `persistOnComplete` wrapper

A small helper that wraps the TanStack AI stream, forwards every chunk untouched to the SSE response, and on stream completion writes the assistant's final message(s) + tool calls + tool results into `ChatMessage` rows. Also bumps `ChatThread.updatedAt` and triggers fire-and-forget title synthesis on the first assistant turn.

**Risk:** The exact event shape TanStack AI emits for "stream finished, here's the final structured message list" must be confirmed during implementation. Fallback: a `transformStream` that buffers canonical messages alongside SSE forwarding.

**Risk:** If the SSE stream is interrupted mid-turn (browser closes, network drop), the assistant turn will not be fully persisted. Mitigation: persist incrementally on each significant boundary (each delta chunk past a threshold), not only on completion.

### 5.3 Cross-tab cache invalidation

After the assistant turn completes, the route inspects which tools ran and emits the corresponding domain events (`emit('todos')`, `emit('labels')`, etc.) via `src/lib/events.ts` so other open tabs refresh through the existing SSE system. This is layered on top of the SSE emits the REST routes themselves perform.

## 6. Agent tool catalog

`src/lib/agent-tools/` mirrors `mcp-server/src/tools/` one-to-one.

```
src/lib/agent-tools/
├── index.ts           # exports `agentTools`, `AGENT_SYSTEM_PROMPT`
├── helpers.ts         # apiFetch, resolveKey, formatTodoSummary (mirrors mcp-server/src/helpers.ts)
├── streaming.ts       # persistOnComplete, toAgentMessages
├── todos.ts           # 12 tools
├── labels.ts          # 4 tools
├── notebook.ts        # 7 tools
├── people.ts          # 4 tools
├── contacts.ts        # 3 tools
├── accomplishments.ts # 4 tools
├── status-updates.ts  # 2 tools
├── sessions.ts        # 2 tools
├── azure.ts           # 2 tools
└── stats.ts           # 1 tool
```

### 6.1 Tool inventory (41 tools)

| Module | Tools |
|---|---|
| **todos** | `list_todos`, `get_todo`, `create_todo`, `update_todo`, `delete_todo`, `archive_todo`, `restore_todo`, `complete_todo`, `start_todo`, `search_todos`, `toggle_subtask`, `reorder_todos` |
| **labels** | `list_labels`, `create_label`, `update_label`, `delete_label` |
| **notebook** | `list_notes`, `get_note`, `create_note`, `update_note`, `delete_note`, `get_scratchpad`, `update_scratchpad` |
| **people** | `list_people`, `create_person`, `update_person`, `delete_person` |
| **contacts** | `list_todo_contacts`, `add_todo_contact`, `remove_todo_contact` |
| **accomplishments** | `list_accomplishments`, `create_accomplishment`, `update_accomplishment`, `delete_accomplishment` |
| **status updates** | `add_status_update`, `list_status_updates` |
| **sessions** | `add_session`, `remove_session` |
| **azure** | `get_azure_work_item_context`, `get_todo_execution_context` |
| **stats** | `get_year_stats` |

Each tool is a `toolDefinition().server()` whose implementation makes a single internal `fetch` to the matching REST endpoint. Input zod schemas are duplicated from `mcp-server/src/tools/*.ts`. The `taskNumber → cuid` resolver and `formatTodoSummary` are duplicated from `mcp-server/src/helpers.ts`.

### 6.2 Destructive-tool gating

Destructive tools are flagged with metadata:

```ts
const DESTRUCTIVE_TOOLS = new Set([
  'delete_todo', 'delete_label', 'delete_note',
  'delete_person', 'delete_accomplishment',
  'archive_todo',
  'remove_todo_contact', 'remove_session',
])
```

When the LLM calls one of these tools, the server-side implementation **does not** execute the operation immediately. Instead it returns a sentinel:

```ts
{
  pending: true,
  action: 'delete_todo',
  args: { taskNumber: 7 },
  summary: "Delete todo #7 'Fix login bug'?",
}
```

**Suspend-and-resume mechanism.** The flow is two HTTP requests, not one long-lived stream:

1. The original `POST /api/chat/threads/:id/messages` SSE stream runs the agent loop until a destructive tool returns the `pending` sentinel. At that point, the route:
   - Persists the assistant message (with its `toolCalls` array) and a `TOOL` message containing the sentinel as content.
   - Persists a stream-state row (see below) capturing where the agent loop was paused.
   - Emits a final SSE event `event: tool-confirmation-required` carrying the proposed action and the deferred `toolCallId`.
   - Closes the SSE stream cleanly. The client's `useChat` reads this as the end of the assistant turn and renders the inline confirmation card.

2. The user clicks **Confirm** or **Cancel** in `chat-confirmation-card`. This triggers `POST /api/chat/threads/:id/confirm-tool` with `{ toolCallId, decision: 'confirm' | 'cancel' }`. This endpoint **opens a fresh SSE stream**:
   - **Confirm** → server executes the previously deferred operation, persists its real result as the `TOOL` message (overwriting the sentinel content), and starts a new TanStack AI `chat()` call seeded with the full thread history (now including the real tool result) so the LLM continues from where it paused.
   - **Cancel** → server replaces the sentinel `TOOL` content with `{ cancelled: true, reason: 'User declined' }` and starts a new `chat()` call so the LLM can react (e.g. apologize, offer alternatives).

**Stream-state row.** A new lightweight column on `ChatMessage` is *not* needed. The "paused" state is fully recoverable from the message history alone: an assistant message whose latest `toolCalls` entry has a matching `TOOL` message with `content` parseable as `{ pending: true, ... }` is the resumption point. The `confirm-tool` endpoint replays history into TanStack AI starting from there.

**Implementation note:** TanStack AI's documented auto-execution loop does not natively expose a human-in-the-loop interrupt-and-resume primitive. The deferred-execution mechanism above is implemented at the tool-implementation layer of *this* app. If TanStack AI exposes a more idiomatic primitive when this is implemented, we switch to it and note the change in the implementation plan.

### 6.3 System prompt

```
You are a helpful assistant inside the AI Focus productivity app, a personal
todo/notes/people tracker. The user is the sole owner of this data.

You have tools for reading and modifying todos, labels, notes (notebook + scratchpad),
people, accomplishments, status updates, sessions, and Azure work item context.

Guidelines:
- Prefer reading before writing. When asked to update something, look it up first
  unless the user gave you the exact taskNumber.
- When you need to identify a todo, use its taskNumber (e.g. "task 7") in your
  responses to the user — it's how the user thinks about them.
- For destructive actions (delete, archive, remove), call the tool and trust that
  the system will ask the user to confirm. Do not ask the user yourself first;
  the confirmation UI handles that.
- Be concise. Don't narrate every step. The user can see tool calls in the UI.
- If you're not sure what the user means, ask one clarifying question rather
  than guessing.

Current date: {TODAY}
```

`{TODAY}` is interpolated server-side per request as an ISO date so the model has accurate temporal context for `dueDate` and date-filtered queries.

## 7. UI changes

### 7.1 Remove Compact/Comfortable

Files touched:
- `src/app/(dashboard)/todos/page.tsx` — delete the `compact` state and `toggleCompact` callback (`:53-64`), the toggle button JSX (`:288-310`), the `Rows3` import, and the `compact` props passed to `TodoColumn`.
- `src/components/todos/todo-column.tsx` — drop `compact` from `TodoColumnProps` and stop forwarding it.
- `src/components/todos/todo-item.tsx` — drop the `compact` prop and any conditional density styling it gates.
- Grep `compact` and `ai-focus-compact-mode` to catch tests, hooks, and stragglers.

The `Show blocked` button at `src/app/(dashboard)/todos/page.tsx:268-287` is left untouched.

### 7.2 Relocate Ollama status to sidebar

Files touched:
- `src/components/layout/header.tsx` — delete the `OllamaStatus` component (`:21-88`), its `useOllamaStatus` import, and the `<OllamaStatus />` render at `:126`. The header `actions` slot is now free.
- `src/components/layout/sidebar.tsx` — render a new Ollama status block immediately above the existing `bottomNavItems` `<nav>` (`:238`). Uses the same `useOllamaStatus` hook and the same green/red dot pattern. Two variants:
  - **Collapsed sidebar:** dot indicator only, wrapped in a Tooltip showing `model • connected/unreachable • url`. Matches the timesheet button's collapsed treatment at `:218-227`.
  - **Expanded sidebar:** full pill (dot + model name) styled to match bottom-nav row height.
- Pill remains clickable to refetch (preserving today's behavior in `header.tsx:40`).

### 7.3 Chat drawer

```
src/components/chat/
├── chat-drawer.tsx              # Sheet container (Radix dialog), slides from right
├── chat-thread-sidebar.tsx      # Past threads list inside the drawer (left rail)
├── chat-message-list.tsx        # Scrollable, auto-scroll on new
├── chat-message.tsx             # Renders user / assistant / tool messages
├── chat-tool-call.tsx           # Inline tool-call card, collapsed by default
├── chat-confirmation-card.tsx   # Inline confirm/cancel for destructive tools
├── chat-input.tsx               # Textarea + send button, enter-to-send
└── chat-trigger-button.tsx      # Header button that opens the drawer
```

**Container:** built on `@radix-ui/react-dialog` (already installed). Width `420px` desktop, full-width mobile. Internal two-pane layout: 160px-wide thread sidebar on the left (collapsible on narrow screens) + active conversation on the right.

**Hooks:**
- `src/hooks/use-chat-threads.ts` — React Query wrapper around `/api/chat/threads` CRUD with optimistic updates for rename and delete.
- `src/hooks/use-chat-messages.ts` — wraps `@tanstack/ai-react`'s `useChat` configured with `fetchServerSentEvents('/api/chat/threads/:id/messages')`. Hydrates initial messages from `GET /api/chat/threads/:id` so revisiting a past thread loads its history.
- `src/hooks/use-chat-drawer.ts` — small React context for `{ isOpen, activeThreadId, openDrawer, closeDrawer, setActiveThread }`. Mounted at the dashboard layout level so the trigger (header) and drawer (layout root) can share state.

**Drawer trigger button:** the standalone `chat-trigger-button.tsx` component is imported by `src/components/layout/header.tsx` and rendered in its `actions` slot, replacing the deleted `<OllamaStatus />`. The component is an icon button (`MessageSquare` from lucide) with a small dot indicator in the corner showing Ollama connection state (pulled from `useOllamaStatus`) so reachability is visible at a glance. Clicking it calls `openDrawer()` from `useChatDrawer`.

**Confirmation flow rendering:** when a `tool-confirmation-required` SSE event arrives, the message list injects a synthetic "confirmation pending" entry at the position of the tool call. `chat-confirmation-card` renders inline with **Confirm** / **Cancel** buttons. Integration with `useChat` may require subscribing to the raw SSE stream alongside it; exact mechanism depends on what `@tanstack/ai-react` exposes and is finalized in the implementation plan.

**Markdown rendering:** assistant text rendered through `react-markdown`. Code blocks reuse the existing `lowlight` install for syntax highlighting.

## 8. Model configuration

Default model switches from `gemma3:latest` to `gemma4:latest`.

Files touched:
- `src/app/api/ollama/route.ts:4` — `OLLAMA_MODEL` default.
- `src/lib/accomplishment-agent.ts:5` — `OLLAMA_MODEL` default.
- `.env.example` (if present) — document the new default.

The new chat agent reads the same `OLLAMA_MODEL` env var, so a single env change covers all three callers (chat agent, accomplishment agent, status pill).

## 9. Dependencies

```
npm install @tanstack/ai @tanstack/ai-ollama @tanstack/ai-react react-markdown
```

## 10. Testing

**Unit (vitest):**
- `src/lib/agent-tools/helpers.ts` — taskNumber resolution, formatting helpers.
- `src/lib/agent-tools/streaming.ts` — `persistOnComplete` wrapper against a mocked TanStack AI stream, asserting DB writes on completion.
- Tool catalog smoke test — every tool in `agentTools` has a non-empty description and a parseable zod input schema.

**Integration:**
- A single end-to-end test that boots a fake Ollama responder (returning a canned tool-call → tool-result → final-text sequence), spins up the chat route, and asserts the resulting `ChatMessage` rows match expectations.

**Manual smoke checklist** (in the implementation plan, not the spec):
- Open drawer from header button.
- Start new chat → ask "list my todos" → verify `list_todos` tool runs and assistant summarizes.
- Ask "create a task called X with priority high" → verify task appears in todos page (cross-tab via SSE).
- Ask "delete task N" → verify confirmation card appears → cancel works → confirm runs the delete.
- Reload page mid-conversation → reopen drawer → verify thread persists.
- Create second thread → verify it appears in thread sidebar → switch back to first thread.
- Rename a thread → verify persistence.
- Delete a thread → verify cascade delete of messages.
- Toggle sidebar collapse → verify Ollama status pill collapses to dot-only.
- Verify Compact button is gone from todos page; Show blocked still works.

## 11. Risks

1. **TanStack AI confirmation interrupt is not idiomatic.** Documented in §6.2. Mitigation: implement at the tool-implementation layer; revisit if their API exposes a primitive.
2. **Streaming persistence completeness.** §5.2. Mitigation: incremental persistence on chunk boundaries, not only on stream completion.
3. **`gemma4:latest` tool-calling fidelity.** Smaller local models can hallucinate tool args. Mitigation: server-side zod validation on every tool input; validation errors surface back to the model so it can self-correct on the next turn.
4. **Tool schema drift between `mcp-server/` and `src/lib/agent-tools/`.** Mitigation: a note in `CLAUDE.md` that any tool change must touch both layers. Long-term: extract a shared package if the maintenance pain becomes real.
5. **Removing Compact mode is destructive of preference state.** Mitigation: user explicitly does not use it; the `localStorage("ai-focus-compact-mode")` key becomes orphaned but causes no breakage.

## 12. Out of scope (explicit YAGNI list)

- Token streaming visible at the character level (TanStack AI handles this; no extra work).
- Multi-model selector in the chat UI. If the user wants `gemma3:latest` they edit the env var.
- Chat export / import.
- Voice / image input.
- Sharing threads.
- Per-thread tool restrictions.
- Chat history search.
- Auth, permissions, audit log.
