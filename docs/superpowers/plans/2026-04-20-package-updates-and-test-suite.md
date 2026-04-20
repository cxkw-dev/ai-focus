# Package Updates + Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing vitest suite with tier 1+2+3 coverage, bump every outdated package to latest (including three majors), exclude tests from the Docker build context, and redeploy.

**Architecture:** Tests are colocated with source under `src/**/*.test.{ts,tsx}`. A new `src/test/` folder holds shared helpers: a typed `db` mock, a `QueryClient` wrapper, and a `Request` factory. Prisma, the SSE emit, and side-effect agents are mocked per route-test file at module scope via `vi.mock`. Updates run in risk-ordered phases; every phase gate is `npm run validate`.

**Tech Stack:** Vitest 4 + @testing-library/react 16 + @testing-library/jest-dom + jsdom (all pre-installed). No new test libraries added.

---

## Orientation (read before starting any task)

**Prisma client export.** The client is exported as `db` from `@/lib/db` (not `prisma`). Every route that touches the DB imports `import { db } from '@/lib/db'`. Mocks MUST preserve this export name.

**Existing tests (do not modify):** `src/lib/{labels,review-focus-flow,subtask-commit,todo-board}.test.ts`, `src/lib/server/todo-response.test.ts`, `src/lib/validation/{label,todo}.test.ts`, `src/components/layout/sidebar.test.tsx`, `src/components/todos/{billing-codes-drawer,session-list}.test.tsx`.

**Current baseline:** `npm test` → 10 files, 35 tests, ~2.5s. This MUST stay green throughout.

**Commit rules (from `CLAUDE.md`):** All commit messages lowercase. No AI attribution. No Co-authored-by. Push directly to `main` after each commit unless the user says otherwise — for this plan, do NOT push until phase 6 is complete; push once at the end.

**Validation gate.** `npm run validate` = format:check + lint + test + build. This is the gate at every phase. Do not skip the build step — the app must still compile.

**Lint-staged / Husky.** The repo has a pre-commit hook that runs eslint + prettier on staged files. If it blocks a commit, fix the underlying issue and create a NEW commit (never `--amend`, never `--no-verify`).

**Route structure notes for API tests:**

- Dynamic-segment handlers receive `{ params: Promise<{ id: string }> }` — must be passed a `Promise` that resolves.
- `/api/note/` uses **`PUT`**, not `PATCH`. Its schema is inline in the route file (no shared helper).
- Most other mutating routes use the shared `parseJsonBody(request, schema)` which calls `request.json()` then `schema.parse()`.
- Routes call `emit('todos' | 'labels' | 'notebook' | ...)` after successful mutations — mock `@/lib/events` to suppress.
- `/api/todos` POST also calls `evaluateAccomplishment(...)` from `@/lib/accomplishment-agent` when status is `COMPLETED` — mock this module.

---

## Phase 0 — Preflight

### Task 0.1: Confirm baseline is green

**Files:** none (read-only)

- [ ] **Step 1: Run full validate**

```bash
npm run validate
```

Expected: exits 0. Tests: 35 passed. Build: succeeds.

- [ ] **Step 2: Record baseline package versions**

```bash
npm outdated > /tmp/baseline-outdated.txt || true
```

This captures the "before" state for reference. Move on.

---

## Phase 1 — Shared test helpers

Build the three shared helpers first so later test tasks are one-liners.

### Task 1.1: Create the Prisma mock helper

**Files:**

- Create: `src/test/db-mock.ts`

- [ ] **Step 1: Write the helper**

```ts
// src/test/db-mock.ts
import { vi } from 'vitest'

type MockMethods =
  | 'findMany'
  | 'findFirst'
  | 'findUnique'
  | 'findUniqueOrThrow'
  | 'create'
  | 'createMany'
  | 'update'
  | 'upsert'
  | 'delete'
  | 'deleteMany'
  | 'count'

type MockModel = Record<MockMethods, ReturnType<typeof vi.fn>>

function makeModel(): MockModel {
  return {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
  }
}

export const dbMock = {
  todo: makeModel(),
  subtask: makeModel(),
  label: makeModel(),
  billingCode: makeModel(),
  note: makeModel(),
  notebookNote: makeModel(),
  person: makeModel(),
  todoContact: makeModel(),
  session: makeModel(),
  statusUpdate: makeModel(),
  accomplishment: makeModel(),
  $transaction: vi.fn(async (arg: unknown) => {
    if (typeof arg === 'function') {
      return (arg as (tx: typeof dbMock) => unknown)(dbMock)
    }
    if (Array.isArray(arg)) {
      return Promise.all(arg)
    }
    return arg
  }),
}

export function resetDbMock() {
  for (const model of Object.values(dbMock)) {
    if (typeof model === 'function') continue
    for (const fn of Object.values(model as Record<string, unknown>)) {
      if (typeof (fn as { mockReset?: () => void }).mockReset === 'function') {
        ;(fn as { mockReset: () => void }).mockReset()
      }
    }
  }
  dbMock.$transaction.mockClear()
  dbMock.$transaction.mockImplementation(async (arg: unknown) => {
    if (typeof arg === 'function') {
      return (arg as (tx: typeof dbMock) => unknown)(dbMock)
    }
    if (Array.isArray(arg)) return Promise.all(arg)
    return arg
  })
}
```

Notes:

- `$transaction` is a `vi.fn` whose default impl calls the callback with the mock itself, so route code that uses `db.$transaction(async (tx) => tx.todo.create(...))` works without ceremony.
- Models added later (if a route touches one not listed) can be appended trivially — no breaking change.

- [ ] **Step 2: Commit**

```bash
git add src/test/db-mock.ts
git commit -m "add shared db mock helper for api route tests"
```

### Task 1.2: Create the React Query test wrapper

**Files:**

- Create: `src/test/react-query.tsx`

- [ ] **Step 1: Write the helper**

