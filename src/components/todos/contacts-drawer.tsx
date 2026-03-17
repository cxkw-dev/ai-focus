'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Users, Trash2 } from 'lucide-react'
import { useTodoContacts } from '@/hooks/use-todo-contacts'
import type { Person } from '@/types/person'

interface ContactsDrawerProps {
  todoId: string
  open: boolean
  onClose: () => void
  people: Person[]
}

export function ContactsDrawer({ todoId, open, onClose, people }: ContactsDrawerProps) {
  const { contacts, isLoading, addContact, updateContact, removeContact } = useTodoContacts(todoId, open)
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
      const target = e.target as HTMLElement
      // Ignore clicks on the tab button — let its toggle handler manage state
      if (target.closest('.todo-contacts-tab')) return
      if (drawerRef.current && !drawerRef.current.contains(target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  // Reset state when drawer closes
  React.useEffect(() => {
    if (!open) {
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
          animate={{ width: 240, opacity: 1 }}
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
          <div className="flex flex-col h-full w-[240px]">
            {/* Header */}
            <div
              className="flex items-center justify-between px-3 py-1.5 border-b shrink-0"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center gap-1.5">
                <Users className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Contacts
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-0.5 rounded transition-colors hover:bg-black/10"
              >
                <X className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {/* Contact list — single-line rows */}
            <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-0.5">
              {isLoading && (
                <p className="text-[11px] px-1" style={{ color: 'var(--text-muted)' }}>Loading...</p>
              )}
              {!isLoading && contacts.length === 0 && (
                <p className="text-[11px] px-1" style={{ color: 'var(--text-muted)' }}>No contacts yet.</p>
              )}
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center gap-1 rounded px-1.5 py-1 group/contact hover:bg-white/5 transition-colors"
                  title={contact.person.email}
                >
                  {editingContactId === contact.id ? (
                    <div className="flex-1 flex items-center gap-1 min-w-0">
                      <span className="text-[11px] font-medium shrink-0" style={{ color: 'var(--text-primary)' }}>
                        {contact.person.name.split(' ')[0]}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>&middot;</span>
                      <input
                        autoFocus
                        value={editingRole}
                        onChange={(e) => setEditingRole(e.target.value)}
                        onBlur={() => handleRoleSubmit(contact.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRoleSubmit(contact.id)
                          if (e.key === 'Escape') setEditingContactId(null)
                        }}
                        className="flex-1 min-w-0 text-[11px] bg-transparent border-b outline-none"
                        style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center gap-1 min-w-0">
                      <a
                        href={`https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(contact.person.email)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-medium truncate hover:underline"
                        style={{ color: 'var(--text-primary)' }}
                        title={`Chat with ${contact.person.name} in Teams`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {contact.person.name}
                      </a>
                      <span className="text-[11px] shrink-0" style={{ color: 'var(--text-muted)' }}>&middot;</span>
                      <button
                        className="text-[11px] truncate italic hover:underline"
                        style={{ color: 'var(--primary)' }}
                        onClick={() => {
                          setEditingContactId(contact.id)
                          setEditingRole(contact.role)
                        }}
                        title="Click to edit role"
                      >
                        {contact.role}
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => handleRemove(contact.id)}
                    className="p-0.5 rounded opacity-0 group-hover/contact:opacity-100 transition-opacity shrink-0"
                  >
                    <Trash2 className="h-2.5 w-2.5" style={{ color: 'var(--destructive)' }} />
                  </button>
                </div>
              ))}
            </div>

            {/* Always-visible add section */}
            {availablePeople.length > 0 && (
              <div
                className="px-2 py-1.5 border-t shrink-0 space-y-1"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <select
                  value={selectedPersonId}
                  onChange={(e) => setSelectedPersonId(e.target.value)}
                  className="w-full text-[11px] rounded px-1.5 py-1 bg-transparent border outline-none"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value="">Add contact...</option>
                  {availablePeople.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {selectedPersonId && (
                  <div className="flex gap-1">
                    <input
                      autoFocus
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Role"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdd()
                        if (e.key === 'Escape') { setSelectedPersonId(''); setRole('') }
                      }}
                      className="flex-1 text-[11px] rounded px-1.5 py-1 bg-transparent border outline-none min-w-0"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                    <button
                      onClick={handleAdd}
                      disabled={!role.trim()}
                      className="p-1 rounded disabled:opacity-40 transition-colors"
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
        </motion.div>
      )}
    </AnimatePresence>
  )
}
