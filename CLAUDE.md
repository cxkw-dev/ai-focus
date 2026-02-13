# AI Focus - Claude Instructions

## Project Overview
A Next.js 16 productivity app with todos, notebook, and year-in-review stats. Built with Prisma 7, PostgreSQL, React 19, and Tailwind CSS v4.

## Git Configuration

### Repository Details
- **Repository:** git@github-personal:cxkw-dev/ai-focus.git
- **Remote uses:** `github-personal` SSH host (configured in ~/.ssh/config)
- **Git user (local to this repo):**
  - Email: cxkw.dev@gmail.com
  - Name: cxkw.dev

### Commit Rules
- **All commit messages MUST be lowercase**
- **Never include "Co-authored-by" or AI attribution in commits**
- Keep messages concise and descriptive

### Important Notes
- This repo uses the **personal SSH key** (`github-personal` host), not the work key
- Git user is configured locally (not globally) to avoid conflicts with other repos
- The `.env` file is ignored and contains sensitive database credentials

## Local Development

### Prerequisites
- PostgreSQL running via Homebrew on port 5432 (`brew services start postgresql@17`)

### Development Workflow
**The user runs `npm run dev` locally and sees changes live via hot reload.**
Do NOT rebuild or redeploy Docker after code changes - the local dev server handles this automatically.

### Docker Commands (only when explicitly needed)
Docker is used for production-like testing, not daily development.

```bash
# Rebuild and redeploy (rarely needed)
docker-compose down && docker-compose build --no-cache && docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

## Deployment Details

- **Container name:** ai-focus-app (always use `container_name` in docker-compose.yml)
- **Port:** 4444 (http://localhost:4444)
- **Database:** Homebrew PostgreSQL on host machine (accessed via `host.docker.internal:5432` from Docker)
- **Database name:** aifocus
- **Database user:** postgres

### Docker Compose Rules
- Always specify `container_name: ai-focus-app` in docker-compose.yml
- This ensures consistent container naming for easier management

### Database Architecture
- PostgreSQL runs on the **host machine** via Homebrew (not in a container)
- The Docker app connects to it using `host.docker.internal:5432`
- Local dev (outside Docker) connects via `localhost:5432`

## Tech Stack

- **Framework:** Next.js 16.1.6 with App Router (React 19)
- **Styling:** Tailwind CSS v4 with CSS custom properties
- **Database:** PostgreSQL with Prisma 7 ORM
- **State Management:** React Query (@tanstack/react-query)
- **Rich Text:** TipTap v3 with lowlight syntax highlighting
- **Charts:** Recharts (year review page)
- **Drag & Drop:** @dnd-kit (todo reordering)
- **UI Components:** Radix UI primitives
- **Animations:** Framer Motion
- **Validation:** Zod v4
- **Linting:** ESLint 9 (flat config - `eslint.config.mjs`)

## Key Directories

```
src/
├── app/
│   ├── (dashboard)/        # Route group — all main pages
│   │   ├── layout.tsx      # Dashboard layout (sidebar + header)
│   │   ├── todos/          # Todo list page
│   │   ├── notes/          # Notebook page (rich text editor)
│   │   ├── review/         # Year-in-review stats page
│   │   └── settings/       # Label management
│   ├── api/                # API routes
│   │   ├── todos/          # CRUD + reorder + subtask toggle
│   │   ├── labels/         # CRUD
│   │   ├── notebook/       # Notebook notes CRUD
│   │   ├── note/           # Scratch pad GET/PATCH
│   │   ├── github/         # GitHub PR status proxy (read-only)
│   │   ├── stats/year/     # Year review statistics
│   │   └── events/         # SSE stream for real-time updates
│   ├── layout.tsx          # Root layout (fonts, providers)
│   └── page.tsx            # Redirects to /todos
├── components/
│   ├── layout/             # Sidebar, Header, DashboardLayout
│   ├── todos/              # TodoItem, TodoList, forms, label picker, PR badges, scratch pad
│   ├── notes/              # NoteEditor, NotesSidebar
│   ├── review/             # Chart components (monthly, status, priority, labels, highlights)
│   ├── settings/           # LabelManager
│   ├── ui/                 # Base UI (Button, Dialog, RichTextEditor, etc.)
│   └── providers/          # ThemeProvider, QueryProvider
├── hooks/
│   ├── use-todos.tsx       # Todo queries + mutations (optimistic updates)
│   ├── use-labels.ts       # Label CRUD
│   ├── use-notebook.ts     # Notebook notes CRUD
│   ├── use-todo-form.ts    # Shared form state for all 3 todo form variants
│   ├── use-github-pr-status.ts # GitHub PR status queries (single + batch)
│   ├── use-sse.ts          # SSE client for real-time cache invalidation
│   ├── use-year-stats.ts   # Year review stats query
│   └── use-chart-colors.ts # Dynamic chart colors from CSS variables
├── lib/
│   ├── api.ts              # Typed API client (todosApi, labelsApi, notebookApi, statsApi, githubApi)
│   ├── db.ts               # Prisma client singleton
│   ├── events.ts           # In-memory event emitter for SSE
│   ├── themes.ts           # Theme definitions + applyTheme()
│   └── utils.ts            # cn() helper
└── types/
    ├── todo.ts             # Todo, Subtask, Label, GitHubPrStatus, Priority, Status
    ├── notebook.ts         # NotebookNote
    ├── note.ts             # Note (scratch pad)
    └── stats.ts            # YearStats