```tsx
// src/test/react-query.tsx
import * as React from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

export function renderWithQueryClient(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { client?: QueryClient },
) {
  const client = options?.client ?? createTestQueryClient()
  const utils = render(ui, {
    ...options,
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })
  return { ...utils, client }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/test/react-query.tsx
git commit -m "add shared react query test wrapper"
```

### Task 1.3: Create the Request factory

**Files:**

- Create: `src/test/request.ts`

- [ ] **Step 1: Write the helper**

```ts
// src/test/request.ts
import { NextRequest } from 'next/server'

interface MakeRequestOptions {
  method?: string
  url?: string
  body?: unknown
  searchParams?: Record<string, string>
  headers?: Record<string, string>
}

export function makeRequest(options: MakeRequestOptions = {}): NextRequest {
  const base = options.url ?? 'http://localhost:4444/api/test'
  const url = new URL(base)
  if (options.searchParams) {
    for (const [k, v] of Object.entries(options.searchParams)) {
      url.searchParams.set(k, v)
    }
  }
  const init: RequestInit = {
    method: options.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(options.headers ?? {}),
    },
  }
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body)
  }
  return new NextRequest(url, init)
}

export function makeParams<T extends Record<string, string>>(
  value: T,
): { params: Promise<T> } {
  return { params: Promise.resolve(value) }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/test/request.ts
git commit -m "add shared request factory for api route tests"
```

---

## Phase 2 — Tier 1: pure-logic tests

### Task 2.1: Tests for `src/lib/utils.ts`

**Files:**

- Create: `src/lib/utils.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/utils.test.ts
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import {
  cn,
  formatDate,
  formatRelativeTime,
  formatRelativeDate,
} from '@/lib/utils'

describe('cn', () => {
  it('merges class strings', () => {
    expect(cn('a', 'b')).toBe('a b')
  })
  it('dedupes conflicting tailwind classes with later winning', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
  it('drops falsey values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })
})

describe('formatDate', () => {
  it('formats a Date object', () => {
    expect(formatDate(new Date('2026-04-20T12:00:00Z'))).toBe('Apr 20, 2026')
  })
  it('accepts an ISO string', () => {
    expect(formatDate('2026-04-20T12:00:00Z')).toBe('Apr 20, 2026')
  })
})

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-20T12:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "just now" for < 60s ago', () => {
    expect(formatRelativeTime(new Date('2026-04-20T11:59:30Z'))).toBe(
      'just now',
    )
  })
  it('returns minutes for < 1h ago', () => {
    expect(formatRelativeTime(new Date('2026-04-20T11:45:00Z'))).toBe('15m ago')
  })
  it('returns hours for < 24h ago', () => {
    expect(formatRelativeTime(new Date('2026-04-20T09:00:00Z'))).toBe('3h ago')
  })
  it('returns days for < 7d ago', () => {
    expect(formatRelativeTime(new Date('2026-04-18T12:00:00Z'))).toBe('2d ago')
  })
  it('falls back to absolute date for > 7d ago', () => {
    expect(formatRelativeTime(new Date('2026-04-01T12:00:00Z'))).toBe(
      'Apr 1, 2026',
    )
  })
  it('falls back to absolute date for future dates', () => {
    expect(formatRelativeTime(new Date('2026-04-21T12:00:00Z'))).toBe(
      'Apr 21, 2026',
    )
  })
})

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-20T12:00:00'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "Today" for today', () => {
    expect(formatRelativeDate(new Date('2026-04-20T23:59:00'))).toBe('Today')
  })
  it('returns "Tomorrow" for next day', () => {
    expect(formatRelativeDate(new Date('2026-04-21T05:00:00'))).toBe('Tomorrow')
  })
  it('returns "Yesterday" for previous day', () => {
    expect(formatRelativeDate(new Date('2026-04-19T05:00:00'))).toBe(
      'Yesterday',
    )
  })
  it('returns "In N days" for 2-7 days out', () => {
    expect(formatRelativeDate(new Date('2026-04-25T05:00:00'))).toBe(
      'In 5 days',
    )
  })
  it('returns "N days overdue" for 2-7 days past', () => {
    expect(formatRelativeDate(new Date('2026-04-17T05:00:00'))).toBe(
      '3 days overdue',
    )
  })
  it('returns "Overdue" for > 7 days past', () => {
    expect(formatRelativeDate(new Date('2026-04-01T05:00:00'))).toBe('Overdue')
  })
  it('returns absolute date for > 7 days out', () => {
    expect(formatRelativeDate(new Date('2026-05-15T05:00:00'))).toBe(
      'May 15, 2026',
    )
  })
})
```

- [ ] **Step 2: Run**

```bash
npx vitest run src/lib/utils.test.ts
```

Expected: all tests pass (source already exists).

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils.test.ts
git commit -m "add tests for utils: cn and date formatters"
```

### Task 2.2: Tests for `src/lib/events.ts`

**Files:**

- Create: `src/lib/events.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/events.test.ts
import { describe, expect, it, vi } from 'vitest'
import { subscribe, emit } from '@/lib/events'

describe('events', () => {
  it('notifies subscribed listeners', () => {
    const listener = vi.fn()
    const unsubscribe = subscribe(listener)
    emit('todos', { id: 1 })
    expect(listener).toHaveBeenCalledWith('todos', { id: 1 })
    unsubscribe()
  })

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = subscribe(listener)
    unsubscribe()
    emit('labels')
    expect(listener).not.toHaveBeenCalled()
  })

  it('fans out to multiple listeners', () => {
    const a = vi.fn()
    const b = vi.fn()
    const unsubA = subscribe(a)
    const unsubB = subscribe(b)
    emit('notebook')
    expect(a).toHaveBeenCalledWith('notebook', undefined)
    expect(b).toHaveBeenCalledWith('notebook', undefined)
    unsubA()
    unsubB()
  })
})
```

- [ ] **Step 2: Run**

```bash
npx vitest run src/lib/events.test.ts
```

Expected: 3 pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/events.test.ts
git commit -m "add tests for events pubsub"
```

