'use client'

import * as React from 'react'
import { Button, IconButton } from '@/components/ui/button'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from '@/components/ui/drawer'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useTodoContacts } from '@/hooks/use-todo-contacts'
import { cn } from '@/lib/utils'
import type { Person } from '@/types/person'

interface ContactsDrawerProps {
  todoId: string
  open: boolean
  onClose: () => void
  people: Person[]
}

export function ContactsDrawer({
  todoId,
  open,
  onClose,
  people,
}: ContactsDrawerProps) {
  const { contacts, isLoading, addContact, updateContact, removeContact } =
    useTodoContacts(todoId, open)
  const { toast } = useToast()
  const [selectedPersonId, setSelectedPersonId] = React.useState('')
  const [role, setRole] = React.useState('')
  const [editingContactId, setEditingContactId] = React.useState<string | null>(
    null,
  )
  const [editingRole, setEditingRole] = React.useState('')
  const [copiedContactId, setCopiedContactId] = React.useState<string | null>(
    null,
  )
  const copiedTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  // People not already assigned to this todo
  const availablePeople = React.useMemo(
    () => people.filter((p) => !contacts.some((c) => c.personId === p.id)),
    [people, contacts],
  )

  const handleAdd = async () => {
    if (!selectedPersonId || !role.trim()) return
    await addContact({ personId: selectedPersonId, role: role.trim() })
    setSelectedPersonId('')
    setRole('')
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

  const handleCopyEmail = async (contactId: string, email: string) => {
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      toast({
        title: 'Couldn’t copy the email',
        description: email,
        variant: 'destructive',
      })
      return
    }
    setCopiedContactId(contactId)
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
    copiedTimeoutRef.current = setTimeout(() => {
      setCopiedContactId(null)
      copiedTimeoutRef.current = null
    }, 1600)
  }

  React.useEffect(
    () => () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
    },
    [],
  )

  // Reset state when drawer closes (React 19 reset-on-prop pattern).
  const [prevOpen, setPrevOpen] = React.useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (!open) {
      setSelectedPersonId('')
      setRole('')
      setEditingContactId(null)
      setCopiedContactId(null)
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <DrawerContent
        size="sm"
        onEscapeKeyDown={(event) => {
          // Esc inside an inline role field cancels that edit, not the drawer.
          if (event.target instanceof HTMLInputElement) event.preventDefault()
        }}
      >
        <DrawerHeader title="contacts" />
        <DrawerBody>
          {isLoading ? (
            <span className="dd-loading" role="status">
              <span className="dd-spinner dd-spinner--sm" aria-hidden="true" />
              Loading contacts
            </span>
          ) : contacts.length === 0 ? (
            <div className="dd-empty-state dd-empty-state--compact">
              <div className="dd-empty-state__icon">
                <Icon name="users" />
              </div>
              <p className="dd-empty-state__title">No contacts yet</p>
              <p className="dd-empty-state__text">
                Add the people you work with on this task.
              </p>
            </div>
          ) : (
            <dl className="dd-description-list dd-description-list--stacked dd-description-list--compact">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="dd-description-list__item group/contact"
                >
                  <dt className="dd-description-list__term">
                    {editingContactId === contact.id ? (
                      <Input
                        size="sm"
                        autoFocus
                        aria-label={`Role for ${contact.person.name}`}
                        value={editingRole}
                        onChange={(e) => setEditingRole(e.target.value)}
                        onBlur={() => handleRoleSubmit(contact.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRoleSubmit(contact.id)
                          if (e.key === 'Escape') setEditingContactId(null)
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        className="dd-link text-left"
                        onClick={() => {
                          setEditingContactId(contact.id)
                          setEditingRole(contact.role)
                        }}
                        title="Edit role"
                      >
                        {contact.role}
                      </button>
                    )}
                  </dt>
                  <dd className="dd-description-list__details flex-nowrap">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <a
                        href={`https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(contact.person.email)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate font-medium"
                        title={`Chat with ${contact.person.name} in Teams`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {contact.person.name}
                      </a>
                      <span className="dd-description-list__muted truncate text-xs">
                        {contact.person.email}
                      </span>
                    </span>
                    <IconButton
                      icon={copiedContactId === contact.id ? 'check' : 'copy'}
                      label={
                        copiedContactId === contact.id
                          ? 'Email copied'
                          : `Copy ${contact.person.name}’s email`
                      }
                      size="sm"
                      className={cn(
                        'text-sm',
                        copiedContactId === contact.id && 'text-ok',
                      )}
                      onClick={() =>
                        void handleCopyEmail(contact.id, contact.person.email)
                      }
                    />
                    <IconButton
                      icon="trash"
                      label="Remove contact"
                      size="sm"
                      className="text-sm opacity-0 group-focus-within/contact:opacity-100 group-hover/contact:opacity-100 focus-visible:opacity-100"
                      onClick={() => handleRemove(contact.id)}
                    />
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </DrawerBody>

        {/* Always-visible add section */}
        {availablePeople.length > 0 && (
          <DrawerFooter>
            <Select
              boxClassName="basis-full"
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              aria-label="Add a contact"
            >
              <option value="">Add a contact…</option>
              {availablePeople.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            {selectedPersonId && (
              <>
                <Input
                  autoFocus
                  boxClassName="min-w-0 flex-1"
                  aria-label="Role"
                  placeholder="Role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd()
                    if (e.key === 'Escape') {
                      setSelectedPersonId('')
                      setRole('')
                    }
                  }}
                />
                <Button
                  variant="primary"
                  onClick={handleAdd}
                  disabled={!role.trim()}
                >
                  <Icon name="plus" />
                  Add
                </Button>
              </>
            )}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}
