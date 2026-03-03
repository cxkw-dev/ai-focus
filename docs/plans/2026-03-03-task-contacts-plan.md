# Task Contacts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Attach contacts (people) to tasks with a freeform role field, accessed via a slide-out drawer tab on the TodoItem card edge.

**Architecture:** New `TodoContact` join table linking `Todo` and `Person` with a `role` field. Contacts loaded on-demand via `useTodoContacts` hook when the drawer opens. Drawer is a Framer Motion overlay panel attached to the card's right edge.

**Tech Stack:** Prisma 7, React Query, Framer Motion, Radix UI, Lucide icons, Zod v4

---

### Task 1: Database Schema — Add TodoContact Model

**Files:**
- Modify: `prisma/schema.prisma:10-37` (Todo model, add relation)
- Modify: `prisma/schema.prisma:95-101` (Person model, add relation)

**Step 1: Add TodoContact model and relations to schema.prisma**

Add `contacts TodoContact[]` to the Todo model (after line 28):

```prisma
  contacts        TodoContact[]
```

Add `todoContacts TodoContact[]` to the Person model (after line 100):

```prisma
  todoContacts TodoContact[]
```

Add the new TodoContact model after the Person model (after line 101):

```prisma
model TodoContact {
  id       String @id @default(cuid())
  role     String
  order    Int    @default(0)
  todoId   String
  todo     Todo   @relation(fields: [todoId], references: [id], onDelete: Cascade)
  personId String
  person   Person @relation(fields: [personId], references: [id], onDelete: Cascade)

  @@unique([todoId, personId])
  @@index([todoId])
  @@index([personId])
}
```

**Step 2: Push schema to database**

Run: `npm run db:push`
Expected: Schema synced successfully, no errors.

**Step 3: Generate Prisma client**

Run: `npm run db:generate`
Expected: Prisma client generated successfully.

**Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "add todocontact model for task contacts feature"
```

---

### Task 2: Types and API Client

**Files:**
- Modify: `src/types/todo.ts:39` (add TodoContact type after Todo interface)
- Modify: `src/lib/api.ts:1` (add import) and `src/lib/api.ts:157` (add todoContactsApi after peopleApi)

**Step 1: Add TodoContact type to src/types/todo.ts**

Add after line 39 (after the closing `}` of the Todo interface):

```typescript
export interface TodoContact {
  id: string
  role: string
  order: number
  todoId: string
  personId: string
  person: {
    id: string
    name: string
    email: string
  }
}
```

**Step 2: Add todoContactsApi to src/lib/api.ts**

Add import of `TodoContact` to the existing import on line 1:

```typescript
import type { Todo, CreateTodoInput, UpdateTodoInput, Label, GitHubPrStatus, AzureWorkItemStatus, PaginatedTodosResponse, TodoContact } from '@/types/todo'
```

Add after `peopleApi` (after line 157):

```typescript
export const todoContactsApi = {
  list: (todoId: string): Promise<TodoContact[]> =>
    fetch(`/api/todos/${todoId}/contacts`).then(r => json(r)),

  add: (todoId: string, data: { personId: string; role: string }): Promise<TodoContact> =>
    fetch(`/api/todos/${todoId}/contacts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    }).then(r => json(r)),

  update: (todoId: string, contactId: string, data: { role?: string; order?: number }): Promise<TodoContact> =>
    fetch(`/api/todos/${todoId}/contacts/${contactId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    }).then(r => json(r)),

  remove: (todoId: string, contactId: string): Promise<{ success: boolean }> =>
    fetch(`/api/todos/${todoId}/contacts/${contactId}`, { method: 'DELETE' }).then(r => json(r)),
}
```

**Step 3: Commit**

```bash
git add src/types/todo.ts src/lib/api.ts
git commit -m "add todocontact type and api client"
```

---

### Task 3: API Routes

**Files:**
- Create: `src/app/api/todos/[id]/contacts/route.ts`
- Create: `src/app/api/todos/[id]/contacts/[contactId]/route.ts`

Reference patterns: `src/app/api/todos/[id]/route.ts`, `src/app/api/people/route.ts`

**Step 1: Create contacts collection route**

Create `src/app/api/todos/[id]/contacts/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'