### Task 2.3: Tests for `src/lib/http-client.ts`

**Files:**

- Create: `src/lib/http-client.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/http-client.test.ts
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { buildUrl, requestJson, withJsonBody } from '@/lib/http-client'

describe('buildUrl', () => {
  it('returns pathname when no params', () => {
    expect(buildUrl('/api/todos')).toBe('/api/todos')
  })
  it('returns pathname when params object is empty-after-stripping', () => {
    expect(buildUrl('/api/todos', { q: '', x: null, y: undefined })).toBe(
      '/api/todos',
    )
  })
  it('coerces non-string primitives', () => {
    expect(buildUrl('/api/todos', { limit: 10, archived: true })).toBe(
      '/api/todos?limit=10&archived=true',
    )
  })
  it('url-encodes string values', () => {
    expect(buildUrl('/api/search', { q: 'foo bar&baz' })).toBe(
      '/api/search?q=foo+bar%26baz',
    )
  })
})

describe('withJsonBody', () => {
  it('sets JSON content-type and stringifies body', () => {
    const init = withJsonBody({ a: 1 }, { method: 'POST' })
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"a":1}')
    const headers = new Headers(init.headers)
    expect(headers.get('content-type')).toBe('application/json')
  })
  it('preserves caller-provided headers', () => {
    const init = withJsonBody(
      { a: 1 },
      { headers: { 'x-custom': 'v' }, method: 'POST' },
    )
    const headers = new Headers(init.headers)
    expect(headers.get('x-custom')).toBe('v')
    expect(headers.get('content-type')).toBe('application/json')
  })
})

describe('requestJson', () => {
  const originalFetch = globalThis.fetch
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })
  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns parsed JSON on success', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ ok: 1 }), { status: 200 }),
    )
    await expect(requestJson('/x')).resolves.toEqual({ ok: 1 })
  })

  it('throws with server-provided error message when present', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ error: 'Boom' }), { status: 400 }),
    )
    await expect(requestJson('/x')).rejects.toThrow('Boom')
  })

  it('falls back to status-based message when body is not JSON', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response('<html>500</html>', { status: 500 }),
    )
    await expect(requestJson('/x')).rejects.toThrow('API error: 500')
  })
})
```

- [ ] **Step 2: Run**

```bash
npx vitest run src/lib/http-client.test.ts
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/http-client.test.ts
git commit -m "add tests for http-client: buildUrl, requestJson, withJsonBody"
```

### Task 2.4: Tests for `src/lib/themes.ts`

**Files:**

- Create: `src/lib/themes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/themes.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, defaultTheme, getThemeById, themes } from '@/lib/themes'

describe('getThemeById', () => {
  it('returns the requested theme', () => {
    const discord = themes.find((t) => t.id === 'discord')!
    expect(getThemeById('discord')).toBe(discord)
  })
  it('falls back to the default theme when id is unknown', () => {
    expect(getThemeById('nonexistent')).toBe(defaultTheme)
  })
})

describe('applyTheme', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('style')
    document.body.removeAttribute('style')
  })
  afterEach(() => {
    document.documentElement.removeAttribute('style')
    document.body.removeAttribute('style')
  })

  it('writes every color CSS variable', () => {
    applyTheme(defaultTheme)
    const root = document.documentElement
    expect(root.style.getPropertyValue('--background')).toBe(
      defaultTheme.colors.background,
    )
    expect(root.style.getPropertyValue('--primary')).toBe(
      defaultTheme.colors.primary,
    )
    expect(root.style.getPropertyValue('--status-in-progress')).toBe(
      defaultTheme.colors.statusInProgress,
    )
    expect(root.style.getPropertyValue('--priority-urgent')).toBe(
      defaultTheme.colors.priorityUrgent,
    )
  })

  it('removes font overrides when theme has no fonts', () => {
    document.documentElement.style.setProperty('--font-sans', 'LEAK')
    document.documentElement.style.setProperty('--font-heading', 'LEAK')
    applyTheme(defaultTheme)
    expect(document.documentElement.style.getPropertyValue('--font-sans')).toBe(
      '',
    )
    expect(
      document.documentElement.style.getPropertyValue('--font-heading'),
    ).toBe('')
  })

  it('resolves a var() reference via getComputedStyle', () => {
    const spy = vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (name: string) =>
        name === '--font-inconsolata' ? '"Inconsolata Mock"' : '',
    } as unknown as CSSStyleDeclaration)

    const tron = themes.find((t) => t.id === 'tron-legacy')!
    applyTheme(tron)

    expect(document.documentElement.style.getPropertyValue('--font-sans')).toBe(
      '"Inconsolata Mock", system-ui, sans-serif',
    )
    spy.mockRestore()
  })

  it('keeps the raw value when var() cannot be resolved', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: () => '',
    } as unknown as CSSStyleDeclaration)

    applyTheme({
      ...defaultTheme,
      fonts: { body: 'var(--font-missing)' },
    })

    expect(document.documentElement.style.getPropertyValue('--font-sans')).toBe(
      'var(--font-missing), system-ui, sans-serif',
    )
  })
})
```

- [ ] **Step 2: Run**

```bash
npx vitest run src/lib/themes.test.ts
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/themes.test.ts
git commit -m "add tests for themes: applyTheme and font var resolution"
```

### Task 2.5: Tests for `src/hooks/use-todo-form.ts`

**Files:**

