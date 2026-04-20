# Package Updates + Test Suite Design

**Date:** 2026-04-20
**Status:** Approved — ready for implementation plan

## Motivation

Package updates are a recurring task for this project. Currently there is no automated safety net: updates rely on manual smoke testing through the UI. This spec establishes:

1. A pragmatic test suite that catches the regressions most likely to come from dependency bumps (Prisma, Next, React Query, React).
2. A first update pass that brings every dependency to its latest version, including three majors (TypeScript 6, ESLint 10, lucide-react v1).
3. Docker build-context hygiene so test files don't get pulled into the image.

The test suite is the real deliverable — it's the reusable infrastructure that makes every future update pass routine.

## Scope

**In scope**

- Write ~25–28 test files (Tiers 1–3 from the brainstorm)
- Update every outdated package to its latest version
- Fix any breakage the updates introduce
- Update `.dockerignore` to exclude test files from build context

**Out of scope**

- E2E / Playwright / visual regression tests
- Component snapshot tests (Tier 4 skipped)
- Tests for `mcp-server/` (separate workspace, thin wrapper)
- Tests for the SSE endpoint and GitHub PR proxy route
- CI configuration (assume `npm run validate` is the gate; CI wiring is a separate task if needed)

## Test suite design

### Stack

- **vitest** + **@testing-library/react** + **@testing-library/jest-dom** + **jsdom** — already installed and configured
- No new test libraries added

### Layout

Tests are colocated with source. Vitest config already matches `src/**/*.test.{ts,tsx}`.

- `src/lib/foo.test.ts` next to `src/lib/foo.ts`
- `src/app/api/todos/route.test.ts` next to the route handler
- `src/hooks/use-x.test.tsx` next to the hook

### New shared test helpers — `src/test/`

**`src/test/prisma-mock.ts`**
Exposes a typed stub of `@/lib/db`. Every Prisma method used by the API is an auto-reset `vi.fn()`. Tests import the stub to wire return values:

```ts
import { prismaMock, resetPrismaMock } from '@/test/prisma-mock'
beforeEach(() => resetPrismaMock())
prismaMock.todo.findMany.mockResolvedValue([...])
```

Implemented as `vi.mock('@/lib/db', () => ({ prisma: prismaMock }))` at module scope.

**`src/test/react-query.tsx`**
`renderWithQueryClient(ui)` returns `{ result, client }`. Fresh `QueryClient` per test with `retry: false`, `gcTime: 0` to avoid cache bleed between tests.

**`src/test/request.ts`**
`makeRequest({ method, url, body, params })` returns a `Request` shaped to match Next.js App Router expectations. One-liner for API route tests.

### Mocking strategy

| Boundary                    | Strategy                                          |
| --------------------------- | ------------------------------------------------- |
| `@/lib/db` (Prisma)         | `vi.mock` with manual stub                        |
| `@/lib/events` (SSE)        | `vi.mock` with no-op `emit`                       |
| `@/lib/api` (in hook tests) | `vi.mock` with controllable `vi.fn()` resolvers   |
| `fetch`                     | Not used — Prisma is the boundary for route tests |
| External APIs (GitHub)      | Routes using them are intentionally not tested    |

### Test inventory

**Tier 1 — pure logic**

- `src/lib/utils.test.ts` — `cn()`
- `src/lib/themes.test.ts` — `applyTheme()` CSS-var + font resolution
- `src/lib/events.test.ts` — emit/subscribe/unsubscribe
- `src/hooks/use-todo-form.test.tsx` — initial state, updates, reset, validation gate
- Any pure helper in `src/lib/api.ts` (query-string builder etc.) — if present; omit if the file is only `fetch(...)` wrappers

**Tier 2 — API routes (happy + invalid-input + not-found where relevant)**

- `src/app/api/todos/route.test.ts` — GET, POST
- `src/app/api/todos/[id]/route.test.ts` — GET, PATCH, DELETE
- `src/app/api/todos/[id]/archive/route.test.ts`
- `src/app/api/todos/[id]/restore/route.test.ts`
- `src/app/api/todos/reorder/route.test.ts`
- `src/app/api/todos/[id]/subtasks/route.test.ts` (and `[subtaskId]` if it exists)
- `src/app/api/labels/route.test.ts`, `src/app/api/labels/[id]/route.test.ts`
- `src/app/api/notebook/route.test.ts`, `src/app/api/notebook/[id]/route.test.ts`
- `src/app/api/note/route.test.ts` — GET, PATCH
- `src/app/api/people/route.test.ts`, `src/app/api/people/[id]/route.test.ts`
- `src/app/api/stats/year/route.test.ts` — one happy path

