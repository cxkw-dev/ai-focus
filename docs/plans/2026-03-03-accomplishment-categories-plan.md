# Accomplishment Categorization Improvements — Implementation Plan

**Goal:** Add an OTHER category for edge-case accomplishments, rewrite the Ollama agent prompt to exclude admin/operational tasks and remove inclusion bias.

**Architecture:** Schema change (new enum value) propagated through all layers: Prisma → API validation → agent code → types → UI components → themes → MCP server. The agent prompt is rewritten with neutral bias and explicit admin exclusion rules.

**Tech Stack:** Prisma 7 (PostgreSQL enum), Next.js 16 API routes, React 19, Tailwind CSS v4, Ollama (local LLM)

---

### Task 1: Add OTHER to Prisma enum and push schema

**Files:**

- Modify: `prisma/schema.prisma:119-125`

**Step 1: Add OTHER to the AccomplishmentCategory enum**

In `prisma/schema.prisma`, change the enum to:

```prisma
enum AccomplishmentCategory {
  DELIVERY
  HIRING
  MENTORING
  COLLABORATION
  GROWTH
  OTHER
}
```

**Step 2: Push schema to database**

Run: `npm run db:push`
Expected: Schema synced, `AccomplishmentCategory` enum updated in PostgreSQL.

**Step 3: Regenerate Prisma client**

Run: `npm run db:generate`
Expected: Prisma client regenerated with OTHER in the enum.

**Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "add OTHER to accomplishment category enum"
```

---

### Task 2: Add OTHER to API route validation arrays

**Files:**

- Modify: `src/app/api/accomplishments/route.ts:5`
- Modify: `src/app/api/accomplishments/[id]/route.ts:5`

**Step 1: Update both CATEGORIES arrays**

In both files, change line 5 from:

```ts
const CATEGORIES = [
  'DELIVERY',
  'HIRING',
  'MENTORING',
  'COLLABORATION',
  'GROWTH',
] as const
```

to:

```ts
const CATEGORIES = [
  'DELIVERY',
  'HIRING',
  'MENTORING',
  'COLLABORATION',
  'GROWTH',
  'OTHER',
] as const
```

**Step 2: Commit**

```bash
git add src/app/api/accomplishments/route.ts src/app/api/accomplishments/\[id\]/route.ts
git commit -m "add OTHER to api route category validation"
```

---

### Task 3: Add OTHER to TypeScript type

**Files:**

- Modify: `src/types/accomplishment.ts:1-6`

**Step 1: Add OTHER to the union type**

Change the type to:

```ts
export type AccomplishmentCategory =
  | 'DELIVERY'
  | 'HIRING'
  | 'MENTORING'
  | 'COLLABORATION'
  | 'GROWTH'
  | 'OTHER'
```

**Step 2: Commit**

```bash
git add src/types/accomplishment.ts
git commit -m "add OTHER to accomplishment category type"
```

---

### Task 4: Add categoryOther to theme system

**Files:**

- Modify: `src/lib/themes.ts` (ThemeColors interface + all 5 theme objects + applyTheme function)
- Modify: `src/app/globals.css:98-103` (default CSS variables)

**Step 1: Add categoryOther to ThemeColors interface**

In `src/lib/themes.ts`, add after `categoryGrowth: string` (line 56):

```ts
categoryOther: string
```

**Step 2: Add categoryOther color to each theme**

Add after `categoryGrowth` in each theme's colors object:

- **Midnight Peach:** `categoryOther: '#E8B4B8'` (soft dusty rose — distinct from the peach/coral tones)
- **Discord:** `categoryOther: '#A0A0A0'` (neutral gray)
- **Anthropic:** `categoryOther: '#B8A99A'` (warm taupe)
- **Atom One Dark:** `categoryOther: '#ABB2BF'` (Atom's default text gray)
- **Tron Legacy:** `categoryOther: '#8899AA'` (muted steel blue)

**Step 3: Add CSS variable to applyTheme function**

After line 404 (`root.style.setProperty('--category-growth', ...)`), add:

```ts
root.style.setProperty('--category-other', colors.categoryOther)
```

**Step 4: Add default CSS variable in globals.css**

In `src/app/globals.css`, after line 103 (`--category-growth: #C9B6AE;`), add:

```css
--category-other: #e8b4b8;
```

**Step 5: Commit**

```bash
git add src/lib/themes.ts src/app/globals.css
git commit -m "add category-other color to theme system"
```

---

### Task 5: Add OTHER to UI components

**Files:**

- Modify: `src/components/review/category-badge.tsx:6-11`
- Modify: `src/components/review/accomplishments-section.tsx:14-21`
- Modify: `src/components/review/accomplishment-dialog.tsx:13-19`

**Step 1: Add OTHER to category-badge.tsx**

Add after the GROWTH entry in CATEGORY_CONFIG:

```ts
  OTHER: { label: 'Other', cssVar: '--category-other' },
```

**Step 2: Add OTHER to accomplishments-section.tsx filter**

Add after the GROWTH entry in FILTER_OPTIONS:

```ts
  { value: 'OTHER', label: 'Other' },
```

**Step 3: Add OTHER to accomplishment-dialog.tsx dropdown**

