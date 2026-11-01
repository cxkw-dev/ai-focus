'use client'

import * as React from 'react'
import { Button, IconButton } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog'
import { Icon } from '@/components/ui/icon'
import { Input, TextField } from '@/components/ui/input'
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

// People take a colour from the set by a hash of their id, skipping set-3 apricot (it means "do this").
const AVATAR_SETS = [
  'dd-avatar--set-1',
  'dd-avatar--set-2',
  'dd-avatar--set-4',
  'dd-avatar--set-5',
  'dd-avatar--set-6',
  'dd-avatar--set-7',
  'dd-avatar--set-8',
] as const

function avatarSetClass(id: string) {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return AVATAR_SETS[hash % AVATAR_SETS.length]
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = words[0][0]
  const last = words.length > 1 ? words[words.length - 1][0] : ''
  return `${first}${last}`.toUpperCase()
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
  const [deleteTarget, setDeleteTarget] = React.useState<Person | null>(null)
  const addTitleId = React.useId()
  const listTitleId = React.useId()

  const query = search.trim().toLowerCase()
  const filtered = query
    ? people.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query),
      )
    : people
  const editingPerson = people.find((p) => p.id === editingId) ?? null

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
    <div className="dd-form dd-form--divided">
      <section className="dd-form__section" aria-labelledby={addTitleId}>
        <div className="dd-form__head">
          <h2 className="dd-form__title" id={addTitleId}>
            Add a person
          </h2>
          <p className="dd-form__desc">
            Everyone here can be @mentioned in task descriptions.
          </p>
        </div>
        <form
          className="flex flex-wrap items-center gap-3"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void handleCreate()
          }}
        >
          <TextField
            label="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoComplete="off"
            disabled={disabled || isSaving}
            fieldClassName="min-w-0 flex-1 basis-48"
          />
          <TextField
            label="Email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            autoComplete="off"
            disabled={disabled || isSaving}
            fieldClassName="min-w-0 flex-1 basis-56"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={
              !newName.trim() || !newEmail.trim() || disabled || isSaving
            }
          >
            <Icon name="plus" />
            Add person
          </Button>
        </form>
      </section>

      <section className="dd-form__section" aria-labelledby={listTitleId}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="dd-form__head">
            <h2 className="dd-form__title" id={listTitleId}>
              Directory
            </h2>
            <p className="dd-form__desc">
              <span className="dd-num">{people.length}</span>{' '}
              {people.length === 1 ? 'person' : 'people'}
            </p>
          </div>
          {people.length > 5 && (
            <Input
              type="search"
              size="sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter people"
              aria-label="Filter people"
              leading={<Icon name="search" />}
              trailing={
                search && (
                  <span className="dd-input__affix">
                    <button
                      type="button"
                      className="dd-input__btn"
                      aria-label="Clear filter"
                      onClick={() => setSearch('')}
                    >
                      <Icon name="x" />
                    </button>
                  </span>
                )
              }
              boxClassName="w-full sm:w-60"
            />
          )}
        </div>

        {people.length === 0 ? (
          <div className="dd-surface">
            <div className="dd-empty-state dd-empty-state--compact">
              <div className="dd-empty-state__icon">
                <Icon name="users" />
              </div>
              <p className="dd-empty-state__title">No people yet</p>
              <p className="dd-empty-state__text">
                People you add above show up here and in @mention suggestions.
              </p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="dd-surface">
            <div className="dd-empty-state dd-empty-state--compact">
              <div className="dd-empty-state__icon">
                <Icon name="search" />
              </div>
              <p className="dd-empty-state__title">No one matches</p>
              <p className="dd-empty-state__text">
                Nobody’s name or email contains “{search}”.
              </p>
              <div className="dd-empty-state__actions">
                <Button type="button" size="sm" onClick={() => setSearch('')}>
                  <Icon name="x" />
                  Clear filter
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="dd-table dd-table--compact"
            tabIndex={0}
            role="region"
            aria-labelledby={listTitleId}
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">Person</th>
                  <th scope="col" className="is-shrink">
                    <span className="dd-visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((person) => (
                  <tr key={person.id}>
                    <td className="w-full max-w-0">
                      <span className="dd-avatar-label max-w-full">
                        <span
                          className={`dd-avatar dd-avatar--sm ${avatarSetClass(person.id)}`}
                          aria-hidden="true"
                        >
                          {initials(person.name)}
                        </span>
                        <span className="dd-avatar-label__text">
                          <span>{person.name}</span>
                          <span className="font-mono">{person.email}</span>
                        </span>
                      </span>
                    </td>
                    <td className="is-shrink">
                      <div className="flex items-center justify-end gap-0.5">
                        <IconButton
                          icon="edit"
                          label={`Edit ${person.name}`}
                          size="sm"
                          onClick={() => startEdit(person)}
                          disabled={disabled || isSaving}
                        />
                        <IconButton
                          icon="trash"
                          label={`Delete ${person.name}`}
                          size="sm"
                          onClick={() => setDeleteTarget(person)}
                          disabled={disabled || isSaving}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog
        open={editingPerson !== null}
        onOpenChange={(open) => !open && cancelEdit()}
      >
        {editingPerson && (
          <DialogContent size="sm">
            <form
              className="dd-dialog__form"
              noValidate
              onSubmit={(event) => {
                event.preventDefault()
                void commitEdit(editingPerson)
              }}
            >
              <DialogHeader
                icon="user"
                eyebrow="Contacts"
                title="edit person"
              />
              <DialogBody className="dd-form__body">
                <TextField
                  label="Name"
                  value={editDraft.name}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, name: e.target.value }))
                  }
                  autoComplete="off"
                  autoFocus
                  disabled={disabled || isSaving}
                />
                <TextField
                  label="Email"
                  type="email"
                  value={editDraft.email}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, email: e.target.value }))
                  }
                  autoComplete="off"
                  disabled={disabled || isSaving}
                />
              </DialogBody>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={
                    disabled ||
                    isSaving ||
                    !editDraft.name.trim() ||
                    !editDraft.email.trim()
                  }
                >
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        {deleteTarget && (
          <DialogContent size="sm" danger role="alertdialog">
            <DialogHeader
              icon="danger"
              eyebrow="Contacts"
              title={`remove ${deleteTarget.name}?`}
              hideClose
            />
            <DialogBody>
              <p className="m-0">
                They leave your directory and @mention suggestions. This can’t
                be undone.
              </p>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost" autoFocus>
                  Keep them
                </Button>
              </DialogClose>
              <Button
                type="button"
                variant="danger"
                disabled={disabled || isSaving}
                onClick={async () => {
                  const target = deleteTarget
                  setDeleteTarget(null)
                  await handleDelete(target.id)
                }}
              >
                <Icon name="trash" />
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