prisma/
├── schema.prisma           # Database schema
└── prisma.config.ts        # Datasource URL config
mcp-server/                 # MCP server for Claude Code integration
```

## Database Schema

### Models
- **Todo** — id, taskNumber (auto-increment), title, description, priority, dueDate, status, order, archived, myPrUrl, githubPrUrls[], labels[], subtasks[]
- **Subtask** — id, title, completed, order, todoId (cascade delete)
- **Label** — id, name (unique), color, todos[]
- **Note** — Single scratch pad record (id defaults to "default")
- **NotebookNote** — id, title, content (HTML), pinned, createdAt, updatedAt

### Enums
- **Status:** TODO, IN_PROGRESS, WAITING, ON_HOLD, COMPLETED
- **Priority:** LOW, MEDIUM, HIGH, URGENT

## State Management

React Query is the single source of truth for all server data. Custom hooks in `src/hooks/` wrap React Query:

- **`useTodos`** — Queries + mutations with optimistic updates and rollback. Toast with undo for archive.
- **`useLabels`** — CRUD mutations that also invalidate `['todos']` queries for consistency.
- **`useNotebook`** — Notebook notes CRUD with silent save and conflict resolution.
- **`useTodoForm`** — Shared form state deduplicating logic across InlineTodoForm, CreateTodoModal, and EditTodoDialog.

### Real-Time Updates (SSE)
- `src/lib/events.ts` — In-memory pub/sub event emitter
- `src/app/api/events/route.ts` — SSE endpoint that streams entity changes
- `src/hooks/use-sse.ts` — Client hook that invalidates React Query cache on events
- API mutation endpoints call `emit('todos')` etc. after DB writes
- Clients get instant updates across tabs/devices without polling

## Responsive Layout Architecture

The app has **separate UI components for desktop and mobile**, not just CSS breakpoints. When making changes, you must identify and update the correct component for each viewport.

### Task Creation

| Viewport | Component | File |
|----------|-----------|------|
| Desktop (>= 1280px) | `InlineTodoForm` | `src/components/todos/inline-todo-form.tsx` |
| Mobile (< 1280px) | `CreateTodoModal` | `src/components/todos/create-todo-modal.tsx` |

### Task Editing

| Viewport | Component | File |
|----------|-----------|------|
| All sizes | `EditTodoDialog` | `src/components/todos/edit-todo-dialog.tsx` |

### Layout Rules

- **InlineTodoForm (desktop):** Keep controls compact. Use dropdowns/popovers for selectors, not inline lists. Everything should fit in tight toolbar rows.
- **CreateTodoModal (mobile):** More vertical space available. Fields can be stacked full-width. Dropdowns preferred over inline lists.
- **EditTodoDialog:** Two-column at `md+` breakpoint. Left: title + description + subtasks. Right: status, priority, due date, my PR, waiting on PRs, labels.
- The main page layout is in `src/app/(dashboard)/todos/page.tsx` — desktop shows InlineTodoForm + todo list + scratch pad in columns; mobile shows tabs + FAB.

## Theme System

The app uses a **dynamic theme switcher** with multiple color themes. Users can switch themes via the dropdown in the header.

### Available Themes

| Theme | Description | Custom Fonts |
|-------|-------------|--------------|
| Midnight Peach | Warm peach tones on dark (default) | — |
| Discord | Classic Discord blurple | — |
| Anthropic | Warm terracotta tones | Lora (headings), DM Sans (body) |
| Atom One Dark | Classic developer editor theme | — |
| Tron Legacy | The Grid — near-black with cyan/orange | Inconsolata (body) |

### Theme Architecture

- **Theme definitions:** `src/lib/themes.ts` — All theme colors + optional fonts
- **Theme provider:** `src/components/providers/theme-provider.tsx` — Context + localStorage persistence
- **Theme switcher:** `src/components/layout/header.tsx` — Dropdown UI
- **CSS variables:** Applied dynamically via `applyTheme()` function

### Font System

Fonts are loaded via `next/font/google` in `src/app/layout.tsx` and set as CSS variables on `<body>`:
- `--font-geist-sans` (default body), `--font-geist-mono`, `--font-pixelify`, `--font-inconsolata`, `--font-lora`, `--font-dm-sans`

Theme font values reference these variables (e.g. `var(--font-lora)`). The `applyTheme()` function resolves them to actual font family names via `getComputedStyle` before setting `--font-sans` and `--font-heading` on `<html>`.

### Adding a New Theme

1. Add theme object to `themes` array in `src/lib/themes.ts`
2. Include all required color properties (28 colors: background, surface, primary, accent, status, priority, etc.)
3. Optionally add `fonts: { heading?, body? }` with `var(--font-xxx)` references
4. If adding a new font, import it in `src/app/layout.tsx` via `next/font/google` and add the variable class to `<body>`
5. Theme will automatically appear in the dropdown

### CSS Variables Used

| Variable | Purpose |
|----------|---------|
| `--background` | Page background |
| `--surface` | Cards, sidebar |
| `--surface-2` | Modals, dropdowns |
| `--primary` | Primary actions, buttons |
| `--accent` | Secondary accent color |
| `--text-primary` | Main text |
| `--text-muted` | Secondary text |
| `--border-color` | Borders |
| `--link` | Link color |
| `--destructive` | Destructive actions |
| `--status-*` | Todo status colors (todo, in-progress, waiting, on-hold, done) |
| `--priority-*` | Priority level colors (low, medium, high, urgent) |
| `--font-sans` | Body font (overridden by themes) |
| `--font-heading` | Heading font (overridden by themes) |

## Design Rules

### Accent colors on cards
**Never use `border-t-[Xpx]`, `border-l-[Xpx]`, etc. on elements with `rounded-*` classes.** Mixing a thicker border on one side with border-radius creates ugly uneven corners. Absolute-positioned inner bars also look off.

Instead, use a **small colored dot next to the heading** inside the card:
```tsx
<div className="rounded-xl border p-5" style={{ borderColor: 'var(--border-color)' }}>
  <div className="flex items-center gap-2 mb-4">
    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Section Title</h3>
  </div>
  ...
