'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Users, Trash2 } from 'lucide-react'
import { useTodoContacts } from '@/hooks/use-todo-contacts'
import { usePeople } from '@/hooks/use-people'

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

  // Reset adding state when drawer closes
  React.useEffect(() => {
    if (!open) {
      setIsAdding(false)
      setSelectedPersonId('')
      setRole('')
      setEditingContactId(null)
    }
  }, [open])

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

            {/* Footer -- Add button */}
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
