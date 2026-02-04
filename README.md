# AI Focus

A modern, minimal productivity app built with Next.js, PostgreSQL, and Anthropic-themed styling.

## Features

- **Todo List** - Full CRUD operations with priorities, categories, and due dates
- **Responsive Design** - Works on desktop and mobile
- **Dark/Light Theme** - Toggle between themes with Anthropic branding colors
- **Dockerized** - Run anywhere with Docker
- **PWA Ready** - Install as a Chrome desktop app

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- PostgreSQL with Prisma ORM
- Tailwind CSS
- Radix UI Components
- Framer Motion
- Docker

## Quick Start

### Prerequisites

- Node.js 20+ ([install](https://nodejs.org/))
- Docker ([install](https://www.docker.com/))

### Option 1: Full Docker Setup (Recommended for Colima)

1. Make sure Docker/Colima is running:
   ```bash
   colima start
   ```

2. Build and start the containers:
   ```bash
   # Using docker compose (plugin)
   docker compose up -d

   # OR using docker-compose (standalone)
   docker-compose up -d
   ```

3. Open http://localhost:4444 in your browser

### Option 2: Local Development

1. Run the setup script:
   ```bash
   ./scripts/setup.sh
   ```

   Or manually:
   ```bash
   npm install
   npm run db:generate
   ```

2. Start PostgreSQL:
   ```bash
   # Using helper script (no docker-compose needed)
   ./scripts/docker-run.sh

   # OR using docker compose
   docker compose up -d postgres
   ```

3. Push the database schema:
   ```bash
   npm run db:push
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:4444 in your browser

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 4444 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run docker:up` | Start Docker containers |
| `npm run docker:down` | Stop Docker containers |
| `npm run docker:build` | Build Docker image |
| `npm run docker:logs` | View container logs |

## Install as Chrome Desktop App

1. Open http://localhost:4444 in Chrome
2. Click the install icon in the address bar (or Menu → "Install AI Focus...")
3. The app will open in its own window, behaving like a native desktop app

## Configuration

The `.env` file is already configured for local development:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/aifocus"
```

## Ports

- **App**: 4444 (chosen to avoid conflicts with common ports)
- **PostgreSQL**: 5433 (external) / 5432 (internal)

## Project Structure

```
ai-focus/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   ├── todos/        # Todos page
│   │   └── settings/     # Settings page
│   ├── components/       # React components
│   │   ├── layout/       # Dashboard layout components
│   │   ├── todos/        # Todo feature components
│   │   ├── providers/    # Context providers
│   │   └── ui/           # Reusable UI components
│   ├── lib/              # Utilities and database client
│   └── types/            # TypeScript types
├── prisma/               # Database schema and migrations
├── public/               # Static assets and PWA manifest
├── scripts/              # Helper scripts
├── Dockerfile            # Docker build configuration
└── docker-compose.yml    # Docker Compose configuration
```

## Adding New Features

The codebase is organized to easily add new features:

1. Add new models in `prisma/schema.prisma`
2. Run `npm run db:push` to update the database
3. Create API routes in `src/app/api/[feature]/`
4. Add components in `src/components/[feature]/`
5. Create page in `src/app/[feature]/page.tsx`
6. Add navigation item in `src/components/layout/sidebar.tsx`

## Theme Customization

The app uses Anthropic brand colors with CSS variables defined in `src/app/globals.css`. To customize:

- Light theme colors are in `:root`
- Dark theme colors are in `.dark`
- Anthropic-specific colors are available via `anthropic-*` classes

## License

MIT