</div>
```

### Nested interactive elements
**Never nest `<button>` inside `<button>`.** This is invalid HTML and causes React hydration errors. If an item is clickable and contains a delete/action button, use `<div role="button" tabIndex={0}>` for the outer element with keyboard event handling.

## MCP Server

The `mcp-server/` directory contains a Model Context Protocol server for Claude Code integration.

- **Transport:** StdioServerTransport
- **API Base:** `AI_FOCUS_API_URL` env var (defaults to `http://localhost:4444`)
- **Features:** Full CRUD for todos/labels/notebook/notes, subtask management, GitHub PR tracking, year stats
- **taskNumber system:** Todos have auto-increment `taskNumber` for easy CLI reference (e.g. "complete task 7")
- **Rich text:** Converts plain text to HTML for TipTap editor (bold, italic, lists)

### Building
```bash
cd mcp-server && npm run build
```

## Database Commands (Prisma 7)

This project uses Prisma 7, which requires the `--config` flag for all CLI commands. npm scripts are provided:

```bash
npm run db:push        # Sync schema to DB (recommended for dev)
npm run db:migrate     # Run migrations (requires CREATE DATABASE permission)
npm run db:generate    # Generate Prisma client
npm run db:studio      # Open Prisma Studio
```

Or manually:
```bash
npx prisma db push --config prisma/prisma.config.ts
npx prisma migrate dev --name <name> --config prisma/prisma.config.ts
npx prisma generate --config prisma/prisma.config.ts
npx prisma studio --config prisma/prisma.config.ts
```

### Prisma 7 Notes
- The `datasource.url` is configured in `prisma/prisma.config.ts`, not in `schema.prisma`
- Binary targets: `native` + `linux-musl-arm64-openssl-3.0.x` (for Docker ARM64)
- Use `db push` for quick schema sync (no shadow database needed)
- Use `migrate dev` for production-ready migrations (requires DB user to have CREATE DATABASE permission)

## Icon Management

The app uses a **pixel art SVG** as the source of truth for all icons and favicons.

### Icon Files
- **Source:** `public/icon.svg` - The master pixel art SVG (16x16 grid)
- **Generated PNGs:** All PNG/ICO files are auto-generated from the SVG
  - `icon-192.png` - PWA icon (192x192)
  - `icon-512.png` - PWA icon (512x512)
  - `apple-touch-icon.png` - iOS home screen icon (180x180)
  - `favicon-48.png` - Browser favicon (48x48)
  - `favicon.png` - Browser favicon (32x32)
  - `favicon.ico` - Legacy favicon (32x32)

### Updating Icons

**When you modify `icon.svg`, you MUST regenerate all PNG files:**

```bash
node scripts/generate-icons.js
```

This script uses Sharp to convert the SVG to all required PNG sizes while preserving the pixel-perfect art (using `kernel: 'nearest'` for no blur).

### PWA Manifest Cache Busting

After regenerating icons:

1. **Update version in `public/manifest.json`:**
   - Change `?v=3` to `?v=4` (or next number) on all icon URLs
   - Also update `start_url` version parameter

2. **Rebuild Docker (if using Docker):**
   ```bash
   docker-compose down && docker-compose build --no-cache && docker-compose up -d
   ```

3. **Force Chrome PWA to update:**
   - Uninstall PWA: `chrome://apps` → Remove app
   - Clear site data: DevTools → Application → Clear site data
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Reinstall PWA from browser

### Why This Matters
Chrome **aggressively caches** PWA icons and manifests. Simply updating the files won't work - you need cache-busting query parameters (`?v=X`) to force browsers to fetch new icons.
