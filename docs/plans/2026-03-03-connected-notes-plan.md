# Connected Notes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to link a notebook note to a todo card and view/edit it in a right-side drawer without leaving the todos page.

**Architecture:** Add optional `notebookNoteId` FK on Todo → NotebookNote. Include the relation in todo queries. Display a "Note" chip on the card that opens a slide-out drawer with a full TipTap editor. Manage linking in the edit dialog.

**Tech Stack:** Prisma 7, Next.js 16 App Router, React 19, TipTap, Framer Motion, React Query

---

### Task 1: Add `notebookNoteId` FK to Todo schema

**Files:**

- Modify: `prisma/schema.prisma:10-40` (Todo model)
- Modify: `prisma/schema.prisma:79-89` (NotebookNote model)

**Step 1: Add the relation fields**

In `prisma/schema.prisma`, add to the Todo model (after line 32, before the indexes):

```prisma
  notebookNoteId  String?        @unique
  notebookNote    NotebookNote?  @relation(fields: [notebookNoteId], references: [id], onDelete: SetNull)
```

Add to the NotebookNote model (after line 85, before the indexes):

```prisma
  todo      Todo?
```

**Step 2: Push schema to DB**

Run: `npm run db:push`
Expected: Schema synced successfully

**Step 3: Generate Prisma client**

Run: `npm run db:generate`
Expected: Client generated

---

### Task 2: Update TypeScript types

**Files:**

- Modify: `src/types/todo.ts:20-41` (Todo interface)
- Modify: `src/types/todo.ts:114-128` (CreateTodoInput)
- Modify: `src/types/todo.ts:130-144` (UpdateTodoInput)
- Modify: `src/types/notebook.ts:1-8` (NotebookNote interface)

**Step 1: Add notebookNoteId to Todo type**

In `src/types/todo.ts`, add to the `Todo` interface after `githubIssueUrls` (line 40):

```typescript
  notebookNoteId: string | null
  notebookNote?: { id: string; title: string } | null
```

**Step 2: Add to UpdateTodoInput**

In `src/types/todo.ts`, add to `UpdateTodoInput` after `githubIssueUrls` (line 143):

```typescript
  notebookNoteId?: string | null
```

**Step 3: Add linked todo info to NotebookNote**

In `src/types/notebook.ts`, add to the `NotebookNote` interface after `updatedAt` (line 7):

```typescript
  linkedTodo?: { id: string; taskNumber: number; title: string } | null
```

---

### Task 3: Update API routes to include notebookNote relation

**Files:**

- Modify: `src/app/api/todos/route.ts:93-96` (include in GET)
- Modify: `src/app/api/todos/route.ts:17-30` (createTodoSchema)
- Modify: `src/app/api/todos/route.ts:144-160` (create data)
- Modify: `src/app/api/todos/[id]/route.ts:51-57` (include in GET)
- Modify: `src/app/api/todos/[id]/route.ts:15-30` (updateTodoSchema)
- Modify: `src/app/api/todos/[id]/route.ts:175-192` (update data)
- Modify: `src/app/api/notebook/route.ts:19-25` (include in GET)
- Modify: `src/app/api/notebook/[id]/route.ts:17-19` (include in GET)

**Step 1: Add `notebookNote` include to todo queries**

In `src/app/api/todos/route.ts`, update the `include` object (lines 93-96):

```typescript
const include = {
  labels: { orderBy: { name: 'asc' } as const },
  subtasks: { orderBy: { order: 'asc' } as const },
  notebookNote: { select: { id: true, title: true } },
}
```

In `src/app/api/todos/[id]/route.ts`, update the GET include (lines 53-56):

```typescript
include: {
  labels: { orderBy: { name: 'asc' } },
  subtasks: { orderBy: { order: 'asc' } },
  notebookNote: { select: { id: true, title: true } },
},
```

And the PATCH include (lines 188-191):

