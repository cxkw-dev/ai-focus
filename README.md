# Focus

A personal productivity app with todos, notebook, and year-in-review stats. Built with Next.js 16, Prisma 7, PostgreSQL, and Tailwind CSS v4.

## Features

- **Todos** with subtasks, labels, priority levels, drag-and-drop reordering, and archiving
- **Blocked card collapsing** — On Hold, Waiting, and Under Review cards auto-collapse to compact rows so active work stands out
- **Label-based columns** — todos are organized into columns by label
- **GitHub PR tracking** — link PRs to todos and see merge status
- **Notebook** — rich text editor (TipTap) with multiple notes and pinning
- **Scratch pad** — quick persistent note in a dedicated area on the notes page
- **Year-in-review** — stats and charts for completed work
- **5 themes** — Midnight Peach, Discord, Anthropic, Atom One Dark, Tron Legacy
- **Real-time sync** — SSE-based updates across tabs
- **PWA** — installable as a Chrome desktop app
- **MCP server** — Claude Code integration via Model Context Protocol

## Prerequisites

- **Node.js** 22+
- **PostgreSQL** 15+ running locally (e.g. `brew install postgresql@17`)

Docker is **not required** for development — it's only used for production-like deployments.

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/cxkw-dev/ai-focus.git
cd ai-focus
npm install
```

### 2. Set up the database

Create a PostgreSQL database:

```bash
createdb aifocus
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your database connection:

```env
DATABASE_URL="postgresql://your_user@localhost:5432/aifocus"
```

The `GITHUB_TOKEN` and `AZURE_DEVOPS` variables are optional — only needed if you want PR/work item status tracking.

**Leave `GITHUB_TOKEN` empty and deploy with `./scripts/up.sh`** (or `npm run docker:up`) — the script sources a token from the logged-in `gh` CLI, which carries your account's full access across every org you belong to. A value in `.env` overrides the `gh` fallback, but beware: fine-grained personal access tokens are scoped to a **single resource owner**, so one PAT can never cover repos from two different orgs, and it returns **404 (not 403)** for anything outside its scope. If tracked repos span multiple orgs, the `gh` token is the only single-token option.

Optional local AI powers the completed-task accomplishment classifier. Ollama is still supported, but on Apple Silicon you can use oMLX instead:

```env
AI_PROVIDER="omlx"
AI_URL="http://localhost:11435/v1"
AI_MODEL="gemma-4-26b-a4b-it-4bit"
AI_API_KEY="your-omlx-api-key"
```

When running the app in Docker and oMLX on the host Mac, use `AI_URL="http://host.docker.internal:11435/v1"`.

### 4. Push the database schema

```bash
npm run db:push
```

This syncs the Prisma schema directly to your database. No migrations or shadow database needed for development.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:4444](http://localhost:4444). Hot reload is enabled — changes show up instantly.

## Docker (Optional)

For production-like deployments. PostgreSQL still runs on the host machine.

```bash
npm run deploy       # rebuild the image + restart + verify (after code changes)
npm run docker:up    # restart without rebuilding (after .env/token changes)
npm run docker:down  # stop
npm run docker:logs  # tail logs
```

The container connects to your host PostgreSQL via `host.docker.internal:5432`. To customize, set `DOCKER_DATABASE_URL` in your `.env`.

### GitHub token and deploy verification

**Always deploy with `npm run deploy` or `npm run docker:up` — never plain `docker compose up -d`.** Both routes go through `scripts/up.sh`, which:

1. Resolves the GitHub token (`.env` value if set, otherwise the logged-in `gh` CLI) and verifies it authenticates before touching the container.
2. Runs `docker compose up -d`.
3. Waits for the app, then smoke-tests the badge endpoint against `GITHUB_SMOKE_URL` from `.env` — so a deploy with a broken token fails loudly instead of silently shipping dead badges.

Plain `docker compose up -d` skips the token injection and all verification; historically, mixing entry points is exactly why badges worked after some deploys and not others.

All secrets (including `GITHUB_TOKEN`) are **runtime env vars, not baked into the image** — `npm run docker:up` picks up token/env changes without a rebuild; `npm run deploy` rebuilds first and is only needed for code changes.

## Install as Desktop App

1. Open http://localhost:4444 in Chrome
2. Click the install icon in the address bar (or Menu > "Install Focus...")
3. The app opens in its own window

## Database Commands

This project uses Prisma 7 with a TypeScript config file. npm scripts handle the `--config` flag:

| Command               | Description                                 |
| --------------------- | ------------------------------------------- |
| `npm run db:push`     | Sync schema to DB (recommended for dev)     |
| `npm run db:migrate`  | Run migrations (needs CREATE DB permission) |
| `npm run db:generate` | Regenerate Prisma client                    |
| `npm run db:studio`   | Open Prisma Studio (visual DB browser)      |

## Scripts

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `npm run dev`       | Start dev server (port 4444) |
| `npm run build`     | Production build             |
| `npm run start`     | Start production server      |
| `npm run lint`      | Run ESLint                   |
| `npm run lint:fix`  | Run ESLint with auto-fix     |
| `npm run typecheck` | TypeScript type checking     |
| `npm run test`      | Run tests                    |
| `npm run validate`  | Format + lint + test + build |

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19)
- **Database:** PostgreSQL with Prisma 7
- **Styling:** Tailwind CSS v4 with CSS custom properties
- **State:** React Query (TanStack Query)
- **Rich Text:** TipTap v3
- **Charts:** Recharts
- **Drag & Drop:** @dnd-kit
- **UI Primitives:** Radix UI
- **Animations:** Framer Motion
- **Validation:** Zod v4

## Project Structure

```
src/
  app/              # Next.js App Router pages and API routes
    (dashboard)/    # Main pages: notes, projects, labels, review, settings
    api/            # REST API endpoints
  components/       # React components
    todos/          # Todo cards, forms, drawers
    notes/          # Notebook editor and sidebar
    layout/         # Sidebar, header
    ui/             # Base UI primitives
  hooks/            # Custom hooks (use-todos, use-labels, etc.)
  lib/              # API client, themes, utilities
  types/            # TypeScript type definitions
prisma/             # Database schema and config
mcp-server/         # MCP server for Claude Code integration
```

## License

MIT
