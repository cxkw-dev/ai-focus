# PR "Behind Main" Indicator

## Summary
Add a visible "behind main" indicator to My PR badges on todo cards so the user knows when a rebase is needed.

## Design

### API Change (`src/app/api/github/pr-status/route.ts`)
- For open PRs, call the GitHub compare API: `GET /repos/{owner}/{repo}/compare/{base}...{head}`
- Extract `behind_by` from the response
- Return as `behindBy` in the PR status response

### Type Change (`src/types/todo.ts`)
- Add `behindBy?: number` to `GitHubPrStatus`

### UI Change (`src/components/todos/github-pr-badge.tsx`)
- When `behindBy > 0` and PR is open, append a warning-colored indicator inside the existing badge chip
- Format: down arrow + count (e.g., "↓5")
- Color: orange (#d29922) to stand out clearly against the badge
- Positioned after the status label, before the PR number

### Scope
- Only applies to My PRs (`myPrUrls`) — the single `GitHubPrBadge` component
- `GitHubPrRow` (used for "waiting on" PRs) is unchanged
- Only fires the compare API call for open PRs (not merged/closed)