- Create: `src/hooks/use-todo-form.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/hooks/use-todo-form.test.tsx
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useTodoForm } from '@/hooks/use-todo-form'
import type { Todo } from '@/types/todo'

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: 't-1',
    taskNumber: 1,
    title: 'existing',
    description: 'body',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    dueDate: '2026-05-01T00:00:00.000Z',
    labels: [{ id: 'l-1', name: 'a', color: '#fff', billingCodes: [] }],
    subtasks: [
      { id: 's-1', title: 'one', completed: false, order: 0, todoId: 't-1' },
    ],
    myPrUrls: ['https://gh/1'],
    githubPrUrls: [],
    azureWorkItemUrl: null,
    azureDepUrls: [],
    myIssueUrls: [],
    githubIssueUrls: [],
    archived: false,
    order: 0,
    notebookNoteId: null,
    notebookNote: null,
    sessions: [],
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
    statusChangedAt: '2026-04-01T00:00:00Z',
    completedAt: null,
    ...overrides,
  } as Todo
}

describe('useTodoForm', () => {
  it('initializes with blank defaults when no todo is passed', () => {
    const { result } = renderHook(() => useTodoForm())
    expect(result.current.title).toBe('')
    expect(result.current.priority).toBe('MEDIUM')
    expect(result.current.status).toBe('TODO')
    expect(result.current.subtasks).toEqual([])
  })

  it('populates from a passed todo', () => {
    const { result } = renderHook(() => useTodoForm(makeTodo()))
    expect(result.current.title).toBe('existing')
    expect(result.current.priority).toBe('HIGH')
    expect(result.current.dueDate).toBe('2026-05-01')
    expect(result.current.subtasks).toHaveLength(1)
    expect(result.current.labelIds).toEqual(['l-1'])
  })

  it('addSubtask ignores blank titles and assigns sequential orders', () => {
    const { result } = renderHook(() => useTodoForm())
    act(() => {
      result.current.addSubtask('   ')
      result.current.addSubtask('one')
      result.current.addSubtask('two')
    })
    expect(result.current.subtasks).toHaveLength(2)
    expect(result.current.subtasks.map((s) => s.order)).toEqual([0, 1])
  })

  it('moveSubtask reorders and reassigns orders', () => {
    const { result } = renderHook(() => useTodoForm())
    act(() => {
      result.current.addSubtask('a')
      result.current.addSubtask('b')
      result.current.addSubtask('c')
    })
    act(() => {
      result.current.moveSubtask(2, 0)
    })
    expect(result.current.subtasks.map((s) => s.title)).toEqual(['c', 'a', 'b'])
    expect(result.current.subtasks.map((s) => s.order)).toEqual([0, 1, 2])
  })

  it('addMyPrUrl dedupes and trims', () => {
    const { result } = renderHook(() => useTodoForm())
    act(() => {
      result.current.addMyPrUrl('  https://gh/1  ')
      result.current.addMyPrUrl('https://gh/1')
      result.current.addMyPrUrl('')
    })
    expect(result.current.myPrUrls).toEqual(['https://gh/1'])
  })

  it('reset returns to initial defaults', () => {
    const { result } = renderHook(() => useTodoForm())
    act(() => {
      result.current.setTitle('x')
      result.current.setPriority('URGENT')
      result.current.addSubtask('s1')
    })
    act(() => {
      result.current.reset()
    })
    expect(result.current.title).toBe('')
    expect(result.current.priority).toBe('MEDIUM')
    expect(result.current.subtasks).toEqual([])
  })

  it('toPayload trims title/description, converts dueDate to ISO or null, and renumbers subtask orders', () => {
    const { result } = renderHook(() => useTodoForm())
    act(() => {
      result.current.setTitle('  hello  ')
      result.current.setDescription('   ')
      result.current.setDueDate('2026-04-25')
      result.current.addSubtask('a')
    })
    const payload = result.current.toPayload()
    expect(payload.title).toBe('hello')
    expect(payload.description).toBeUndefined()
    expect(payload.dueDate).toBe(new Date('2026-04-25').toISOString())
    expect(payload.subtasks[0]).toMatchObject({
      title: 'a',
      order: 0,
      completed: false,
    })
  })
})
```

- [ ] **Step 2: Run**

```bash
npx vitest run src/hooks/use-todo-form.test.tsx
```

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-todo-form.test.tsx
git commit -m "add tests for use-todo-form hook"
```

### Task 2.6: Phase gate

- [ ] **Step 1: Run full validate**

```bash
npm run validate
```

Expected: exits 0. `Test Files` count should now be 15 (10 existing + 5 new).

---

## Phase 3 — Tier 2: API route tests

Each route-test file follows the same shape. The pattern below is shown in full for Task 3.1; later tasks use `// same imports and beforeEach as 3.1` to reduce noise, but each file MUST include the full mock block — do NOT rely on cross-file state.

Every API route test file MUST start with:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbMock, resetDbMock } from '@/test/db-mock'
import { makeRequest, makeParams } from '@/test/request'

vi.mock('@/lib/db', () => ({ db: dbMock }))
vi.mock('@/lib/events', () => ({
  emit: vi.fn(),
  subscribe: vi.fn(() => () => {}),
}))
// When the route under test imports this, mock it:
vi.mock('@/lib/accomplishment-agent', () => ({
  evaluateAccomplishment: vi.fn(),
}))

beforeEach(() => {
  resetDbMock()
})
```

Omit the `@/lib/accomplishment-agent` mock in files where the route doesn't import it — otherwise vitest will still pass, but it's cleaner to match imports.

### Task 3.1: `src/app/api/todos/route.test.ts`

**Files:**

- Create: `src/app/api/todos/route.test.ts`

- [ ] **Step 1: Write the test**

```ts
// src/app/api/todos/route.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbMock, resetDbMock } from '@/test/db-mock'
import { makeRequest } from '@/test/request'

vi.mock('@/lib/db', () => ({ db: dbMock }))
vi.mock('@/lib/events', () => ({
  emit: vi.fn(),
  subscribe: vi.fn(() => () => {}),
}))
vi.mock('@/lib/accomplishment-agent', () => ({
  evaluateAccomplishment: vi.fn(),
}))

beforeEach(() => {
  resetDbMock()
})