Each file: one happy path, one invalid-input (400) test, one not-found (404) test where applicable. No HTTP-verb permutation explosion.

**Tier 3 — hook integration**

- `src/hooks/use-todos.test.tsx` — optimistic status update: assert optimistic state flashes, then resolves on success; assert rollback on failure. This is the canary for React Query major bumps.

**Explicitly skipped**

- `src/app/api/github/**` — external call, mocking surface > test value
- `src/app/api/events/**` — SSE streaming, not testable shape
- Component smoke tests — TypeScript + API route tests already catch framework-level breakage

### Conventions

- One `describe` block per file, grouped by function/route
- No shared fixtures across files; helpers only in `src/test/`
- `expect(response.status).toBe(200)` style — no snapshot matchers
- Tests must pass without network, database, or file-system state

## Update plan

### Phase 1 — write tests first

Implement the full test inventory against current `main`. This is the baseline; `npm run validate` must pass before any update work starts. Commit: `add test suite with vitest + rtl covering utils, api routes, and one hook`.

### Phase 2 — safe minors (one batch)

Single `npm install` bumping every package where `wanted` matches `latest` within the same major:

- `next`, `eslint-config-next`
- `react`, `react-dom`
- `@prisma/client`, `@prisma/adapter-pg`, `prisma` (bump together — version-locked)
- `@tiptap/*` (all 6 packages together)
- `@tanstack/react-query`
- `tailwindcss`, `@tailwindcss/postcss`
- `framer-motion`, `recharts`, `tailwind-merge`
- `@types/node`, `@types/pg`, `postcss`, `autoprefixer`, `prettier`, `pg`, `jsdom`
- `vitest`, `@vitest/coverage-v8`

Gate: `npm run validate`. Commit: `bump minor versions: next, react, prisma, tiptap, react query, tailwind`.

### Phase 3 — TypeScript 6

`typescript ^5.9 → ^6.0`. Likely surfaces new strictness warnings. Fix inline. Gate: `npm run validate`. Commit: `bump typescript to 6.0`.

### Phase 4 — ESLint 10

`eslint ^9 → ^10`. Check `eslint-config-next` and `eslint-config-prettier` compat. Update the flat `eslint.config.mjs` if needed. Gate: `npm run lint`, then `npm run validate`. Commit: `bump eslint to 10`.

### Phase 5 — lucide-react v1

`lucide-react ^0.563 → ^1`. Workflow:

1. Use `context7` to fetch the lucide v0→v1 migration guide
2. `grep -r 'from .lucide-react.' src/` to find every import
3. Remap renamed icons
4. Run full validate + manually open the app and eyeball the sidebar + todo item icons

Gate: `npm run validate` + brief manual sidebar render. Commit: `migrate to lucide-react v1`.

### Phase 6 — Docker + build-context hygiene

`.dockerignore` additions:

```
**/*.test.ts
**/*.test.tsx
src/test/
vitest.config.ts
vitest.setup.ts
coverage/
docs/
```

No Dockerfile changes — the production image already only copies `.next/standalone`, so test files never reached the runtime. This change just trims the build context for faster `docker build`. Gate: `docker-compose build` completes without error. Commit: `exclude tests from docker build context`.

## Verification gates

Every phase must pass `npm run validate` (format:check + lint + test + build) before its commit. Running tests, building, and linting against the real dependency tree is the safety net; TypeScript catches most React/Next/Prisma API breakage, tests catch runtime logic breakage.

## Risks & mitigations

| Risk                                                    | Mitigation                                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Lucide v1 renames an icon we use and we miss it         | Grep every `lucide-react` import; manual sidebar render check                                           |
| TypeScript 6 introduces new errors in third-party types | Scope fixes narrowly; escape hatch is pinning `^5.9` if breakage is extensive                           |
| ESLint 10 breaks `eslint-config-next`                   | eslint-config-next may not yet support eslint 10 — if that's the case, hold this phase and flag to user |
| Prisma 7.7 changes generated-client shape               | Regenerate client (`npm run db:generate`); tests + typecheck catch API drift                            |
| Tests get stale and start failing on real bumps         | Expected — that's the point. Fix them as part of the update.                                            |

## Commit / push policy (per CLAUDE.md)

- All commits lowercase
- No AI attribution / co-authorship
- Push directly to `main` after each phase passes validate (if the user approves; this spec does not auto-push)
- One commit per phase; do not squash across phases

## Success criteria

- `npm run validate` passes on `main` with zero outdated packages (as of spec date)
- Test suite runs in under 15s locally
- Running `npm run test` in a fresh clone works without any DB/network setup
- `docker-compose build` context is smaller (test files excluded); image still builds and runs identically