```typescript
include: {
  labels: { orderBy: { name: 'asc' } },
  subtasks: { orderBy: { order: 'asc' } },
  notebookNote: { select: { id: true, title: true } },
},
```

**Step 2: Add `notebookNoteId` to update schema and data**

In `src/app/api/todos/[id]/route.ts`, add to `updateTodoSchema` (after line 29):

```typescript
  notebookNoteId: z.string().optional().nullable(),
```

The `notebookNoteId` field will flow through `todoData` spread automatically since it's a simple scalar.

**Step 3: Add linked todo to notebook queries**

In `src/app/api/notebook/route.ts`, update findMany (line 19):

```typescript
const notes = await db.notebookNote.findMany({
  where,
  include: {
    todo: { select: { id: true, taskNumber: true, title: true } },
  },
  orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
})
```

In `src/app/api/notebook/[id]/route.ts`, update findUnique (line 17):

```typescript
const note = await db.notebookNote.findUnique({
  where: { id },
  include: {
    todo: { select: { id: true, taskNumber: true, title: true } },
  },
})
```

Also update the PATCH return to include the relation:

```typescript
const note = await db.notebookNote.update({
  where: { id },
  data: validatedData,
  include: {
    todo: { select: { id: true, taskNumber: true, title: true } },
  },
})
```

---

### Task 4: Create the NoteDrawer component

**Files:**

- Create: `src/components/todos/note-drawer.tsx`

**Step 1: Create the drawer component**

Model after `contacts-drawer.tsx`. Key differences:

- Instead of a contact list, render a `RichTextEditor` (from `src/components/ui/rich-text-editor.tsx`)
- Use `notebookApi.get(noteId)` to fetch full note content
- Use `notebookApi.update(noteId, { content })` to auto-save on changes (debounced)
- Include note title at top (editable inline input)
- "Unlink" button in header to disconnect note from todo