Add after the GROWTH entry in CATEGORIES:

```ts
  { value: 'OTHER', label: 'Other' },
```

**Step 4: Commit**

```bash
git add src/components/review/category-badge.tsx src/components/review/accomplishments-section.tsx src/components/review/accomplishment-dialog.tsx
git commit -m "add OTHER category to ui components"
```

---

### Task 6: Rewrite agent prompt and update validation

**Files:**

- Modify: `src/lib/accomplishment-agent.ts:7-35` (PROMPT constant)
- Modify: `src/lib/accomplishment-agent.ts:132-135` (validCategories + fallback)

**Step 1: Replace the PROMPT constant**

Replace the entire PROMPT (lines 7-35) with:

```ts
const PROMPT = `You are a performance review assistant. A developer just completed a task. Decide if it belongs in their performance review and categorize it.

## Rules
1. EXCLUDE administrative and operational tasks that are NOT meaningful professional contributions:
   - Expense reports, reimbursements, timesheets, time tracking
   - Scheduling meetings, booking travel, booking rooms
   - Ordering supplies, equipment requests
   - Filling out routine forms, paperwork, compliance checklists
   - Password resets, account setup, access requests
   - Routine status updates, standup notes
   - Personal errands, appointments
   - Installing/updating software on your own machine (unless it's a team-wide tooling initiative)
2. Only include tasks that clearly represent meaningful professional contributions. If the task is ambiguous or borderline, do NOT include it.
3. Reject trivial tasks: typos, tiny config tweaks, version bumps, dependency updates.

## Categories
- DELIVERY: Features, PRs, technical contributions, bug fixes, architecture work
- HIRING: Interviews, candidate evaluation, hiring process improvements
- MENTORING: Onboarding, coaching, code review guidance, helping team members grow
- COLLABORATION: Cross-team work, stakeholder coordination, driving alignment
- GROWTH: Learning new technologies, certifications, skill development, conference talks, courses, reading, exploration
- OTHER: Meaningful accomplishments that don't fit the above categories

## Response format
Respond with ONLY valid JSON. No markdown, no explanation, no wrapping.

If it IS an accomplishment:
{"accomplishment":true,"category":"DELIVERY","title":"Professional, concise accomplishment title written in past tense (e.g. 'Implemented real-time notification system for user engagement')","description":"A 1-2 sentence professional description of the accomplishment suitable for a performance review. Focus on impact and outcome, not implementation details."}

If it is NOT an accomplishment:
{"accomplishment":false}

## Task info
Title: {TITLE}
Description: {DESCRIPTION}
Labels: {LABELS}`
```

**Step 2: Update validCategories array and fallback**

Change lines 132-135 from:

```ts
const validCategories = [
  'DELIVERY',
  'HIRING',
  'MENTORING',
  'COLLABORATION',
  'GROWTH',
] as const
const category = validCategories.includes(
  parsed.category as (typeof validCategories)[number],
)
  ? (parsed.category as (typeof validCategories)[number])
  : 'DELIVERY'
```

to:

```ts
const validCategories = [
  'DELIVERY',
  'HIRING',
  'MENTORING',
  'COLLABORATION',
  'GROWTH',
  'OTHER',
] as const
const category = validCategories.includes(
  parsed.category as (typeof validCategories)[number],
)
  ? (parsed.category as (typeof validCategories)[number])
  : 'OTHER'
```

Note: fallback changed from `'DELIVERY'` to `'OTHER'` — if Ollama returns an unrecognized category, it's better to fall back to OTHER than to inflate DELIVERY.

**Step 3: Commit**

```bash
git add src/lib/accomplishment-agent.ts
git commit -m "rewrite agent prompt with neutral bias and admin exclusions"
```

---

### Task 7: Update MCP server

**Files:**

- Modify: `mcp-server/src/index.ts:735-737`

**Step 1: Add OTHER to the enum and description**

Change the category field definition from:

```ts
    category: z
      .enum(["DELIVERY", "HIRING", "MENTORING", "COLLABORATION", "GROWTH"])
      .describe("Category: DELIVERY (features/PRs), HIRING (interviews), MENTORING (coaching), COLLABORATION (cross-team), GROWTH (learning)"),
```

to:

```ts
    category: z
      .enum(["DELIVERY", "HIRING", "MENTORING", "COLLABORATION", "GROWTH", "OTHER"])
      .describe("Category: DELIVERY (features/PRs), HIRING (interviews), MENTORING (coaching), COLLABORATION (cross-team), GROWTH (learning), OTHER (doesn't fit above)"),
```

**Step 2: Rebuild MCP server**

Run: `cd mcp-server && npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add mcp-server/src/index.ts
git commit -m "add OTHER category to mcp server"
```

---

### Task 8: Verify everything works end-to-end

**Step 1: Run the dev server**

User should already have `npm run dev` running. Verify no console errors.

**Step 2: Check the review page**

Navigate to /review. Verify:

- "Other" filter chip appears
- Creating a new accomplishment shows "Other" in the category dropdown
- Existing accomplishments still display correctly

**Step 3: Verify type safety**

Run: `npx tsc --noEmit`
Expected: No type errors.