describe('GET /api/todos', () => {
  it('returns the active todos by default', async () => {
    const { GET } = await import('./route')
    dbMock.todo.findMany.mockResolvedValue([])
    const res = await GET(makeRequest({ url: 'http://localhost/api/todos' }))
    expect(res.status).toBe(200)
    expect(dbMock.todo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ archived: false }),
      }),
    )
  })

  it('returns paginated shape when limit is provided', async () => {
    const { GET } = await import('./route')
    dbMock.todo.findMany.mockResolvedValue([])
    dbMock.todo.count.mockResolvedValue(0)
    const res = await GET(
      makeRequest({ url: 'http://localhost/api/todos?limit=20&offset=0' }),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ todos: [], total: 0 })
  })
})

describe('POST /api/todos', () => {
  it('creates a todo and emits', async () => {
    const { POST } = await import('./route')
    const created = {
      id: 't-1',
      title: 'hi',
      priority: 'MEDIUM',
      status: 'TODO',
      order: 0,
      archived: false,
      completedAt: null,
      labels: [],
      subtasks: [],
      notebookNote: null,
      sessions: [],
      description: null,
      statusChangedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      myPrUrls: [],
      githubPrUrls: [],
      azureWorkItemUrl: null,
      azureDepUrls: [],
      myIssueUrls: [],
      githubIssueUrls: [],
      notebookNoteId: null,
      taskNumber: 1,
      dueDate: null,
    }
    dbMock.todo.findFirst.mockResolvedValue(null)
    dbMock.todo.create.mockResolvedValue(created)
    const res = await POST(
      makeRequest({
        method: 'POST',
        url: 'http://localhost/api/todos',
        body: { title: 'hi' },
      }),
    )
    expect(res.status).toBe(201)
    expect(dbMock.todo.create).toHaveBeenCalled()
  })

  it('returns 400 for invalid input', async () => {
    const { POST } = await import('./route')
    const res = await POST(
      makeRequest({
        method: 'POST',
        url: 'http://localhost/api/todos',
        body: { title: '' },
      }),
    )
    expect(res.status).toBe(400)
  })
})
```

Notes:

- If the response shape requires fields the test's `created` object doesn't cover, the route's `validateTodoForResponse(todo)` may throw. Expand `created` to match the shape actually required by the running route. Run the test — if it fails with a validation message, add the missing fields and re-run.
- Dynamic imports (`await import('./route')`) ensure the `vi.mock` calls are applied before the route module evaluates.

- [ ] **Step 2: Run**

```bash
npx vitest run src/app/api/todos/route.test.ts
```

Expected: passes. If a `validateTodoForResponse` shape mismatch appears, expand the `created` fixture; do NOT loosen the validator.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/todos/route.test.ts
git commit -m "add api route tests for /api/todos"
```

### Task 3.2: `src/app/api/todos/[id]/route.test.ts`

**Files:**

