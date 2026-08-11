#!/usr/bin/env bash
# Start (or recreate) the ai-focus app with a verified GitHub token.
# This is the only supported way to deploy — aliased as `npm run docker:up`,
# and `npm run deploy` runs it after a rebuild.
#
# Token sourcing: a non-empty GITHUB_TOKEN in .env wins; otherwise the token
# comes from the logged-in `gh` CLI. The gh token carries the account's full
# multi-org access — a fine-grained PAT is scoped to one org and cannot span
# kyndryl-emu-cio + kyndryl-agentic-ai, so don't "upgrade" to one.
#
# After compose up, the script waits for the app and smoke-tests the GitHub
# badge endpoint (GITHUB_SMOKE_URL in .env) so a deploy with a broken token
# fails loudly instead of silently shipping dead badges.
#
# Usage:  ./scripts/up.sh            # = docker compose up -d
#         ./scripts/up.sh --build    # extra args pass through to compose
set -euo pipefail
cd "$(dirname "$0")/.."

APP_URL="http://localhost:4444"

env_get() { sed -n "s/^$1=//p" .env 2>/dev/null | head -n1 | tr -d '"'; }

# --- 1. Resolve the GitHub token (.env wins, gh CLI is the fallback) -------
env_token="$(env_get GITHUB_TOKEN)"

if [ -n "$env_token" ]; then
  GITHUB_TOKEN="$env_token" # also overrides any stale shell export
else
  if ! command -v gh >/dev/null 2>&1; then
    echo "error: gh (GitHub CLI) not found. Install it or set GITHUB_TOKEN in .env." >&2
    exit 1
  fi
  if ! gh auth status >/dev/null 2>&1; then
    echo "error: gh is not logged in. Run: gh auth login" >&2
    exit 1
  fi
  GITHUB_TOKEN="$(gh auth token)"
fi
export GITHUB_TOKEN

# --- 2. Fail fast if the token doesn't authenticate ------------------------
if ! curl -fsS -o /dev/null -H "Authorization: Bearer ${GITHUB_TOKEN}" https://api.github.com/user; then
  echo "✗ GitHub token does not authenticate (revoked or expired?). Aborting deploy." >&2
  exit 1
fi
echo "✓ GitHub token authenticates"

# --- 3. Deploy -------------------------------------------------------------
docker compose up -d "$@"

# --- 4. Wait for the app, then smoke-test the badge endpoint ---------------
printf 'waiting for app'
for _ in $(seq 1 30); do
  if curl -fs -o /dev/null "$APP_URL/"; then
    break
  fi
  printf '.'
  sleep 2
done
echo

if ! curl -fs -o /dev/null "$APP_URL/"; then
  echo "✗ app did not come up at $APP_URL — check: npm run docker:logs" >&2
  exit 1
fi
echo "✓ app is up at $APP_URL"

smoke_url="$(env_get GITHUB_SMOKE_URL)"
if [ -n "$smoke_url" ]; then
  case "$smoke_url" in
    */pull/*) endpoint="pr-status" ;;
    *) endpoint="issue-status" ;;
  esac
  if ! body="$(curl -sS "$APP_URL/api/github/${endpoint}?url=${smoke_url}")"; then
    echo "✗ GitHub badge smoke test failed: could not reach the app endpoint." >&2
    exit 1
  fi
  if printf '%s' "$body" | grep -q '"error"'; then
    echo "✗ GitHub badge smoke test FAILED — badges will be dead: $body" >&2
    exit 1
  fi
  echo "✓ GitHub badges live (checked ${smoke_url#https://github.com/})"
else
  echo "note: set GITHUB_SMOKE_URL in .env to smoke-test badges on every deploy."
fi

echo "✓ deploy OK"
