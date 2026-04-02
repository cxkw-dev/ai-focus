# Desktop 3-Column Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the desktop todos page from 5 dynamic columns into 3 fixed columns (KAF, Projects, Others) with project sub-tabs inside the Projects column.

**Architecture:** Add a `buildDesktopColumns()` function that groups all `PROJECT - *` labels into a single "Projects" column. Extend `TodoColumn` with an optional `subLabels` prop that renders sub-tabs for filtering within a column. Update the desktop grid in `page.tsx` to use the new 3-column layout.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, CSS custom properties

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/categorize-todos.ts` | Modify | Add `buildDesktopColumns()` function + `SubLabel` type |
| `src/components/todos/todo-column.tsx` | Modify | Add `subLabels` prop, sub-tab UI, internal filtering |
| `src/app/(dashboard)/todos/page.tsx` | Modify | Use `buildDesktopColumns` for desktop grid, pass `subLabels` |

---

### Task 1: Add `buildDesktopColumns()` to categorize-todos.ts

**Files:**
- Modify: `src/lib/categorize-todos.ts`

- [ ] **Step 1: Add SubLabel type and buildDesktopColumns function**

Add a new exported type and function. The function groups all labels whose name starts with `PROJECT - ` into a single "Projects" column, keeping KAF and Others as separate columns. The Projects column stores individual project labels as `subLabels` so the UI can offer sub-tab filtering.

```typescript
export interface SubLabel {
  id: string
  name: string    // display name (e.g. "AMEX", stripped of "PROJECT - " prefix)
  fullName: string // original label name (e.g. "PROJECT - AMEX")
  color: string
  labelId: string
}

/**
 * Build 3 fixed columns for desktop: KAF, Projects, Others.
 * All PROJECT-* labels are grouped into the Projects column with subLabels.
 * Non-project, non-KAF labels (except MERGED_INTO_OTHERS) each get their own column
 * placed before Others.
 */
export function buildDesktopColumns(labels: Label[]): ColumnConfig[] {
  const kaf = labels.find(l => l.name.toLowerCase() === 'kaf')
  const mergedLabels = labels.filter(l =>
    MERGED_INTO_OTHERS.includes(l.name.toLowerCase())
  )
  const projectLabels = labels
    .filter(l => l.name.startsWith('PROJECT - '))
    .sort((a, b) => a.name.localeCompare(b.name))

  const otherColumnLabels = labels.filter(l =>
    l !== kaf &&
    !mergedLabels.includes(l) &&
    !projectLabels.includes(l)
  )

  const columns: ColumnConfig[] = []

  // KAF column
  if (kaf) {
    columns.push({
      key: kaf.id,
      title: kaf.name,
      color: kaf.color,
      labelId: kaf.id,
    })
  }

  // Projects column (groups all PROJECT-* labels)
  if (projectLabels.length > 0) {
    columns.push({
      key: 'projects',
      title: 'Projects',
      color: projectLabels[0].color,
      labelIds: projectLabels.map(l => l.id),
      subLabels: projectLabels.map(l => ({
        id: l.id,
        name: l.name.replace('PROJECT - ', ''),
        fullName: l.name,
        color: l.color,
        labelId: l.id,
      })),
    })
  }

  // Any non-project, non-KAF, non-merged labels get their own column
  for (const label of otherColumnLabels) {
    columns.push({
      key: label.id,
      title: label.name,
      color: label.color,
      labelId: label.id,
    })
  }

  // Others column
  columns.push({
    key: 'others',
    title: 'Others',
    color: 'var(--status-waiting)',
    labelIds: mergedLabels.map(l => l.id),
  })

  return columns
}
```

- [ ] **Step 2: Add `subLabels` to `ColumnConfig` interface**

Update the existing `ColumnConfig` interface to include the optional `subLabels` field:

```typescript
export interface ColumnConfig {
  key: string
  title: string
  color: string
  labelId?: string
  labelIds?: string[]
  subLabels?: SubLabel[]  // <-- add this
}
```

- [ ] **Step 3: Verify the build compiles**

Run: `npx next build --no-lint 2>&1 | head -20` or check the dev server for errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/categorize-todos.ts
git commit -m "add buildDesktopColumns function for 3-column layout"
```

---

### Task 2: Add sub-tab UI to TodoColumn

**Files:**
- Modify: `src/components/todos/todo-column.tsx`

- [ ] **Step 1: Add subLabels prop to TodoColumnProps**

```typescript
// Add import at top
import type { SubLabel } from '@/lib/categorize-todos'

// Add to TodoColumnProps interface:
subLabels?: SubLabel[]
```

- [ ] **Step 2: Add sub-tab state and filtering logic**

Inside the `TodoColumn` component, add state for the active sub-tab and filter the displayed todos:

```typescript
// After existing state declarations:
const [activeSubLabel, setActiveSubLabel] = React.useState<string | null>(null)

// Filter todos by sub-label when sub-tabs are active
const filteredActiveTodos = React.useMemo(() => {
  if (!subLabels || !activeSubLabel) return activeTodos
  return activeTodos.filter(todo =>
    todo.labels?.some(l => l.id === activeSubLabel)
  )
}, [activeTodos, subLabels, activeSubLabel])

const filteredCompletedTodos2 = React.useMemo(() => {
  if (!subLabels || !activeSubLabel) return completedTodos
  return completedTodos.filter(todo =>
    todo.labels?.some(l => l.id === activeSubLabel)
  )
}, [completedTodos, subLabels, activeSubLabel])

const filteredDeletedTodos = React.useMemo(() => {
  if (!subLabels || !activeSubLabel) return deletedTodos
  return deletedTodos.filter(todo =>
    todo.labels?.some(l => l.id === activeSubLabel)
  )
}, [deletedTodos, subLabels, activeSubLabel])
```