- Read: `src/app/api/todos/[id]/route.ts` (skim for imports + handlers — you'll need to know which HTTP verbs are exported)
- Create: `src/app/api/todos/[id]/route.test.ts`

- [ ] **Step 1: Write the test**

Apply the same mock block as 3.1. Then:

```ts
// ... imports + mocks + beforeEach identical to Task 3.1 ...
// (copy the block verbatim — do not reuse across files)

describe('GET /api/todos/[id]', () => {
  it('returns the todo when found', async () => {
    const { GET } = await import('./route')
    dbMock.todo.findUnique.mockResolvedValue({
      id: 't-1' /* full shape matching validateTodoForResponse — mirror Task 3.1 */,
    } as never)
    const res = await GET(
      makeRequest({ url: 'http://localhost/api/todos/t-1' }),
      makeParams({ id: 't-1' }),
    )
    expect(res.status).toBe(200)
  })

  it('returns 404 when not found', async () => {
    const { GET } = await import('./route')
    dbMock.todo.findUnique.mockResolvedValue(null)
    const res = await GET(
      makeRequest({ url: 'http://localhost/api/todos/x' }),
      makeParams({ id: 'x' }),
    )
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/todos/[id]', () => {
  it('updates and returns the todo', async () => {
    const { PATCH } = await import('./route')
    dbMock.todo.update.mockResolvedValue({
      /* full shape */
    } as never)
    const res = await PATCH(
      makeRequest({
        method: 'PATCH',
        url: 'http://localhost/api/todos/t-1',
        body: { title: 'new' },
      }),
      makeParams({ id: 't-1' }),
    )
    expect(res.status).toBe(200)
  })

  it('returns 400 for invalid body', async () => {
    const { PATCH } = await import('./route')
    const res = await PATCH(
      makeRequest({
        method: 'PATCH',
        url: 'http://localhost/api/todos/t-1',
        body: { priority: 'INVALID' },
      }),
      makeParams({ id: 't-1' }),
    )
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/todos/[id]', () => {
  it('deletes and emits', async () => {
    const { DELETE } = await import('./route')
    dbMock.todo.delete.mockResolvedValue({ id: 't-1' } as never)
    const res = await DELETE(
      makeRequest({ method: 'DELETE', url: 'http://localhost/api/todos/t-1' }),
      makeParams({ id: 't-1' }),
    )
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Run, adjust fixture shape if validator rejects, commit**

```bash
npx vitest run src/app/api/todos/[id]/route.test.ts
git add src/app/api/todos/[id]/route.test.ts
git commit -m "add api route tests for /api/todos/[id]"
```

### Task 3.3: Remaining todo sub-routes

Create one file per handler, following the pattern from 3.2:

**Files to create:**

- `src/app/api/todos/board/route.test.ts` — one happy path for GET
- `src/app/api/todos/reorder/route.test.ts` — POST with `{ orderedIds: ['a','b'] }` (200) + empty body (400)
- `src/app/api/todos/[id]/subtasks/[subtaskId]/route.test.ts` — PATCH with `{ completed: true }` (200)

For any route that the test reveals uses methods NOT in `dbMock`, add the method to `makeModel()` in `src/test/db-mock.ts` and push a separate commit `extend db mock with <method>`.

- [ ] **Step 1: Create the three test files**

For each: mirror the mock block from Task 3.1 exactly, then write one happy + one invalid-input test per exported HTTP verb. Inspect the route source first so the imports + Prisma calls you mock match reality.

- [ ] **Step 2: Run**

```bash
npx vitest run src/app/api/todos
```

Expected: all route tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/todos/board/route.test.ts \
        src/app/api/todos/reorder/route.test.ts \
        "src/app/api/todos/[id]/subtasks/[subtaskId]/route.test.ts"
git commit -m "add api route tests for todos board, reorder, and subtasks"
```

### Task 3.4: Label route tests

**Files:**

- Create: `src/app/api/labels/route.test.ts`
- Create: `src/app/api/labels/[id]/route.test.ts`

- [ ] **Step 1: Write `labels/route.test.ts`**

Same mock block as 3.1. Cases:

- `GET` — `dbMock.label.findMany.mockResolvedValue([])`, expect 200 + empty array
- `POST` happy — body `{ name: 'Focus', color: '#ff0000' }`, mock `dbMock.label.create` to return a full label, expect 201
- `POST` invalid — body `{ name: '' }`, expect 400

- [ ] **Step 2: Write `labels/[id]/route.test.ts`**

Cases:

- `PATCH` happy — `dbMock.label.update` + `dbMock.label.findUniqueOrThrow` return a label, expect 200
- `PATCH` not-found — `dbMock.label.update` throws `{ code: 'P2025' }`, expect 404. Implement by constructing an error object: `Object.assign(new Error('not found'), { code: 'P2025', clientVersion: '7' })` and rejecting the mock with it.
- `DELETE` happy — 200
- `DELETE` not-found — same P2025 rejection, expect 404

- [ ] **Step 3: Run + commit**

```bash
npx vitest run src/app/api/labels
git add src/app/api/labels
git commit -m "add api route tests for /api/labels"
```

### Task 3.5: Notebook route tests

**Files:**

- Create: `src/app/api/notebook/route.test.ts`
- Create: `src/app/api/notebook/[id]/route.test.ts`

- [ ] **Step 1: Inspect route source first**

```bash
cat src/app/api/notebook/route.ts
cat "src/app/api/notebook/[id]/route.ts"
```

Mirror the imports you see. If the route uses any additional `@/lib/*` helper with side effects, add a `vi.mock` for it.

- [ ] **Step 2: Write tests**

Cover for each file: one happy path per exported verb, one invalid-input (400) on mutating verbs, one not-found (404) on fetch-by-id verbs.

Fixture helper (put inline at the top of each file, below the mocks):

```ts
function makeNote(overrides = {}) {
  return {
    id: 'n-1',
    title: 'hello',
    content: '<p>body</p>',
    pinned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}
```

- [ ] **Step 3: Run + commit**

```bash
npx vitest run src/app/api/notebook
git add src/app/api/notebook
git commit -m "add api route tests for /api/notebook"
```

### Task 3.6: Note (scratch pad) route test

**Files:**

- Create: `src/app/api/note/route.test.ts`

Route uses `PUT` (not PATCH) and does inline zod validation. Shared `dbMock.note.findUnique` / `upsert`.

- [ ] **Step 1: Write the test**

```ts
// ... standard mocks (no accomplishment-agent needed) ...

describe('GET /api/note', () => {
  it('returns empty content when no record exists', async () => {
    const { GET } = await import('./route')
    dbMock.note.findUnique.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ id: 'default', content: '', updatedAt: null })
  })

  it('returns existing note content', async () => {
    const { GET } = await import('./route')
    const updatedAt = new Date('2026-04-20T10:00:00Z')
    dbMock.note.findUnique.mockResolvedValue({
      id: 'default',
      content: 'hi',
      updatedAt,
      createdAt: updatedAt,
    } as never)
    const res = await GET()
    const body = await res.json()
    expect(body).toEqual({
      id: 'default',
      content: 'hi',
      updatedAt: updatedAt.toISOString(),
    })
  })
})

describe('PUT /api/note', () => {
  it('upserts and returns the note', async () => {
    const { PUT } = await import('./route')
    const now = new Date()
    dbMock.note.upsert.mockResolvedValue({
      id: 'default',
      content: 'x',
      updatedAt: now,
      createdAt: now,
    } as never)
    const res = await PUT(
      makeRequest({
        method: 'PUT',
        url: 'http://localhost/api/note',
        body: { content: 'x' },
      }),
    )
    expect(res.status).toBe(200)
  })

  it('returns 400 when body omits content', async () => {
    const { PUT } = await import('./route')
    const res = await PUT(
      makeRequest({
        method: 'PUT',
        url: 'http://localhost/api/note',
        body: {},
      }),
    )
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run + commit**

```bash
npx vitest run src/app/api/note/route.test.ts
git add src/app/api/note/route.test.ts
git commit -m "add api route tests for /api/note scratch pad"
```

### Task 3.7: People route tests

**Files:**

- Create: `src/app/api/people/route.test.ts`
- Create: `src/app/api/people/[id]/route.test.ts`

- [ ] **Step 1: Inspect route source**

```bash
cat src/app/api/people/route.ts
cat "src/app/api/people/[id]/route.ts"
```

- [ ] **Step 2: Write tests**

Patterns from 3.4. For duplicate-email conflict if the route surfaces it, add a test that mocks a `P2002` Prisma error and expects 409 — only if the route actually catches it; otherwise skip.

- [ ] **Step 3: Run + commit**

```bash
npx vitest run src/app/api/people
git add src/app/api/people
git commit -m "add api route tests for /api/people"
```

### Task 3.8: Stats route test

**Files:**

- Create: `src/app/api/stats/year/route.test.ts`

- [ ] **Step 1: Inspect route source**

```bash
cat src/app/api/stats/year/route.ts
```

- [ ] **Step 2: Write ONE happy-path test**

Mock whatever Prisma calls the route makes (likely several aggregations on `todo` + `accomplishment` models) and assert status 200 + that the response has the expected top-level keys. Do not exhaustively test every bucket — this is a smoke test.

- [ ] **Step 3: Run + commit**

```bash
npx vitest run src/app/api/stats/year/route.test.ts
git add src/app/api/stats/year/route.test.ts
git commit -m "add api route smoke test for /api/stats/year"
```

### Task 3.9: Phase 3 gate

- [ ] **Step 1: Full validate**

```bash
npm run validate
```

Expected: all tests pass. `Test Files` count now ≈ 28.

---

## Phase 4 — Tier 3: useTodos optimistic-update test

### Task 4.1: Hook integration test

**Files:**

- Create: `src/hooks/use-todos.test.tsx`

- [ ] **Step 1: Read the hook to identify which api call the optimistic `update` path calls**

```bash
grep -n 'onMutate\|setBoardData\|updateTodoInBoard' src/hooks/use-todos.tsx
```

Confirm the target mutation is `update` (status change) — this is the test's target.

- [ ] **Step 2: Write the test**

```tsx
// src/hooks/use-todos.test.tsx
import { act, waitFor } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  renderWithQueryClient,
  createTestQueryClient,
} from '@/test/react-query'
import { QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'

vi.mock('@/lib/api', () => ({
  todosApi: {
    board: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    reorder: vi.fn(),
    toggleSubtask: vi.fn(),
    list: vi.fn(),
    listPaginated: vi.fn(),
    createSession: vi.fn(),
    deleteSession: vi.fn(),
  },
  labelsApi: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn(), dismiss: vi.fn() }),
}))

