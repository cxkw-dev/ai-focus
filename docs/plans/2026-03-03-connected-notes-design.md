# Connected Notes Design

## Problem

Todo cards with detailed descriptions take up too much real estate. Users want to move long-form details into notebook notes while keeping them accessible from the todo card.

## Design

### Data Model

Add optional `notebookNoteId` FK on `Todo` pointing to `NotebookNote`. One-to-one relationship — each todo can have at most one connected note.

```
Todo.notebookNoteId ──(optional)──> NotebookNote.id
```

No changes to `NotebookNote` model. The todo owns the relationship.

### Todo Card Display

A small "Note" chip/icon on the todo card when a note is connected. Clicking opens a right-side drawer (similar to contacts drawer) with a full TipTap rich text editor. User can read and edit without leaving the todos page. Auto-saves on changes.

### Edit Dialog

New "Connected Note" section in the right column of `EditTodoDialog`:

- **Create new note** — creates a NotebookNote and links it to the todo
- **Link existing note** — pick from unlinked notebook notes
- **Unlink** — removes connection without deleting the note

### Notebook Page

Connected notes appear normally in the notebook. A small indicator shows which todo the note is linked to.

### Components

| Component                        | Purpose                                 |
| -------------------------------- | --------------------------------------- |
| `NoteDrawer`                     | Right-side slide-out with TipTap editor |
| Note chip on `TodoItem`          | Clickable indicator on card             |
| Note section in `EditTodoDialog` | Create/link/unlink controls             |

### API Changes

- `GET /api/todos` — include `notebookNote` relation
- `PATCH /api/todos/[id]` — accept `notebookNoteId` to link/unlink
- `POST /api/notebook` — optionally accept `todoId` to auto-link on creation
- `GET /api/notebook` — include linked `todo` info (taskNumber, title)

### MCP Server

Add `notebookNoteId` field to todo tools for linking/unlinking via CLI.
