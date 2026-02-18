'use client'

import { Tags, Users } from 'lucide-react'
import { LabelManager } from '@/components/settings/label-manager'
import { PeopleManager } from '@/components/settings/people-manager'
import { useLabels } from '@/hooks/use-labels'
import { usePeople } from '@/hooks/use-people'

export default function SettingsPage() {
  const { labels, isLoading: labelsLoading, isMutating: labelsMutating, handleCreate: handleCreateLabel, handleUpdate: handleUpdateLabel, handleDelete: handleDeleteLabel } = useLabels()
  const { people, isLoading: peopleLoading, isMutating: peopleMutating, handleCreate: handleCreatePerson, handleUpdate: handleUpdatePerson, handleDelete: handleDeletePerson } = usePeople()

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">
      {/* Labels */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'color-mix(in srgb, var(--surface) 80%, transparent)',
        }}
      >
        <div
          className="px-6 py-5 border-b"
          style={{
            borderColor: 'var(--border-color)',
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, transparent), color-mix(in srgb, var(--accent) 12%, transparent))',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Tags className="h-5 w-5" style={{ color: 'var(--primary)' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Labels
              </h2>
            </div>
            <div
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--surface-2) 70%, transparent)',
                color: 'var(--text-muted)',
              }}
            >
              {labels.length} total
            </div>
          </div>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
            Manage reusable labels for your tasks. Colors show up as chips on the card.
          </p>
        </div>

        <div className="p-6">
          {labelsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div
                className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
              />
            </div>
          ) : (
            <LabelManager
              labels={labels}
              onCreateLabel={handleCreateLabel}
              onUpdateLabel={handleUpdateLabel}
              onDeleteLabel={handleDeleteLabel}
              disabled={labelsMutating}
            />
          )}
        </div>
      </div>

      {/* People */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'color-mix(in srgb, var(--surface) 80%, transparent)',
        }}
      >
        <div
          className="px-6 py-5 border-b"
          style={{
            borderColor: 'var(--border-color)',
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, transparent), color-mix(in srgb, var(--accent) 12%, transparent))',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Users className="h-5 w-5" style={{ color: 'var(--primary)' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                People
              </h2>
            </div>
            <div
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--surface-2) 70%, transparent)',
                color: 'var(--text-muted)',
              }}
            >
              {people.length} total
            </div>
          </div>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
            Manage your people directory. Use @mentions in task descriptions to reference them.
          </p>
        </div>

        <div className="p-6">
          {peopleLoading ? (
            <div className="flex items-center justify-center py-8">
              <div
                className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
              />
            </div>
          ) : (
            <PeopleManager
              people={people}
              onCreatePerson={handleCreatePerson}
              onUpdatePerson={handleUpdatePerson}
              onDeletePerson={handleDeletePerson}
              disabled={peopleMutating}
            />
          )}
        </div>
      </div>
    </div>
  )
}