const addContactSchema = z.object({
  personId: z.string(),
  role: z.string().min(1),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const contacts = await db.todoContact.findMany({
    where: { todoId: id },
    include: { person: { select: { id: true, name: true, email: true } } },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(contacts)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const data = addContactSchema.parse(body)

  try {
    const count = await db.todoContact.count({ where: { todoId: id } })
    const contact = await db.todoContact.create({
      data: {
        todoId: id,
        personId: data.personId,
        role: data.role,
        order: count,
      },
      include: { person: { select: { id: true, name: true, email: true } } },
    })
    emit('todos')
    return NextResponse.json(contact, { status: 201 })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      return NextResponse.json({ error: 'Contact already assigned to this task' }, { status: 409 })
    }
    throw err
  }
}
```

**Step 2: Create single contact route**

Create `src/app/api/todos/[id]/contacts/[contactId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { db } from '@/lib/db'
import { emit } from '@/lib/events'

const updateContactSchema = z.object({
  role: z.string().min(1).optional(),
  order: z.number().int().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { id, contactId } = await params
  const body = await request.json()
  const data = updateContactSchema.parse(body)

  const contact = await db.todoContact.update({
    where: { id: contactId, todoId: id },
    data,
    include: { person: { select: { id: true, name: true, email: true } } },
  })
  emit('todos')
  return NextResponse.json(contact)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { id, contactId } = await params
  await db.todoContact.delete({
    where: { id: contactId, todoId: id },
  })
  emit('todos')
  return NextResponse.json({ success: true })
}
```

**Step 3: Verify dev server starts without errors**

Run: `npm run dev` (check for compilation errors, then stop)

**Step 4: Commit**

```bash
git add src/app/api/todos/\[id\]/contacts/
git commit -m "add api routes for task contacts crud"
```

---

### Task 4: React Query Hook — useTodoContacts

**Files:**
- Create: `src/hooks/use-todo-contacts.ts`

Reference pattern: `src/hooks/use-people.ts`

**Step 1: Create the hook**

Create `src/hooks/use-todo-contacts.ts`:

```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { todoContactsApi } from '@/lib/api'
import type { TodoContact } from '@/types/todo'

export function useTodoContacts(todoId: string, enabled = true) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const contactsQuery = useQuery({
    queryKey: ['todos', todoId, 'contacts'],
    queryFn: () => todoContactsApi.list(todoId),
    enabled,
  })

  const add = useMutation({
    mutationFn: (data: { personId: string; role: string }) =>
      todoContactsApi.add(todoId, data),
    onSuccess: (newContact) => {
      queryClient.setQueryData<TodoContact[]>(
        ['todos', todoId, 'contacts'],
        (prev = []) => [...prev, newContact]
      )
      toast({ title: 'Contact added', description: newContact.person.name })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add contact.', variant: 'destructive' })
    },
  })

  const update = useMutation({
    mutationFn: ({ contactId, data }: { contactId: string; data: { role?: string; order?: number } }) =>
      todoContactsApi.update(todoId, contactId, data),
    onSuccess: (updatedContact) => {
      queryClient.setQueryData<TodoContact[]>(
        ['todos', todoId, 'contacts'],
        (prev = []) => prev.map(c => c.id === updatedContact.id ? updatedContact : c)
      )
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update contact.', variant: 'destructive' })
    },
  })

  const remove = useMutation({
    mutationFn: (contactId: string) =>
      todoContactsApi.remove(todoId, contactId),
    onSuccess: (_data, contactId) => {
      queryClient.setQueryData<TodoContact[]>(
        ['todos', todoId, 'contacts'],
        (prev = []) => prev.filter(c => c.id !== contactId)
      )
      toast({ title: 'Contact removed' })
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to remove contact.', variant: 'destructive' })
    },
  })

  return {
    contacts: contactsQuery.data ?? [],
    isLoading: contactsQuery.isLoading,
    isMutating: add.isPending || update.isPending || remove.isPending,
    addContact: add.mutateAsync,
    updateContact: update.mutateAsync,
    removeContact: remove.mutateAsync,
  }
}
```

**Step 2: Commit**

```bash
git add src/hooks/use-todo-contacts.ts
git commit -m "add usetodocontacts hook"
```

---

### Task 5: Contacts Drawer Component

**Files:**
- Create: `src/components/todos/contacts-drawer.tsx`

This is the slide-out panel that appears when the tab on the card edge is clicked. It overlays adjacent content with elevation.

**Step 1: Create the contacts drawer component**

Create `src/components/todos/contacts-drawer.tsx`:

```typescript
'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Users, Trash2 } from 'lucide-react'
import { useTodoContacts } from '@/hooks/use-todo-contacts'
import { usePeople } from '@/hooks/use-people'
import type { Person } from '@/types/person'

interface ContactsDrawerProps {
  todoId: string
  open: boolean
  onClose: () => void
}

export function ContactsDrawer({ todoId, open, onClose }: ContactsDrawerProps) {
  const { contacts, isLoading, addContact, updateContact, removeContact } = useTodoContacts(todoId, open)
  const { people } = usePeople()
  const [isAdding, setIsAdding] = React.useState(false)
  const [selectedPersonId, setSelectedPersonId] = React.useState('')
  const [role, setRole] = React.useState('')
  const [editingContactId, setEditingContactId] = React.useState<string | null>(null)
  const [editingRole, setEditingRole] = React.useState('')
  const drawerRef = React.useRef<HTMLDivElement>(null)

  // People not already assigned to this todo
  const availablePeople = React.useMemo(
    () => people.filter(p => !contacts.some(c => c.personId === p.id)),
    [people, contacts]
  )

  const handleAdd = async () => {
    if (!selectedPersonId || !role.trim()) return
    await addContact({ personId: selectedPersonId, role: role.trim() })
    setSelectedPersonId('')
    setRole('')
    setIsAdding(false)
  }

  const handleRoleSubmit = async (contactId: string) => {
    if (!editingRole.trim()) {
      setEditingContactId(null)
      return
    }
    await updateContact({ contactId, data: { role: editingRole.trim() } })
    setEditingContactId(null)
  }

  const handleRemove = async (contactId: string) => {
    await removeContact(contactId)
  }

  // Close on click outside
  React.useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
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
          animate={{ width: 280, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="absolute top-0 right-0 bottom-0 z-30 overflow-hidden rounded-r-lg"
          style={{
            backgroundColor: 'var(--surface)',
            borderLeft: '1px solid var(--border-color)',
            boxShadow: '-4px 0 16px rgba(0,0,0,0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full w-[280px]">
            {/* Header */}
            <div
              className="flex items-center justify-between px-3 py-2 border-b shrink-0"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Contacts
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded transition-colors hover:bg-black/10"
              >
                <X className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {/* Contact list */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
              {isLoading && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading...</p>
              )}
              {!isLoading && contacts.length === 0 && !isAdding && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No contacts assigned.</p>
              )}
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-start gap-2 rounded-md px-2 py-1.5 group/contact"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--background) 50%, transparent)' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {contact.person.name}
                    </p>
                    <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                      {contact.person.email}
                    </p>
                    {editingContactId === contact.id ? (
                      <input
                        autoFocus
                        value={editingRole}
                        onChange={(e) => setEditingRole(e.target.value)}
                        onBlur={() => handleRoleSubmit(contact.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRoleSubmit(contact.id)
                          if (e.key === 'Escape') setEditingContactId(null)
                        }}
                        className="mt-0.5 w-full text-[10px] bg-transparent border-b outline-none"
                        style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditingContactId(contact.id)
                          setEditingRole(contact.role)
                        }}
                        className="mt-0.5 text-[10px] italic hover:underline"
                        style={{ color: 'var(--primary)' }}
                      >
                        {contact.role}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(contact.id)}
                    className="p-0.5 rounded opacity-0 group-hover/contact:opacity-100 transition-opacity hover:bg-black/10"
                  >
                    <Trash2 className="h-3 w-3" style={{ color: 'var(--destructive)' }} />
                  </button>
                </div>
              ))}

              {/* Add form */}
              {isAdding && (
                <div
                  className="rounded-md px-2 py-2 space-y-1.5"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--background) 50%, transparent)' }}
                >
                  <select
                    value={selectedPersonId}
                    onChange={(e) => setSelectedPersonId(e.target.value)}
                    className="w-full text-xs rounded px-1.5 py-1 bg-transparent border outline-none"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    <option value="">Select person...</option>
                    {availablePeople.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Role (e.g. reviewer)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd()
                      if (e.key === 'Escape') setIsAdding(false)
                    }}
                    className="w-full text-xs rounded px-1.5 py-1 bg-transparent border outline-none"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    placeholder-style={{ color: 'var(--text-muted)' }}
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={handleAdd}
                      disabled={!selectedPersonId || !role.trim()}
                      className="text-[10px] font-medium px-2 py-0.5 rounded disabled:opacity-40"
                      style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setIsAdding(false); setSelectedPersonId(''); setRole('') }}
                      className="text-[10px] font-medium px-2 py-0.5 rounded"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer — Add button */}
            {!isAdding && (
              <div
                className="px-3 py-2 border-t shrink-0"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <button
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-1 text-xs font-medium hover:underline"
                  style={{ color: 'var(--primary)' }}
                >
                  <Plus className="h-3 w-3" />
                  Add contact
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

Note: the `placeholder-style` JSX attribute is not valid — use a `placeholder` className or inline style via `::placeholder` CSS. This will need to be fixed during implementation (use the existing app patterns for placeholder styling).

**Step 2: Commit**

```bash
git add src/components/todos/contacts-drawer.tsx
git commit -m "add contacts drawer component"
```

---

### Task 6: Integrate Drawer Tab into TodoItem

**Files:**
- Modify: `src/components/todos/todo-item.tsx:3` (add import)
- Modify: `src/components/todos/todo-item.tsx:860-885` (wrap card in relative container, add tab + drawer)

**Step 1: Add imports**

Add to imports at top of file:

```typescript
import { Users } from 'lucide-react'  // add to existing lucide import
import { ContactsDrawer } from './contacts-drawer'
```

**Step 2: Add drawer state to TodoItem component**

Inside the `TodoItem` function (around line 807, after the `useSortable` call), add:

```typescript
const [contactsOpen, setContactsOpen] = React.useState(false)
```

**Step 3: Modify the card section to include the drawer tab and panel**

The card is at lines 860-885. The current structure is:
```tsx
<div className="flex items-center gap-0.5">
  {/* Drag Handle */}
  {/* Card */}
  <div className="group flex-1 min-w-0 rounded-lg ...">
    <TodoItemContent ... />
  </div>
</div>
```

Change the card `<div>` wrapper to be `relative` and add the tab + drawer after `<TodoItemContent>`:

```tsx
<div
  className={cn(
    'group flex-1 min-w-0 rounded-lg px-3 py-2.5 transition-all duration-150 todo-card relative',
    dragging && 'shadow-lg z-50',
    (isCompleted || viewMode !== 'active') && 'opacity-50'
  )}
  style={{
    backgroundColor: todo.status === 'WAITING'
      ? 'color-mix(in srgb, var(--status-waiting) 8%, var(--surface-2))'
      : 'var(--surface-2)',
    ...(dragging ? { boxShadow: '0 0 0 2px color-mix(in srgb, var(--primary) 30%, transparent)' } : {}),
  }}
>
  <TodoItemContent ... />

  {/* Contacts drawer tab */}
  <button
    onClick={(e) => { e.stopPropagation(); setContactsOpen(prev => !prev) }}
    className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-10 flex items-center justify-center rounded-r-md transition-colors z-20"
    style={{
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border-color)',
      borderLeft: 'none',
    }}
    title="Contacts"
  >
    <Users className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
  </button>

  {/* Contacts drawer panel */}
  <ContactsDrawer
    todoId={todo.id}
    open={contactsOpen}
    onClose={() => setContactsOpen(false)}
  />
</div>
```

**Step 4: Verify visually in the browser**

Run `npm run dev` and check:
- Tab is visible on the right edge of every card
- Clicking the tab opens the drawer sliding from right
- Drawer overlays adjacent content
- Clicking outside closes the drawer
- Contacts can be added, role edited, removed

**Step 5: Commit**

```bash
git add src/components/todos/todo-item.tsx
git commit -m "integrate contacts drawer tab into todo item card"
```

---

### Task 7: Add Contacts Section to EditTodoDialog

**Files:**
- Modify: `src/components/todos/edit-todo-dialog.tsx`

Add a contacts section to the right column, between Labels (line 557) and the closing `</div>` of the right column (line 558).

**Step 1: Add imports**

Add to the imports at top of edit-todo-dialog.tsx:

```typescript
import { Users } from 'lucide-react'  // add to existing lucide import
import { useTodoContacts } from '@/hooks/use-todo-contacts'
```

**Step 2: Add hook call inside EditTodoDialog**

Inside the component, after existing hooks (around line 210-220), add:

```typescript
const { contacts, addContact, updateContact, removeContact } = useTodoContacts(
  todo?.id ?? '',
  !!todo
)
```

Also add state for the add form:

```typescript
const [newContactPersonId, setNewContactPersonId] = React.useState('')
const [newContactRole, setNewContactRole] = React.useState('')
const [editingContactId, setEditingContactId] = React.useState<string | null>(null)
const [editingContactRole, setEditingContactRole] = React.useState('')
```

**Step 3: Add Contacts section in the right column**

Insert after the Labels section closing `</div>` (after line 557), before the right column closing `</div>` (line 558):

```tsx
{/* Contacts */}
<div className="space-y-2">
  <Label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
    <Users className="h-3.5 w-3.5" />
    Contacts
  </Label>
  <div className="space-y-1.5">
    {contacts.map((contact) => (
      <div
        key={contact.id}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 group/contact"
        style={{ backgroundColor: 'color-mix(in srgb, var(--background) 50%, transparent)' }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {contact.person.name}
          </p>
          {editingContactId === contact.id ? (
            <input
              autoFocus
              value={editingContactRole}
              onChange={(e) => setEditingContactRole(e.target.value)}
              onBlur={() => {
                if (editingContactRole.trim()) {
                  updateContact({ contactId: contact.id, data: { role: editingContactRole.trim() } })
                }
                setEditingContactId(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (editingContactRole.trim()) {
                    updateContact({ contactId: contact.id, data: { role: editingContactRole.trim() } })
                  }
                  setEditingContactId(null)
                }
                if (e.key === 'Escape') setEditingContactId(null)
              }}
              className="w-full text-[10px] bg-transparent border-b outline-none"
              style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
            />
          ) : (
            <button
              onClick={() => {
                setEditingContactId(contact.id)
                setEditingContactRole(contact.role)
              }}
              className="text-[10px] italic hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              {contact.role}
            </button>
          )}
        </div>
        <button
          onClick={() => removeContact(contact.id)}
          className="p-0.5 rounded opacity-0 group-hover/contact:opacity-100 transition-opacity"
          style={{ color: 'var(--destructive)' }}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    ))}

    {/* Add contact inline */}
    <div className="flex flex-col gap-1">
      <select
        value={newContactPersonId}
        onChange={(e) => setNewContactPersonId(e.target.value)}
        className="w-full text-xs rounded px-1.5 py-1 bg-transparent border outline-none"
        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
      >
        <option value="">Add contact...</option>
        {people
          .filter(p => !contacts.some(c => c.personId === p.id))
          .map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
      </select>
      {newContactPersonId && (
        <div className="flex gap-1">
          <input
            autoFocus
            value={newContactRole}
            onChange={(e) => setNewContactRole(e.target.value)}
            placeholder="Role"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newContactRole.trim()) {
                addContact({ personId: newContactPersonId, role: newContactRole.trim() })
                setNewContactPersonId('')
                setNewContactRole('')
              }
            }}
            className="flex-1 text-xs rounded px-1.5 py-1 bg-transparent border outline-none"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={() => {
              if (newContactRole.trim()) {
                addContact({ personId: newContactPersonId, role: newContactRole.trim() })
                setNewContactPersonId('')
                setNewContactRole('')
              }
            }}
            disabled={!newContactRole.trim()}
            className="text-[10px] font-medium px-2 py-0.5 rounded disabled:opacity-40"
            style={{ backgroundColor: 'var(--primary)', color: 'white' }}
          >
            Add
          </button>
        </div>
      )}
    </div>
  </div>
</div>
```

Note: `people` comes from the existing `useLabels` or needs to be fetched. Add `usePeople` import and call if not already present in the component. Check existing imports — the dialog likely already has `usePeople` or `people` needs to be added.

**Step 4: Commit**

```bash
git add src/components/todos/edit-todo-dialog.tsx
git commit -m "add contacts section to edit todo dialog"
```

---

### Task 8: MCP Server — Add Contact Tools

**Files:**
- Modify: `mcp-server/src/index.ts`

Add 3 tools: `list_todo_contacts`, `add_todo_contact`, `remove_todo_contact`.

**Step 1: Add the tools after existing todo tools**

Follow the existing pattern (`server.tool(name, description, schema, handler)`).

```typescript
server.tool(
  "list_todo_contacts",
  "List contacts assigned to a todo/task. Each contact has a person (name, email) and a role.",
  {
    taskNumber: z.number().int().positive().optional().describe("Task number (e.g. 7)"),
    id: z.string().optional().describe("Todo cuid (use taskNumber instead when possible)"),
  },
  async (params) => {
    const todoId = params.id ?? String(params.taskNumber)
    // Resolve taskNumber to id if needed
    let resolvedId = todoId
    if (params.taskNumber && !params.id) {
      const todo = await apiFetch(`/api/todos/${params.taskNumber}`)
      if (isApiError(todo)) return textResult(todo)
      resolvedId = todo.id
    }
    const data = await apiFetch(`/api/todos/${resolvedId}/contacts`)
    if (isApiError(data)) return textResult(data)
    return textResult(data)
  }
)

server.tool(
  "add_todo_contact",
  "Add a contact (person) to a todo/task with a role.",
  {
    taskNumber: z.number().int().positive().optional().describe("Task number (e.g. 7)"),
    id: z.string().optional().describe("Todo cuid"),
    personId: z.string().describe("Person ID to add"),
    role: z.string().describe("Role this person plays (e.g. 'reviewer', 'stakeholder')"),
  },
  async (params) => {
    let resolvedId = params.id
    if (params.taskNumber && !params.id) {
      const todo = await apiFetch(`/api/todos/${params.taskNumber}`)
      if (isApiError(todo)) return textResult(todo)
      resolvedId = todo.id
    }
    if (!resolvedId) return textResult({ _error: true, message: "Provide taskNumber or id" })
    const data = await apiFetch(`/api/todos/${resolvedId}/contacts`, {
      method: "POST",
      body: JSON.stringify({ personId: params.personId, role: params.role }),
    })
    if (isApiError(data)) return textResult(data)
    return textResult(data)
  }
)

server.tool(
  "remove_todo_contact",
  "Remove a contact from a todo/task.",
  {
    taskNumber: z.number().int().positive().optional().describe("Task number"),
    id: z.string().optional().describe("Todo cuid"),
    contactId: z.string().describe("The TodoContact ID to remove"),
  },
  async (params) => {
    let resolvedId = params.id
    if (params.taskNumber && !params.id) {
      const todo = await apiFetch(`/api/todos/${params.taskNumber}`)
      if (isApiError(todo)) return textResult(todo)
      resolvedId = todo.id
    }
    if (!resolvedId) return textResult({ _error: true, message: "Provide taskNumber or id" })
    const data = await apiFetch(`/api/todos/${resolvedId}/contacts/${params.contactId}`, {
      method: "DELETE",
    })
    if (isApiError(data)) return textResult(data)
    return textResult(data)
  }
)
```

**Step 2: Build MCP server**

Run: `cd mcp-server && npm run build`
Expected: No errors.

**Step 3: Commit**

```bash
git add mcp-server/
git commit -m "add contact tools to mcp server"
```

---

### Task 9: Polish and Edge Cases

**Files:**
- Possibly modify: `src/components/todos/todo-item.tsx` (tab badge, hover styles)
- Possibly modify: `src/components/todos/contacts-drawer.tsx` (empty state, loading)

**Step 1: Add contact count badge to the drawer tab**

In `todo-item.tsx`, the tab button needs to show a count when contacts exist. This requires knowing the contact count without opening the drawer. Two options:

Option A (simple): Include contact count in the todo list query by adding `_count: { contacts: true }` to the Prisma include in the todos list API. Add a `_count?: { contacts: number }` to the Todo type.

Option B (deferred): Skip the badge for now. The tab is always visible; users click to see contacts.

Go with Option B for now — the badge can be added later as an enhancement.

**Step 2: Add CSS for the drawer tab hover state**

Add to `src/app/globals.css` alongside other todo action hover rules:

```css
.todo-card:hover .todo-contacts-tab {
  opacity: 1;
}
```

Then add `todo-contacts-tab` class to the tab button in todo-item.tsx if you want hover-only reveal. Since the design says "always visible", skip this.

**Step 3: Test the full flow**

1. Create a person in Settings > Contacts
2. Open a task, click the contacts tab on the right edge
3. Add the person with a role
4. Edit the role inline
5. Remove the contact
6. Open EditTodoDialog, verify contacts section shows same data
7. Add/remove from dialog, verify drawer reflects changes

**Step 4: Commit any polish changes**

```bash
git add -A
git commit -m "polish task contacts feature"
```