```tsx
'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Unlink } from 'lucide-react'
import { notebookApi } from '@/lib/api'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { useQueryClient } from '@tanstack/react-query'

interface NoteDrawerProps {
  noteId: string
  open: boolean
  onClose: () => void
  onUnlink: () => void
}

export function NoteDrawer({
  noteId,
  open,
  onClose,
  onUnlink,
}: NoteDrawerProps) {
  const drawerRef = React.useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const [title, setTitle] = React.useState('')
  const [content, setContent] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Fetch note content when opened
  React.useEffect(() => {
    if (!open || !noteId) return
    setIsLoading(true)
    notebookApi.get(noteId).then((note) => {
      setTitle(note.title)
      setContent(note.content)
      setIsLoading(false)
    })
  }, [open, noteId])

  // Debounced auto-save
  const saveNote = React.useCallback(
    (updates: { title?: string; content?: string }) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(async () => {
        await notebookApi.update(noteId, updates)
        queryClient.invalidateQueries({ queryKey: ['notebook'] })
      }, 500)
    },
    [noteId, queryClient],
  )

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    saveNote({ title: newTitle })
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    saveNote({ content: newContent })
  }

  // Close on click outside
  React.useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (target.closest('.todo-note-tab')) return
      if (drawerRef.current && !drawerRef.current.contains(target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={drawerRef}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="absolute bottom-0 right-0 top-0 z-30 overflow-hidden rounded-r-lg"
          style={{
            backgroundColor: 'var(--surface)',
            borderLeft: '1px solid var(--border-color)',
            boxShadow: '-4px 0 16px rgba(0,0,0,0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-full w-[320px] flex-col">
            {/* Header */}
            <div
              className="flex shrink-0 items-center justify-between border-b px-3 py-1.5"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center gap-1.5">
                <FileText
                  className="h-3 w-3"
                  style={{ color: 'var(--text-muted)' }}
                />
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Note
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={onUnlink}
                  className="rounded p-0.5 transition-colors hover:bg-black/10"
                  title="Unlink note"
                >
                  <Unlink
                    className="h-3 w-3"
                    style={{ color: 'var(--text-muted)' }}
                  />
                </button>
                <button
                  onClick={onClose}
                  className="rounded p-0.5 transition-colors hover:bg-black/10"
                >
                  <X
                    className="h-3 w-3"
                    style={{ color: 'var(--text-muted)' }}
                  />
                </button>
              </div>
            </div>

            {/* Title */}
            <div
              className="border-b px-3 py-1.5"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold outline-none"
                style={{ color: 'var(--text-primary)' }}
                placeholder="Note title..."
              />
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {isLoading ? (
                <p
                  className="text-[11px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Loading...
                </p>
              ) : (
                <RichTextEditor
                  value={content}
                  onChange={handleContentChange}
                />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

---

### Task 5: Add Note chip and NoteDrawer to TodoItem

**Files:**

- Modify: `src/components/todos/todo-item.tsx:60` (imports)
- Modify: `src/components/todos/todo-item.tsx:845` (state)
- Modify: `src/components/todos/todo-item.tsx:917-921` (after ContactsDrawer)
- Modify: `src/components/todos/todo-item.tsx:924-941` (tabs area)

**Step 1: Add imports and state**

Add import after the ContactsDrawer import (line 60):

```typescript
import { NoteDrawer } from './note-drawer'
```

Add state alongside `contactsOpen` (around line 845):

```typescript
const [noteOpen, setNoteOpen] = React.useState(false)
```

**Step 2: Add NoteDrawer next to ContactsDrawer**

After the `<ContactsDrawer>` block (line 921), add:

```tsx
{
  todo.notebookNoteId && (
    <NoteDrawer
      noteId={todo.notebookNoteId}
      open={noteOpen}
      onClose={() => setNoteOpen(false)}
      onUnlink={() => {
        // Call update to set notebookNoteId to null
        // This will be wired through the existing onEdit/update flow
      }}
    />
  )
}
```

**Step 3: Add Note tab button next to Contacts tab**

In the tabs area (after the contacts button, before closing `</div>`), add a note tab when a note is linked:

```tsx
{
  !dragging && todo.notebookNoteId && (
    <button
      onClick={(e) => {
        e.stopPropagation()
        setNoteOpen((prev) => !prev)
      }}
      className={cn(
        'todo-note-tab flex w-5 flex-shrink-0 items-center justify-center self-stretch transition-all duration-150',
        noteOpen && 'todo-note-tab-active',
      )}
      title="Note"
    >
      <FileText className="h-3 w-3" />
    </button>
  )
}
```

Note: The contacts tab currently has `rounded-r-lg`. When both tabs exist, the contacts tab loses its rounded corner and the note tab gets it instead. Adjust the className logic: if `todo.notebookNoteId` exists, contacts tab should NOT have `rounded-r-lg`, and the note tab should.

---

### Task 6: Add Connected Note section to EditTodoDialog

**Files:**

- Modify: `src/components/todos/edit-todo-dialog.tsx:614-615` (after Labels section)

**Step 1: Add note management section**

After the Labels section (line 614) and before the Contacts section (line 616), add:

```tsx
{
  /* Connected Note */
}
;<div className="space-y-2">
  <Label
    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"
    style={{ color: 'var(--text-muted)' }}
  >
    <FileText className="h-3.5 w-3.5" />
    Connected Note
  </Label>
  {todo?.notebookNoteId ? (
    <div className="flex items-center gap-2">
      <span
        className="flex-1 truncate text-[11px]"
        style={{ color: 'var(--text-primary)' }}
      >
        {todo.notebookNote?.title || 'Untitled'}
      </span>
      <button
        type="button"
        onClick={() => handleUnlinkNote()}
        className="text-[11px] font-medium underline hover:no-underline"
        style={{ color: 'var(--destructive)' }}
      >
        Unlink
      </button>
    </div>
  ) : (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => handleCreateAndLinkNote()}
        className="w-full rounded border px-2 py-1.5 text-left text-[11px] transition-colors hover:bg-white/5"
        style={{
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
      >
        + Create new note
      </button>
      {/* Link existing note dropdown */}
      <select
        value=""
        onChange={(e) => handleLinkExistingNote(e.target.value)}
        className="w-full rounded border bg-transparent px-1.5 py-1 text-[11px] outline-none"
        style={{
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
      >
        <option value="">Link existing note...</option>
        {unlinkedNotes.map((note) => (
          <option key={note.id} value={note.id}>
            {note.title}
          </option>
        ))}
      </select>
    </div>
  )}
</div>
```

**Step 2: Add handler functions in EditTodoDialog**

These handlers directly call the API and invalidate queries:

```typescript
const handleCreateAndLinkNote = async () => {
  const note = await notebookApi.create({
    title: `Note for #${todo?.taskNumber}`,
  })
  await todosApi.update(todo!.id, { notebookNoteId: note.id })
  queryClient.invalidateQueries({ queryKey: ['todos'] })
  queryClient.invalidateQueries({ queryKey: ['notebook'] })
}

const handleLinkExistingNote = async (noteId: string) => {
  if (!noteId) return
  await todosApi.update(todo!.id, { notebookNoteId: noteId })
  queryClient.invalidateQueries({ queryKey: ['todos'] })
  queryClient.invalidateQueries({ queryKey: ['notebook'] })
}

const handleUnlinkNote = async () => {
  await todosApi.update(todo!.id, { notebookNoteId: null })
  queryClient.invalidateQueries({ queryKey: ['todos'] })
  queryClient.invalidateQueries({ queryKey: ['notebook'] })
}
```

**Step 3: Fetch unlinked notes**

Use `notebookApi.list()` to get all notes, filter to those without a linked todo:

```typescript
const { data: allNotes } = useQuery({
  queryKey: ['notebook'],
  queryFn: () => notebookApi.list(),
})
const unlinkedNotes = (allNotes ?? []).filter((n) => !n.linkedTodo)
```

---

### Task 7: Add linked todo indicator to notebook sidebar

**Files:**

- Modify: `src/components/notes/notes-sidebar.tsx`

**Step 1: Show linked task number on notes**

When a note has `linkedTodo`, show a small chip like `#27` next to the note title in the sidebar list. This gives users visibility that a note is connected to a task.

```tsx
{
  note.linkedTodo && (
    <span
      className="shrink-0 rounded px-1 text-[10px] font-medium"
      style={{
        color: 'var(--primary)',
        backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)',
      }}
    >
      #{note.linkedTodo.taskNumber}
    </span>
  )
}
```

---

### Task 8: Update MCP server

**Files:**

- Modify: `mcp-server/src/index.ts`

**Step 1: Add `notebookNoteId` to TodoResponse type and tool schemas**

Add `notebookNoteId` to the `TodoResponse` interface. Add it to `formatTodoSummary` output. Add `notebookNoteId` to the `update_todo` tool input schema so the MCP client can link/unlink notes.

---

### Task 9: CSS for note tab hover states

**Files:**

- Modify: `src/app/globals.css`

**Step 1: Add tab hover/active styles**

Add styles matching the existing `.todo-contacts-tab` pattern:

```css
.todo-note-tab {
  color: var(--text-muted);
  background-color: transparent;
}
.todo-note-tab:hover {
  background-color: color-mix(in srgb, var(--primary) 8%, transparent);
  color: var(--primary);
}
.todo-note-tab-active {
  background-color: color-mix(in srgb, var(--primary) 12%, transparent);
  color: var(--primary);
}
```

---

### Task 10: Commit

**Step 1: Stage and commit all changes**

```bash
git add -A
git commit -m "add connected notes - link notebook notes to todo cards with drawer editor"
```

**Step 2: Push**

```bash
git push origin main
```
