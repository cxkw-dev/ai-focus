# AI Focus - Claude Instructions

## Project Overview
A Next.js 16 todo/task productivity app with Prisma, PostgreSQL, and Tailwind CSS.

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

- **Framework:** Next.js 16 with App Router
- **Styling:** Tailwind CSS v4 with CSS custom properties
- **Database:** PostgreSQL with Prisma ORM
- **UI Components:** Radix UI primitives
- **Animations:** Framer Motion
- **Theme:** next-themes for dark mode

## Theme System

The app uses a **dynamic theme switcher** with multiple color themes. Users can switch themes via the dropdown in the header.

### Available Themes

| Theme | Primary | Description |
|-------|---------|-------------|
| Midnight Peach | Peach/coral | Warm peach tones on dark (default) |
| Discord | Blurple | Classic Discord look |
| Anthropic | Terracotta | Warm coral/earth tones |
| Atom One Dark | Blue | Classic developer editor theme |

### Theme Architecture

- **Theme definitions:** `src/lib/themes.ts` - All theme colors defined here
- **Theme provider:** `src/components/providers/theme-provider.tsx` - Context + localStorage persistence
- **Theme switcher:** `src/components/layout/header.tsx` - Dropdown UI
- **CSS variables:** Applied dynamically via `applyTheme()` function

### Adding a New Theme

1. Add theme object to `themes` array in `src/lib/themes.ts`
2. Include all required color properties (background, surface, primary, accent, status colors, etc.)
3. Theme will automatically appear in the dropdown

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
| `--status-*` | Todo status colors |
| `--priority-*` | Priority level colors |

## Key Directories

```
src/
├── app/              # Next.js app router pages
├── components/
│   ├── layout/       # Sidebar, Header, DashboardLayout
│   ├── todos/        # Todo components (TodoItem, TodoForm, etc.)
│   ├── ui/           # Base UI components (Button, Input, etc.)
│   └── providers/    # Theme provider
├── lib/              # Utilities and Prisma client
└── types/            # TypeScript types
prisma/
└── schema.prisma     # Database schema
```

## Responsive Layout Architecture

The app has **separate UI components for desktop and mobile**, not just CSS breakpoints. When making changes, you must identify and update the correct component for each viewport.

### Task Creation

| Viewport | Component | File | Style |
|----------|-----------|------|-------|
| Desktop (>= 1280px) | `InlineTodoForm` | `src/components/todos/todo-form.tsx` | Compact inline card with toolbar rows. Priority/Date/Category/Labels use small trigger buttons and dropdowns. |
| Mobile (< 1280px) | `CreateTodoModal` | `src/components/todos/todo-form.tsx` | Full dialog modal triggered by FAB. Fields are stacked vertically with more room. |

### Task Editing

| Viewport | Component | File | Style |
|----------|-----------|------|-------|
| All sizes | `TodoForm` | `src/components/todos/todo-form.tsx` | Dialog modal. Two-column on `md+` (content left, meta right). Single-column stacked on mobile. |

### Layout Rules

- **InlineTodoForm (desktop):** Keep controls compact. Use dropdowns/popovers for selectors, not inline lists. Everything should fit in tight toolbar rows.
- **CreateTodoModal (mobile):** More vertical space available. Fields can be stacked full-width. Dropdowns are preferred over inline quick-pick lists to conserve scroll height.
- **TodoForm (edit):** Two-column at `md+` breakpoint. Left: title + description. Right: status, priority, due date, category, labels (with border-left separator).
- The main page layout is in `src/app/todos/page.tsx` — desktop shows `InlineTodoForm` + todo list + scratch pad in columns; mobile shows tabs + FAB.

## Database Commands (Prisma 7)

This project uses Prisma 7, which requires the `--config` flag for all CLI commands.

**Sync schema to database (recommended for dev):**
```bash
npx prisma db push --config prisma/prisma.config.ts
```

**Run migrations (requires DB create permission):**
```bash
npx prisma migrate dev --name <migration_name> --config prisma/prisma.config.ts
```

**Generate Prisma client:**
```bash
npx prisma generate --config prisma/prisma.config.ts
```

**Open Prisma Studio:**
```bash
npx prisma studio --config prisma/prisma.config.ts
```

### Prisma 7 Notes
- The `datasource.url` is configured in `prisma/prisma.config.ts`, not in `schema.prisma`
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
