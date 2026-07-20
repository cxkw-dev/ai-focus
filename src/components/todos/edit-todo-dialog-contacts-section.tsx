'use client'

import { Plus, Trash2, Users } from 'lucide-react'
import { Label } from '@/components/ui/label'
import type { TodoContact } from '@/types/todo'
import type { Person } from '@/types/person'

type ContactMutations = Pick<
  ReturnType<typeof import('@/hooks/use-todo-contacts').useTodoContacts>,
  'addContact' | 'updateContact' | 'removeContact'
>

interface EditTodoDialogContactsSectionProps {
  contacts: TodoContact[]
  people: Person[]
  addContact: ContactMutations['addContact']
  updateContact: ContactMutations['updateContact']
  removeContact: ContactMutations['removeContact']
  newContactPersonId: string
  setNewContactPersonId: (value: string) => void
  newContactRole: string
  setNewContactRole: (value: string) => void
  editingContactId: string | null
  setEditingContactId: (value: string | null) => void
  editingContactRole: string
  setEditingContactRole: (value: string) => void
}

export function EditTodoDialogContactsSection({
  contacts,
  people,
  addContact,
  updateContact,
  removeContact,
  newContactPersonId,
  setNewContactPersonId,
  newContactRole,
  setNewContactRole,
  editingContactId,
  setEditingContactId,
  editingContactRole,
  setEditingContactRole,
}: EditTodoDialogContactsSectionProps) {
  return (
    <div className="space-y-2">
      <Label
        className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
        style={{ color: 'var(--text-muted)' }}
      >
        <Users className="h-3.5 w-3.5" />
        Contacts
      </Label>
      <div className="space-y-0.5">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="group/contact flex items-center gap-1 rounded px-1.5 py-1 transition-colors hover:bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)]"
            title={contact.person.email}
          >
            {editingContactId === contact.id ? (
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <span
                  className="shrink-0 text-[11px] font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {contact.person.name.split(' ')[0]}
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  &middot;
                </span>
                <input
                  autoFocus
                  value={editingContactRole}
                  onChange={(e) => setEditingContactRole(e.target.value)}
                  onBlur={() => {
                    if (editingContactRole.trim()) {
                      updateContact({
                        contactId: contact.id,
                        data: { role: editingContactRole.trim() },
                      })
                    }
                    setEditingContactId(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editingContactRole.trim()) {
                        updateContact({
                          contactId: contact.id,
                          data: { role: editingContactRole.trim() },
                        })
                      }
                      setEditingContactId(null)
                    }
                    if (e.key === 'Escape') setEditingContactId(null)
                  }}
                  className="min-w-0 flex-1 border-b bg-transparent text-[11px] outline-none"
                  style={{
                    color: 'var(--primary)',
                    borderColor: 'var(--primary)',
                  }}
                />
              </div>
            ) : (
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <a
                  href={`https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(contact.person.email)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-[11px] font-medium hover:underline"
                  style={{ color: 'var(--text-primary)' }}
                  title={`Chat with ${contact.person.name} in Teams`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {contact.person.name}
                </a>
                <span
                  className="shrink-0 text-[11px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  &middot;
                </span>
                <button
                  type="button"
                  className="truncate text-[11px] italic hover:underline"
                  style={{ color: 'var(--primary)' }}
                  onClick={() => {
                    setEditingContactId(contact.id)
                    setEditingContactRole(contact.role)
                  }}
                  title="Click to edit role"
                >
                  {contact.role}
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => removeContact(contact.id)}
              className="shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover/contact:opacity-100"
              style={{ color: 'var(--destructive)' }}
            >
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}

        {/* Always-visible add */}
        {people.filter(
          (p: { id: string }) => !contacts.some((c) => c.personId === p.id),
        ).length > 0 && (
          <div className="space-y-1 pt-1">
            <select
              value={newContactPersonId}
              onChange={(e) => setNewContactPersonId(e.target.value)}
              className="w-full rounded border px-1.5 py-1 text-[11px] outline-none"
              style={{
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--surface)',
              }}
            >
              <option value="">Add contact...</option>
              {people
                .filter(
                  (p: { id: string }) =>
                    !contacts.some((c) => c.personId === p.id),
                )
                .map((p: { id: string; name: string }) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
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
                      addContact({
                        personId: newContactPersonId,
                        role: newContactRole.trim(),
                      })
                      setNewContactPersonId('')
                      setNewContactRole('')
                    }
                  }}
                  className="min-w-0 flex-1 rounded border bg-transparent px-1.5 py-1 text-[11px] outline-none"
                  style={{
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newContactRole.trim()) {
                      addContact({
                        personId: newContactPersonId,
                        role: newContactRole.trim(),
                      })
                      setNewContactPersonId('')
                      setNewContactRole('')
                    }
                  }}
                  disabled={!newContactRole.trim()}
                  className="rounded p-1 transition-colors disabled:opacity-40"
                  style={{ color: 'var(--primary)' }}
                  title="Add contact"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
