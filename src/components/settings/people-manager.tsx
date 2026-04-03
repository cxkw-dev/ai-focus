'use client'

import * as React from 'react'
import { Trash2, Pencil, Search, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Person } from '@/types/person'

interface PeopleManagerProps {
  people: Person[]
  onCreatePerson: (data: Pick<Person, 'name' | 'email'>) => Promise<boolean>
  onUpdatePerson: (
    id: string,
    data: Partial<Pick<Person, 'name' | 'email'>>,
  ) => Promise<boolean>
  onDeletePerson: (id: string) => Promise<boolean>
  disabled?: boolean
}

export function PeopleManager({
  people,
  onCreatePerson,
  onUpdatePerson,
  onDeletePerson,
  disabled,
}: PeopleManagerProps) {
  const [newName, setNewName] = React.useState('')
  const [newEmail, setNewEmail] = React.useState('')
  const [isSaving, setIsSaving] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editDraft, setEditDraft] = React.useState<{
    name: string
    email: string
  }>({ name: '', email: '' })

  const filtered = React.useMemo(() => {
    if (!search.trim()) return people
    const q = search.toLowerCase()
    return people.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q),
    )
  }, [people, search])

  const handleCreate = async () => {
    if (!newName.trim() || !newEmail.trim()) return
    setIsSaving(true)
    const success = await onCreatePerson({
      name: newName.trim(),
      email: newEmail.trim(),
    })
    setIsSaving(false)
    if (success) {
      setNewName('')
      setNewEmail('')
    }
  }

  const startEdit = (person: Person) => {
    setEditingId(person.id)
    setEditDraft({ name: person.name, email: person.email })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft({ name: '', email: '' })
  }

  const commitEdit = async (person: Person) => {
    const updates: Partial<Pick<Person, 'name' | 'email'>> = {}
    if (editDraft.name.trim() && editDraft.name.trim() !== person.name)
      updates.name = editDraft.name.trim()
    if (editDraft.email.trim() && editDraft.email.trim() !== person.email)
      updates.email = editDraft.email.trim()
    if (Object.keys(updates).length > 0) {
      setIsSaving(true)
      await onUpdatePerson(person.id, updates)
      setIsSaving(false)
    }
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    setIsSaving(true)
    await onDeletePerson(id)
    setIsSaving(false)
    if (editingId === id) setEditingId(null)
  }

  return (
    <div className="space-y-5">
      <div
        className="space-y-3 rounded-xl border p-4"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor:
            'color-mix(in srgb, var(--surface) 60%, transparent)',
        }}
      >
        <div
          className="text-xs font-semibold tracking-wide uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          Add Person
        </div>

        <div className="grid items-center gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            disabled={disabled || isSaving}
            className="text-sm"
          />
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Email"
            disabled={disabled || isSaving}
            className="text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleCreate()
              }
            }}
          />
          <Button
            type="button"
            onClick={handleCreate}
            disabled={
              !newName.trim() || !newEmail.trim() || disabled || isSaving
            }
          >
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div
            className="text-xs font-semibold tracking-wide uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            Directory
          </div>
          {people.length > 5 && (
            <div className="relative">
              <Search
                className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter..."
                className="h-7 w-40 rounded-md border pr-7 pl-8 text-xs outline-none"
                style={{
                  backgroundColor: 'var(--surface-2)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute top-1/2 right-2 -translate-y-1/2"
                >
                  <X
                    className="h-3 w-3"
                    style={{ color: 'var(--text-muted)' }}
                  />
                </button>
              )}
            </div>
          )}
        </div>

        {people.length === 0 && (
          <div
            className="rounded-xl border p-4 text-xs"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor:
                'color-mix(in srgb, var(--surface) 70%, transparent)',
              color: 'var(--text-muted)',
            }}
          >
            No people yet. Add your first contact above.
          </div>
        )}

        {people.length > 0 && (
          <div
            className="overflow-hidden rounded-xl border"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor:
                'color-mix(in srgb, var(--surface-2) 80%, transparent)',
            }}
          >
            <div className="max-h-[400px] overflow-y-auto">
              {filtered.length === 0 && (
                <div
                  className="px-4 py-6 text-center text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  No matches for &ldquo;{search}&rdquo;
                </div>
              )}
              {filtered.map((person, i) => (
                <div
                  key={person.id}
                  className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/5"
                  style={
                    i < filtered.length - 1
                      ? {
                          borderBottom:
                            '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)',
                        }
                      : undefined
                  }
                >
                  {editingId === person.id ? (
                    <>
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Input
                          value={editDraft.name}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              name: e.target.value,
                            }))
                          }
                          disabled={disabled || isSaving}
                          className="h-7 min-w-[100px] flex-1 text-sm"
                          placeholder="Name"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void commitEdit(person)
                            if (e.key === 'Escape') cancelEdit()
                          }}
                        />
                        <Input
                          type="email"
                          value={editDraft.email}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              email: e.target.value,
                            }))
                          }
                          disabled={disabled || isSaving}
                          className="h-7 min-w-[140px] flex-1 text-sm"
                          placeholder="Email"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void commitEdit(person)
                            if (e.key === 'Escape') cancelEdit()
                          }}
                        />
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => commitEdit(person)}
                          disabled={
                            disabled ||
                            isSaving ||
                            !editDraft.name.trim() ||
                            !editDraft.email.trim()
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/10"
                          style={{ color: 'var(--status-done)' }}
                          title="Save"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/10"
                          style={{ color: 'var(--text-muted)' }}
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold uppercase"
                        style={{
                          backgroundColor:
                            'color-mix(in srgb, var(--primary) 15%, transparent)',
                          color: 'var(--primary)',
                        }}
                      >
                        {person.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className="truncate text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {person.name}
                        </div>
                        <div
                          className="truncate text-[11px]"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {person.email}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => startEdit(person)}
                          disabled={disabled || isSaving}
                          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/10"
                          style={{ color: 'var(--text-muted)' }}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(person.id)}
                          disabled={disabled || isSaving}
                          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/10"
                          style={{ color: 'var(--destructive)' }}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
