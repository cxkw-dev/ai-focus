#!/usr/bin/env bash
# Start (or recreate) the ai-focus app with a GitHub token sourced from the
# locally authenticated `gh` CLI, so PR/issue title + status badges work
# without keeping a personal access token in .env.
#
# Usage:  ./scripts/up.sh            # = docker compose up -d
#         ./scripts/up.sh --build    # extra args pass through to compose
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v gh >/dev/null 2>&1; then
  echo "error: gh (GitHub CLI) not found. Install it or set GITHUB_TOKEN in .env." >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "error: gh is not logged in. Run: gh auth login" >&2
  exit 1
fi

export GITHUB_TOKEN="$(gh auth token)"
exec docker compose up -d "$@"