Then update `displayedTodos`, `tabs` counts, and drag-and-drop to use the filtered versions instead of the raw props.

- [ ] **Step 3: Add sub-tab UI rendering**

Render sub-tabs between the column title row and the filter tabs. Style them as small pill buttons matching the existing design language:

```tsx
{/* Sub-label tabs (for Projects column) */}
{subLabels && subLabels.length > 0 && (
  <div className="flex items-center gap-1 mt-1.5 overflow-x-auto scrollbar-hide">
    <button
      onClick={() => setActiveSubLabel(null)}
      className="rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors whitespace-nowrap"
      style={activeSubLabel === null ? {
        backgroundColor: 'color-mix(in srgb, var(--primary) 18%, transparent)',
        color: 'var(--primary)',
      } : {
        color: 'var(--text-muted)',
      }}
    >
      All
    </button>
    {subLabels.map((sub) => (
      <button
        key={sub.id}
        onClick={() => setActiveSubLabel(sub.labelId)}
        className="rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors whitespace-nowrap"
        style={activeSubLabel === sub.labelId ? {
          backgroundColor: `color-mix(in srgb, ${sub.color} 18%, transparent)`,
          color: sub.color,
        } : {
          color: 'var(--text-muted)',
        }}
      >
        {sub.name}
      </button>
    ))}
  </div>
)}
```

- [ ] **Step 4: Update defaultLabelIds for create**

When a sub-tab is active and the user creates a todo from this column, the new todo should get the active sub-label. Pass the active sub-label ID through `defaultLabelIds` or add logic so the inline form defaults to the selected project label.

- [ ] **Step 5: Verify in dev server**

Check that the sub-tabs render, filter correctly, and don't break drag-and-drop.

- [ ] **Step 6: Commit**

```bash
git add src/components/todos/todo-column.tsx
git commit -m "add sub-tab filtering to todo column for grouped labels"
```

---

### Task 3: Wire up desktop grid to use 3 columns

**Files:**
- Modify: `src/app/(dashboard)/todos/page.tsx`

- [ ] **Step 1: Import and use buildDesktopColumns**

```typescript
import { buildColumns, buildDesktopColumns, categorizeTodosByLabel } from '@/lib/categorize-todos'
```

Create separate column configs for mobile and desktop:

```typescript
// Existing (for mobile)
const columns = React.useMemo(() => buildColumns(labels), [labels])

// New (for desktop)
const desktopColumns = React.useMemo(() => buildDesktopColumns(labels), [labels])

// Separate categorization for desktop
const desktopCategorizedActive = React.useMemo(
  () => categorizeTodosByLabel(todos, desktopColumns), [todos, desktopColumns]
)
const desktopCategorizedCompleted = React.useMemo(
  () => categorizeTodosByLabel(completedTodos, desktopColumns), [completedTodos, desktopColumns]
)
const desktopCategorizedDeleted = React.useMemo(
  () => categorizeTodosByLabel(deletedTodos, desktopColumns), [deletedTodos, desktopColumns]
)
```

- [ ] **Step 2: Update the desktop grid JSX**

Replace the desktop `columns.map` with `desktopColumns.map` and pass `subLabels`:

```tsx
{/* Desktop View (>= 1280px) */}
<div className="hidden xl:flex xl:flex-col flex-1 min-h-0">
  <div
    className="gap-6 flex-1 min-h-0"
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${desktopColumns.length}, minmax(0, 1fr))`,
    }}
  >
    {desktopColumns.map((col) => (
      <TodoColumn
        key={col.key}
        title={col.title}
        color={col.color}
        activeTodos={desktopCategorizedActive[col.key] ?? []}
        completedTodos={desktopCategorizedCompleted[col.key] ?? []}
        deletedTodos={desktopCategorizedDeleted[col.key] ?? []}
        subLabels={col.subLabels}
        onEdit={handleEdit}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onDelete={handleDelete}
        onPermanentDelete={handlePermanentDelete}
        onRestore={handleRestore}
        onToggleSubtask={handleToggleSubtask}
        onUpdateSubtasks={handleUpdateSubtasks}
        onOpenNote={handleOpenNote}
        onReorder={handleReorder}
        onCreateTodo={handleCreate}
        isSaving={isSaving}
        defaultLabelIds={col.labelId ? [col.labelId] : []}
        people={people}
        subtaskMentions={subtaskMentions}
        showInlineForm={false}
        compact={compact}
      />
    ))}
  </div>
</div>
```

- [ ] **Step 3: Verify the full layout in browser**

Open http://localhost:4444/todos at 1440px width. Verify:
- 3 columns visible: KAF, Projects, Others
- Projects column shows sub-tabs (All | AMEX | DMV | DOW)
- Clicking sub-tabs filters the project todos
- Active/Completed/Deleted filters still work within each column
- Drag and drop still works
- Mobile view is unchanged (still uses original `columns`)

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/todos/page.tsx
git commit -m "use 3-column desktop layout with project sub-tabs"
```
