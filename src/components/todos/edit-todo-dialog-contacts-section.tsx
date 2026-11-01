'use client'

import { IconButton } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
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
  const availablePeople = people.filter(
    (p) => !contacts.some((c) => c.personId === p.id),
  )

  const commitRole = (contactId: string) => {
    if (editingContactRole.trim()) {
      updateContact({
        contactId,
        data: { role: editingContactRole.trim() },
      })
    }
    setEditingContactId(null)
  }

  const commitNewContact = () => {
    if (!newContactRole.trim()) return
    addContact({
      personId: newContactPersonId,
      role: newContactRole.trim(),
    })
    setNewContactPersonId('')
    setNewContactRole('')
  }

  return (
    <div className="dd-field dd-field--above">
      <span className="dd-field__label">Contacts</span>

      {contacts.length > 0 && (
        <dl className="dd-description-list dd-description-list--stacked dd-description-list--compact">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="dd-description-list__item group/contact"
              title={contact.person.email}
            >
              <dt className="dd-description-list__term">
                {editingContactId === contact.id ? (
                  <Input
                    size="sm"
                    autoFocus
                    aria-label={`Role for ${contact.person.name}`}
                    value={editingContactRole}
                    onChange={(e) => setEditingContactRole(e.target.value)}
                    onBlur={() => commitRole(contact.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRole(contact.id)
                      if (e.key === 'Escape') setEditingContactId(null)
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className="dd-link text-left"
                    onClick={() => {
                      setEditingContactId(contact.id)
                      setEditingContactRole(contact.role)
                    }}
                    title="Edit role"
                  >
                    {contact.role}
                  </button>
                )}
              </dt>
              <dd className="dd-description-list__details flex-nowrap">
                <a
                  href={`https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(contact.person.email)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate font-medium"
                  title={`Chat with ${contact.person.name} in Teams`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {contact.person.name}
                </a>
                <IconButton
                  icon="trash"
                  label="Remove contact"
                  size="sm"
                  onClick={() => removeContact(contact.id)}
                  className="-my-1 text-sm opacity-0 group-focus-within/contact:opacity-100 group-hover/contact:opacity-100 focus-visible:opacity-100"
                />
              </dd>
            </div>
          ))}
        </dl>
      )}

      {availablePeople.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Select
            value={newContactPersonId}
            onChange={(e) => setNewContactPersonId(e.target.value)}
            aria-label="Add a contact"
          >
            <option value="">Add a contact…</option>
            {availablePeople.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          {newContactPersonId && (
            <div className="flex items-center gap-1.5">
              <Input
                autoFocus
                boxClassName="flex-1"
                aria-label="Role"
                placeholder="Role"
                value={newContactRole}
                onChange={(e) => setNewContactRole(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitNewContact()
                }}
              />
              <IconButton
                icon="plus"
                label="Add contact"
                variant="secondary"
                onClick={commitNewContact}
                disabled={!newContactRole.trim()}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