import { useTodos } from '@/hooks/use-todos'
import { todosApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import type { TodoBoardResponse } from '@/types/todo'

function makeTodo(overrides = {}) {
  const now = new Date().toISOString()
  return {
    id: 't-1',
    taskNumber: 1,
    title: 'row',
    description: null,
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: null,
    labels: [],
    subtasks: [],
    myPrUrls: [],
    githubPrUrls: [],
    azureWorkItemUrl: null,
    azureDepUrls: [],
    myIssueUrls: [],
    githubIssueUrls: [],
    notebookNoteId: null,
    notebookNote: null,
    sessions: [],
    archived: false,
    order: 0,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    statusChangedAt: now,
    ...overrides,
  } as never
}

function makeBoard(): TodoBoardResponse {
  return {
    active: [makeTodo({ id: 't-1', status: 'TODO' })],
    completed: [],
    deleted: [],
  } as never
}

beforeEach(() => {
  vi.clearAllMocks()
})

function renderWithClient() {
  const client = createTestQueryClient()
  client.setQueryData(queryKeys.todoBoard, makeBoard())
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => useTodos(), { wrapper })
  return { result, client }
}

describe('useTodos.update', () => {
  it('resolves with server data when the mutation succeeds', async () => {
    ;(todosApi.update as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeTodo({ id: 't-1', status: 'COMPLETED' }),
    )
    const { result, client } = renderWithClient()
    await act(async () => {
      await result.current.update.mutateAsync({
        id: 't-1',
        data: { status: 'COMPLETED' },
      })
    })
    const board = client.getQueryData<TodoBoardResponse>(queryKeys.todoBoard)
    await waitFor(() => {
      expect(board?.completed.some((t) => t.id === 't-1')).toBe(true)
    })
  })

  it('surfaces an error when the mutation rejects', async () => {
    ;(todosApi.update as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('boom'),
    )
    const { result } = renderWithClient()
    await expect(
      act(async () => {
        await result.current.update.mutateAsync({
          id: 't-1',
          data: { status: 'COMPLETED' },
        })
      }),
    ).rejects.toThrow('boom')
  })
})
```

Note: `useTodos` does not currently implement onMutate-based optimistic rollback for `update` (it uses onSuccess-only). The test asserts the real behavior — resolved state after success, thrown error on failure — which is still the correct canary for React Query major bumps. If a later refactor adds optimistic rollback, add the flash-and-rollback assertion then.

- [ ] **Step 3: Run**

```bash
npx vitest run src/hooks/use-todos.test.tsx
```

Expected: 2 pass.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-todos.test.tsx
git commit -m "add use-todos integration test as react query canary"
```

### Task 4.2: Phase 4 gate

- [ ] **Step 1: Full validate**

```bash
npm run validate
```

Expected: exits 0. All test files green.

---

## Phase 5 — Package updates

### Task 5.1: Safe minors in one batch

**Files:** `package.json`, `package-lock.json` (via npm)

- [ ] **Step 1: Update in one call**

```bash
npm install --save-exact=false \
  next@latest eslint-config-next@latest \
  react@latest react-dom@latest \
  @prisma/client@latest @prisma/adapter-pg@latest prisma@latest \
  @tiptap/react@latest @tiptap/starter-kit@latest @tiptap/extension-code-block-lowlight@latest \
  @tiptap/extension-mention@latest @tiptap/extension-placeholder@latest @tiptap/extension-text-style@latest \
  @tanstack/react-query@latest \
  tailwindcss@latest @tailwindcss/postcss@latest \
  framer-motion@latest recharts@latest tailwind-merge@latest \
  pg@latest postcss@latest autoprefixer@latest jsdom@latest prettier@latest \
  @types/node@latest @types/pg@latest \
  vitest@latest @vitest/coverage-v8@latest
```

This pins all caret-ranged packages that are still within their current major to latest.

- [ ] **Step 2: Regenerate Prisma client**

```bash
npm run db:generate
```

Prisma client generation is required after any Prisma version bump.

- [ ] **Step 3: Full validate**

```bash
npm run validate
```

If it fails:

- Type errors → adjust code per the error (one small fix per error, no wholesale rewrites)
- Test failures → triage per failure; do not loosen tests unless a test is incorrect

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "bump minor versions: next, react, prisma, tiptap, react query, tailwind"
```

### Task 5.2: TypeScript 6

- [ ] **Step 1: Install**

```bash
npm install --save-dev typescript@latest
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

