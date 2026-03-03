# Accomplishment Categorization Improvements

## Problem

When completing admin/operational tasks (e.g., filing expense reports), the Ollama agent incorrectly creates accomplishments categorized as DELIVERY. Two root causes:

1. **Inclusion bias** — the prompt says "when in doubt, INCLUDE it", so borderline tasks always get included
2. **No admin category** — with only 5 categories, admin work gets shoehorned into the closest match
3. **No catch-all** — legitimate accomplishments that don't fit the 5 categories also get misclassified

## Design

### 1. Add OTHER category to Prisma enum

Add `OTHER` to `AccomplishmentCategory` enum for accomplishments that don't fit the main 5 categories.

### 2. Rewrite agent prompt with neutral bias and explicit exclusions

Key changes to the prompt in `src/lib/accomplishment-agent.ts`:

- **Remove** "when in doubt, INCLUDE it" bias
- **Add neutral guidance**: only include tasks that clearly represent meaningful professional contributions
- **Add explicit exclusion list** for admin/operational work:
  - Expense reports, reimbursements, timesheets
  - Scheduling meetings, booking travel/rooms
  - Ordering supplies, filling out routine forms
  - Password resets, account setup, access requests
  - Routine communication (status updates, standup notes)
  - Personal errands, admin paperwork
- **Add OTHER category** description for edge cases

### 3. Update category validation in agent code

Add `'OTHER'` to the `validCategories` array (line 132) so the agent can return it.

### 4. Update UI components

- `category-badge.tsx` — add OTHER to color/label mapping
- `accomplishments-section.tsx` — add OTHER to filter buttons
- `accomplishment-dialog.tsx` — add OTHER to category dropdown options

### 5. Add theme color

Add `--category-other` CSS variable to all themes in `src/lib/themes.ts`.

### 6. Update MCP server

Update category enum description in MCP tool definitions to include OTHER.

## What stays the same

- API routes (use Prisma enum, auto-pick up OTHER)
- Fire-and-forget async evaluation pattern
- Race condition defense
- SSE real-time updates
- React Query hooks (use API response data)
