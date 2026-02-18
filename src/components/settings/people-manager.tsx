'use client'

import * as React from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Person } from '@/types/person'

interface PeopleManagerProps {
  people: Person[]
  onCreatePerson: (data: Pick<Person, 'name' | 'email'>) => Promise<boolean>
  onUpdatePerson: (id: string, data: Partial<Pick<Person, 'name' | 'email'>>) => Promise<boolean>
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
  const [drafts, setDrafts] = React.useState<Record<string, { name: string; email: string }>>({})
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    const nextDrafts: Record<string, { name: string; email: string }> = {}
    people.forEach((person) => {
      nextDrafts[person.id] = { name: person.name, email: person.email }
    })
    setDrafts(nextDrafts)
  }, [people])

  const handleCreate = async () => {
    if (!newName.trim() || !newEmail.trim()) return
    setIsSaving(true)
    const success = await onCreatePerson({ name: newName.trim(), email: newEmail.trim() })
    setIsSaving(false)
    if (success) {
      setNewName('')
      setNewEmail('')
    }
  }

  const commitUpdate = async (id: string, updates: Partial<Pick<Person, 'name' | 'email'>>) => {
    if (Object.keys(updates).length === 0) return
    setIsSaving(true)
    await onUpdatePerson(id, updates)
    setIsSaving(false)
  }

  const handleDelete = async (id: string) => {
    setIsSaving(true)
    await onDeletePerson(id)
    setIsSaving(false)
  }

  return (
    <div className="space-y-5">
      <div
        className="rounded-xl border p-4 space-y-3"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'color-mix(in srgb, var(--surface) 60%, transparent)',
        }}
      >
        <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          Add Person
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-center">
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
            disabled={!newName.trim() || !newEmail.trim() || disabled || isSaving}
          >
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Directory
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Tap save to apply changes
          </div>
        </div>

        {people.length === 0 && (
          <div
            className="rounded-xl border p-4 text-xs"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'color-mix(in srgb, var(--surface) 70%, transparent)',
              color: 'var(--text-muted)',
            }}
          >
            No people yet. Add your first contact above.
          </div>
        )}

        {people.map((person) => {
          const draft = drafts[person.id] ?? { name: person.name, email: person.email }
          const hasChanges = draft.name.trim() !== person.name || draft.email.trim() !== person.email

          return (
            <div
              key={person.id}
              className="flex flex-col gap-2 rounded-xl border p-3"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'color-mix(in srgb, var(--surface-2) 80%, transparent)',
              }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[140px]">
                  <Input
                    value={draft.name}
                    onChange={(e) => {
                      setDrafts((prev) => ({
                        ...prev,
                        [person.id]: { ...draft, name: e.target.value },
                      }))
                    }}
                    disabled={disabled}
                    className="text-sm w-full"
                    placeholder="Name"
                  />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <Input
                    type="email"
                    value={draft.email}
                    onChange={(e) => {
                      setDrafts((prev) => ({
                        ...prev,
                        [person.id]: { ...draft, email: e.target.value },
                      }))
                    }}
                    disabled={disabled}
                    className="text-sm w-full"
                    placeholder="Email"
                  />
                </div>

                <div className="flex items-center gap-2 sm:ml-auto">
                  {hasChanges && (
                    <Button
                      type="button"
                      onClick={() => {
                        const updates: Partial<Pick<Person, 'name' | 'email'>> = {}
                        if (draft.name.trim() && draft.name.trim() !== person.name) updates.name = draft.name.trim()
                        if (draft.email.trim() && draft.email.trim() !== person.email) updates.email = draft.email.trim()
                        if (Object.keys(updates).length > 0) void commitUpdate(person.id, updates)
                      }}
                      disabled={disabled || isSaving || !draft.name.trim() || !draft.email.trim()}
                      className="h-9 px-3 text-xs"
                    >
                      Save
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDelete(person.id)}
                    disabled={disabled || isSaving}
                    className="h-9 w-9 p-0 border-destructive/40 text-destructive hover:bg-destructive/10"
                    aria-label="Delete person"
                    title="Delete person"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