If errors appear, fix each one inline. Common TS 6 issues: stricter `verbatimModuleSyntax`, narrower `Record<,>` inference. Apply minimal fixes — no refactoring unrelated to the error.

- [ ] **Step 3: Full validate**

```bash
npm run validate
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json tsconfig.json
# Add any source files touched by fix-ups
git add -u
git commit -m "bump typescript to 6.0"
```

### Task 5.3: ESLint 10

- [ ] **Step 1: Check upstream compat before installing**

```bash
npm info eslint-config-next peerDependencies.eslint
npm info eslint-config-prettier peerDependencies.eslint
```

If either pins `eslint: ^9` only, HOLD this phase. Create a follow-up issue comment in the commit message for the user (do NOT commit if blocked — report back).

- [ ] **Step 2: If compatible, install**

```bash
npm install --save-dev eslint@latest
```

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Fix config/rule issues in `eslint.config.mjs` inline. Common: renamed rule names, new required config fields.

- [ ] **Step 4: Full validate + commit**

```bash
npm run validate
git add package.json package-lock.json eslint.config.mjs
git commit -m "bump eslint to 10"
```

### Task 5.4: lucide-react v1

- [ ] **Step 1: Fetch the migration doc**

```bash
# Use the context7 MCP to fetch lucide-react migration docs
# Query: "lucide-react v1 migration guide renamed icons"
```

Read the rename list. Common renames: deprecated icon names get canonical names; some obsolete icons are removed.

- [ ] **Step 2: Inventory all lucide-react imports**

```bash
grep -rn "from 'lucide-react'" src/ | sort -u
```

Capture each imported icon name. Cross-reference against the rename list.

- [ ] **Step 3: Install**

```bash
npm install lucide-react@latest
```

- [ ] **Step 4: Run typecheck to find removed names**

```bash
npm run typecheck
```

Each missing-symbol error points to a rename. Fix each import to the new name. Do not wrap unknown icons in fallbacks — use the canonical new name.

- [ ] **Step 5: Full validate**

```bash
npm run validate
```

- [ ] **Step 6: Manual sanity check**

Run `npm run dev` in a background terminal, open `http://localhost:4444`, click through:

- Sidebar (nav icons)
- Todos page (status/priority chips, add button, subtask toggle)
- Notebook page
- Settings (labels)

Any missing or placeholder-glyph icons indicate a missed rename. Fix and re-run.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json
git add -u  # capture source file icon-rename edits
git commit -m "migrate to lucide-react v1"
```

### Task 5.5: Phase 5 verify

- [ ] **Step 1: Confirm nothing is still outdated**

```bash
npm outdated
```

Expected: empty output (or only intentionally-pinned packages). Compare against `/tmp/baseline-outdated.txt` for sanity.

- [ ] **Step 2: Full validate**

```bash
npm run validate
```

Must be green before Phase 6.

---

## Phase 6 — Docker exclusion + rebuild + deploy

### Task 6.1: Update `.dockerignore`

**Files:**

- Modify: `.dockerignore`

- [ ] **Step 1: Edit**

Add these lines to `.dockerignore` (keep all existing lines — append to the Testing section or create a new section):

```
# Tests (excluded from build context)
**/*.test.ts
**/*.test.tsx
src/test/
vitest.config.ts
vitest.setup.ts

# Docs (excluded from build context)
docs/
```

Do NOT remove the existing `coverage` and `.nyc_output` entries.

- [ ] **Step 2: Commit**

```bash
git add .dockerignore
git commit -m "exclude tests from docker build context"
```

### Task 6.2: Rebuild and deploy

- [ ] **Step 1: Stop current container**

```bash
docker-compose down
```

- [ ] **Step 2: Rebuild from scratch**

```bash
docker-compose build --no-cache
```

Expected: builds successfully. Observe the COPY step's transferred context size — should be smaller than before.

- [ ] **Step 3: Start**

```bash
docker-compose up -d
```

- [ ] **Step 4: Verify health**

```bash
# Wait ~30s for the start-period of the healthcheck, then:
docker ps --filter name=ai-focus-app --format '{{.Status}}'
```

Expected: `Up X seconds (healthy)`.

- [ ] **Step 5: Smoke-test the app**

```bash
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:4444/todos
```

Expected: `200`.

If the app is unhealthy or 5xx:

- `docker-compose logs app | tail -100` — read the logs
- Most likely cause after a major bump: DB connection or Prisma client mismatch. Check the log message and apply a targeted fix. Reopen the previous phase's commit if a fix is needed.

### Task 6.3: Push to origin

- [ ] **Step 1: Push**

```bash
git push origin main
```

This is the single push for the entire plan — all commits from Phases 1-6 go up together.

### Task 6.4: Final report

- [ ] **Step 1: Summarize**

Print a short status to the user:

- Commits added (count + titles)
- Test file count (expect ~28)
- Package majors bumped (TS 6, ESLint 10, lucide v1)
- Docker: container status + URL

---

## Self-review notes (recorded during authoring)

- **Spec coverage check:** Every item in the spec "Test inventory — NEW tests to add" maps to a Phase 2/3/4 task. Update plan phases 2-5 match spec update plan phases 2-5. Docker hygiene maps to Phase 6.
- **Placeholder scan:** No TBDs. Task 3.3, 3.5, 3.7, 3.8 use "follow the pattern from 3.1/3.2" which is explicit (mock block + one happy + one invalid-input + one not-found) — the pattern is shown in full in Task 3.1.
- **Type consistency:** `dbMock` / `resetDbMock` / `renderWithQueryClient` / `createTestQueryClient` / `makeRequest` / `makeParams` names used consistently across all tasks. Prisma client export confirmed as `db`, not `prisma`.
- **Known conditional:** Task 5.3 may be blocked by `eslint-config-next` not supporting eslint 10 yet. The plan explicitly says to HOLD and report rather than force it — this is correct behavior, not a placeholder.
