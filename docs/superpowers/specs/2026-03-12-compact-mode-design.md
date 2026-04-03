# Compact Mode — Todo Density Toggle

## Summary

A global toggle button on the todos page that switches all columns between "comfortable" (current) and "compact" view modes, allowing ~40% more cards to be visible without scrolling on laptop screens.

## Motivation

As the task list grows, laptop screens require excessive scrolling to see all active todos. A compact mode reduces per-card height by hiding non-essential details (descriptions, subtasks) while preserving all actionable elements.

## Design

### Toggle Button

- **Location:** Above the 3-column grid in `page.tsx` (desktop), and next to the category tab bar (mobile). A small toolbar row.
- **Icon:** `Rows3` or `LayoutList` from lucide-react; highlighted/active state when compact mode is on
- **Scope:** Global — affects all 3 columns (KAF, Projects, Others) simultaneously, across active/completed/deleted views
- **Persistence:** localStorage key `ai-focus-compact-mode` (boolean)
- **Visible on mobile:** Yes — the toggle renders on both desktop and mobile

### Compact Mode Changes to TodoItemContent

The rendering logic lives in `TodoItemContent` (not the outer `TodoItem` wrapper). The `compact` prop threads through: `TodosPage` → `TodoColumn` → `TodoItem` → `TodoItemContent`. `TodoItemOverlay` (drag overlay) must also receive and forward `compact` to stay visually consistent during drag.

| Element                             | Comfortable (current)                  | Compact                                                           |
| ----------------------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| Description                         | Visible                                | Hidden                                                            |
| Subtasks list                       | Fully rendered (toggle, reorder, edit) | Hidden; replaced by inline count badge (e.g. `2/4`) next to title |
| Card padding (`TodoItem` outer div) | `py-2.5 px-3`                          | `py-1.5 px-2.5`                                                   |
| Title/description container padding | `px-2.5 py-2`                          | `px-2 py-1.5`                                                     |
| Status chip                         | Visible                                | Visible                                                           |
| Priority chip                       | Visible                                | Visible                                                           |
| Label chips                         | Visible                                | Visible                                                           |
| Task number                         | Visible                                | Visible                                                           |
| Due date                            | Visible                                | Visible                                                           |
| PR badges                           | Visible                                | Visible                                                           |
| Action buttons (edit, delete)       | Visible                                | Visible                                                           |
| Drag handle                         | Visible                                | Visible                                                           |
| Contacts tab                        | Visible                                | Visible                                                           |

### Subtask Count Badge (Compact Only)

- Displayed inline next to the todo title, right-aligned
- Format: `completedCount/totalCount` with a small checkmark icon
- Color: `var(--status-done)` when all complete, `var(--text-muted)` otherwise
- Only shown when the todo has subtasks
- Font size: `10px`, flex-shrink: 0

### State Management

- `compact` boolean state in `TodosPage` component
- Initialized from `localStorage.getItem('ai-focus-compact-mode')`
- Toggled via the header button, persisted on change
- Passed as `compact` prop through `TodoColumn` → `TodoItem` → `TodoItemContent` (and `TodoItemOverlay`)

## Files to Modify

1. **`src/app/(dashboard)/todos/page.tsx`** — Add compact state + toggle button + pass prop to columns
2. **`src/components/todos/todo-column.tsx`** — Accept and forward `compact` prop to TodoItem
3. **`src/components/todos/todo-item.tsx`** — Conditionally hide description, subtasks; show count badge; adjust padding

## Out of Scope

- Per-column independent density settings
- More than 2 density levels
- Hover-to-expand behavior
- Mobile-specific compact behavior (mobile already uses single-column tab layout)
