# Task Contacts Feature Design

## Overview

Attach people (contacts) to tasks with a freeform role field. Contacts are accessed via a small tab on the right edge of each TodoItem card that slides open an overlay drawer.

## Data Model

New `TodoContact` join table linking `Todo` and `Person`:

- `id` (cuid), `todoId`, `personId`, `role` (String), `order` (Int)
- Cascade delete from both Todo and Person sides
- `@@unique([todoId, personId])` prevents duplicate assignments
- Reverse relations: `Todo.contacts`, `Person.todoContacts`

## API

`/api/todos/[id]/contacts` endpoint:

- `GET` — list contacts for a todo (includes person data)
- `POST` — add contact `{ personId, role }`
- `PATCH` — update `{ contactId, role?, order? }`
- `DELETE` — remove `{ contactId }`

All mutations emit SSE `'todos'` event.

## Hooks

`useTodoContacts(todoId)` — dedicated hook since contacts load on-demand when the drawer opens, not with every todo fetch.

## Types

```ts
interface TodoContact {
  id: string
  role: string
  order: number
  personId: string
  person: Person
}
```

`contacts?: TodoContact[]` added to `Todo` type (optional).

## UI — Drawer Tab (TodoItem)

- Small tab pinned to the right edge of each TodoItem card, always visible
- People icon (lucide `Users`)
- Count badge if todo has contacts
- Click toggles drawer open/closed

## UI — Contacts Drawer

- Slides out from right edge of card, overlays adjacent content
- Floating panel with shadow + z-index elevation
- ~280px wide, matches card height (min-height if card is short)
- Framer Motion slide animation
- Contents:
  - Header with "Contacts" label + close button
  - Contact rows: person name, email (muted), role, remove button
  - Role is inline-editable (click to edit, blur/enter to save)
  - Add button: person picker dropdown (from usePeople) + role text input
- Closes on: click outside, click tab again, close button

## UI — EditTodoDialog

Contacts section added to right column (below Labels). Same data/mutations, rendered as a list with add/remove/edit-role.

## MCP Server

Extend MCP server with contact management tools (add/remove/list by taskNumber).
