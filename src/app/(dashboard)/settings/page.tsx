'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Tags, Users, Palette, Check } from 'lucide-react'
import { LabelManager } from '@/components/settings/label-manager'
import { PeopleManager } from '@/components/settings/people-manager'
import { useLabels } from '@/hooks/use-labels'
import { usePeople } from '@/hooks/use-people'
import { useAppTheme } from '@/components/providers/theme-provider'

type SettingsTab = 'labels' | 'contacts' | 'appearance'

const TAB_QUERY_KEY = 'tab'
const TAB_ORDER: SettingsTab[] = ['contacts', 'labels', 'appearance']

const isSettingsTab = (value: string | null): value is SettingsTab =>
  value === 'labels' || value === 'contacts' || value === 'appearance'

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
        style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
      />
    </div>
  )
}

function SettingsPageContent() {
  const { labels, isLoading: labelsLoading, isMutating: labelsMutating, handleCreate: handleCreateLabel, handleUpdate: handleUpdateLabel, handleDelete: handleDeleteLabel } = useLabels()
  const { people, isLoading: peopleLoading, isMutating: peopleMutating, handleCreate: handleCreatePerson, handleUpdate: handleUpdatePerson, handleDelete: handleDeletePerson } = usePeople()
  const { theme, setTheme, themes } = useAppTheme()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryTab = searchParams.get(TAB_QUERY_KEY)
  const [activeTab, setActiveTab] = React.useState<SettingsTab>(
    isSettingsTab(queryTab) ? queryTab : 'contacts'
  )

  React.useEffect(() => {
    if (isSettingsTab(queryTab)) {
      setActiveTab(queryTab)
      return
    }
    if (queryTab !== null) {
      setActiveTab('contacts')
    }
  }, [queryTab])

  const tabs = React.useMemo(
    () => [
      {
        id: 'contacts' as const,
        label: 'Contacts',
        hint: 'People directory',
        count: people.length,
        icon: Users,
      },
      {
        id: 'labels' as const,
        label: 'Labels',
        hint: 'Reusable tags',
        count: labels.length,
        icon: Tags,
      },
      {
        id: 'appearance' as const,
        label: 'Appearance',
        hint: 'Theme & colors',
        count: themes.length,
        icon: Palette,
      },
    ],
    [labels.length, people.length, themes.length]
  )

  const changeTab = React.useCallback(
    (nextTab: SettingsTab) => {
      setActiveTab(nextTab)
      const params = new URLSearchParams(searchParams.toString())
      params.set(TAB_QUERY_KEY, nextTab)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const handleTabKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, currentTab: SettingsTab) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      const currentIndex = TAB_ORDER.indexOf(currentTab)
      const offset = event.key === 'ArrowRight' ? 1 : -1
      const nextIndex = (currentIndex + offset + TAB_ORDER.length) % TAB_ORDER.length
      const nextTab = TAB_ORDER[nextIndex]
      changeTab(nextTab)
    },
    [changeTab]
  )

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div
        className="rounded-xl border p-1.5"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'color-mix(in srgb, var(--surface) 68%, transparent)',
        }}
      >
        <div className="flex gap-1 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Settings sections">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                id={`settings-tab-${tab.id}`}
                role="tab"
                aria-controls={`settings-panel-${tab.id}`}
                aria-selected={isActive}
                onClick={() => changeTab(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
                className="flex min-w-[170px] flex-1 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors"
                style={{
                  backgroundColor: isActive
                    ? 'color-mix(in srgb, var(--primary) 20%, var(--surface-2) 80%)'
                    : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
                  <span className="leading-tight">
                    <span className="block text-sm font-semibold">{tab.label}</span>
                    <span className="block text-[11px]">{tab.hint}</span>
                  </span>
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    backgroundColor: isActive
                      ? 'color-mix(in srgb, var(--primary) 24%, transparent)'
                      : 'color-mix(in srgb, var(--surface-2) 72%, transparent)',
                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Labels Tab Panel */}
      <section
        id="settings-panel-labels"
        role="tabpanel"
        aria-labelledby="settings-tab-labels"
        hidden={activeTab !== 'labels'}
      >
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
              <LoadingSpinner />
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
      </section>

      {/* Contacts Tab Panel */}
      <section
        id="settings-panel-contacts"
        role="tabpanel"
        aria-labelledby="settings-tab-contacts"
        hidden={activeTab !== 'contacts'}
      >
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
                  Contacts
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
              <LoadingSpinner />
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
      </section>

      {/* Appearance Tab Panel */}
      <section
        id="settings-panel-appearance"
        role="tabpanel"
        aria-labelledby="settings-tab-appearance"
        hidden={activeTab !== 'appearance'}
      >
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
            <div className="flex items-center gap-2.5">
              <Palette className="h-5 w-5" style={{ color: 'var(--primary)' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Appearance
              </h2>
            </div>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
              Choose a color theme for the interface.
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {themes.map((t) => {
                const isActive = theme.id === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className="flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-150"
                    style={{
                      backgroundColor: isActive
                        ? 'color-mix(in srgb, var(--primary) 8%, var(--surface-2))'
                        : 'var(--surface-2)',
                      borderColor: isActive
                        ? 'var(--primary)'
                        : 'var(--border-color)',
                      boxShadow: isActive
                        ? '0 0 0 1px var(--primary)'
                        : 'none',
                    }}
                  >
                    {/* Color swatch */}
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg overflow-hidden"
                      style={{
                        backgroundColor: t.colors.background,
                        border: `1px solid ${t.colors.border}`,
                      }}
                    >
                      <div className="flex gap-0.5">
                        <div
                          className="w-2.5 h-5 rounded-sm"
                          style={{ backgroundColor: t.colors.primary }}
                        />
                        <div
                          className="w-2.5 h-5 rounded-sm"
                          style={{ backgroundColor: t.colors.accent }}
                        />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {t.name}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {t.description}
                      </div>
                    </div>

                    {/* Check */}
                    {isActive && (
                      <Check className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SettingsPageContent />
    </Suspense>
  )
}
