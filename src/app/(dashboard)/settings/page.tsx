'use client'

import * as React from 'react'
import { Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Icon, type IconName } from '@/components/ui/icon'
import { PeopleManager } from '@/components/settings/people-manager'
import { usePeople } from '@/hooks/use-people'
import { useThemeChoice, type ThemeChoice } from '@/hooks/use-theme-choice'
import { cn } from '@/lib/utils'

const THEME_OPTIONS: { id: ThemeChoice; name: string; description: string }[] =
  [
    {
      id: 'dawn',
      name: 'Dawn',
      description: 'Light: warm greige paper, ink type',
    },
    {
      id: 'dusk',
      name: 'Dusk',
      description: 'Dark: warm charcoal, soft light type',
    },
    {
      id: 'system',
      name: 'System',
      description: 'Follow the operating system',
    },
  ]

type SettingsTab = 'contacts' | 'appearance'

const TAB_QUERY_KEY = 'tab'
const TAB_ORDER: SettingsTab[] = ['contacts', 'appearance']

const isSettingsTab = (value: string | null): value is SettingsTab =>
  value === 'contacts' || value === 'appearance'

function PageLoader({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-12">
      <span
        className="dd-loader dd-loader--sun"
        role="status"
        aria-label={label}
      >
        <span className="dd-loader__sky" aria-hidden="true">
          <i />
        </span>
        <span className="dd-loader__glyph" aria-hidden="true" />
      </span>
    </div>
  )
}

/** A thumbnail of the app drawn from the tokens inside a `data-theme` subtree, so it shows that theme's colours. */
function MiniApp({
  theme,
  className,
}: {
  theme: 'dawn' | 'dusk'
  className?: string
}) {
  return (
    <span
      data-theme={theme}
      className={cn('bg-bg flex h-16 gap-1.5 p-2', className)}
    >
      <span className="bg-surface rounded-ctl flex w-1/5 flex-col gap-1 p-1">
        <span className="bg-faint rounded-pill h-1" />
        <span className="bg-faint rounded-pill h-1 w-2/3" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="bg-text rounded-pill h-1.5 w-2/5" />
        <span className="bg-surface rounded-ctl flex flex-1 flex-col gap-1 p-1.5">
          <span className="bg-muted rounded-pill h-1 w-3/4" />
          <span className="mt-auto flex items-center gap-1">
            <span className="bg-set-1 size-1.5 rounded-full" />
            <span className="bg-set-5 size-1.5 rounded-full" />
            <span className="bg-primary rounded-pill ml-auto h-2 w-6" />
          </span>
        </span>
      </span>
    </span>
  )
}

function ThemePreview({ theme }: { theme: ThemeChoice }) {
  return (
    <span
      className="rounded-ctl relative mt-auto block overflow-hidden"
      aria-hidden="true"
    >
      {theme === 'system' ? (
        // Dawn on the left, dusk on the right of a diagonal; dawn runs a little under dusk so the seam has no gap.
        <>
          <MiniApp
            theme="dawn"
            className="[clip-path:polygon(-10%_-10%,61%_-10%,42%_110%,-10%_110%)]"
          />
          <MiniApp
            theme="dusk"
            className="absolute inset-0 [clip-path:polygon(59.6%_-10%,110%_-10%,110%_110%,40.4%_110%)]"
          />
        </>
      ) : (
        <MiniApp theme={theme} />
      )}
    </span>
  )
}

function SettingsPageContent() {
  const {
    people,
    isLoading: peopleLoading,
    isMutating: peopleMutating,
    handleCreate: handleCreatePerson,
    handleUpdate: handleUpdatePerson,
    handleDelete: handleDeletePerson,
  } = usePeople()
  const [themeChoice, setTheme] = useThemeChoice()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryTab = searchParams.get(TAB_QUERY_KEY)
  const activeTab: SettingsTab = isSettingsTab(queryTab) ? queryTab : 'contacts'

  React.useEffect(() => {
    if (queryTab !== null && !isSettingsTab(queryTab)) {
      const params = new URLSearchParams(searchParams.toString())
      params.set(TAB_QUERY_KEY, 'contacts')
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }, [pathname, queryTab, router, searchParams])

  const tabs: {
    id: SettingsTab
    label: string
    icon: IconName
    count?: number
  }[] = [
    { id: 'contacts', label: 'Contacts', icon: 'users', count: people.length },
    { id: 'appearance', label: 'Appearance', icon: 'sun' },
  ]

  const changeTab = (nextTab: SettingsTab) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(TAB_QUERY_KEY, nextTab)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // Roving focus: arrows move to the previous / next tab and select it, Home / End jump to the ends.
  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentTab: SettingsTab,
  ) => {
    const currentIndex = TAB_ORDER.indexOf(currentTab)
    const last = TAB_ORDER.length - 1
    let nextIndex: number
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = currentIndex === last ? 0 : currentIndex + 1
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = currentIndex === 0 ? last : currentIndex - 1
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = last
        break
      default:
        return
    }
    event.preventDefault()
    const nextTab = TAB_ORDER[nextIndex]
    document.getElementById(`settings-tab-${nextTab}`)?.focus()
    changeTab(nextTab)
  }

  return (
    <div className="@container mx-auto w-full max-w-5xl pt-2 pb-10">
      <div className="dd-tabs dd-tabs--vertical">
        <div
          className="dd-tabs__list @max-[859px]:max-w-none @min-[860px]:sticky @min-[860px]:top-6"
          role="tablist"
          aria-label="Settings"
          aria-orientation="vertical"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                className="dd-tabs__tab"
                id={`settings-tab-${tab.id}`}
                role="tab"
                aria-controls={`settings-panel-${tab.id}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => changeTab(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
              >
                <Icon name={tab.icon} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="dd-tabs__count">{tab.count}</span>
                )}
              </button>
            )
          })}
        </div>

        <div
          className="dd-tabs__panel max-w-3xl @max-[859px]:max-w-none @max-[859px]:basis-full"
          id="settings-panel-contacts"
          role="tabpanel"
          aria-labelledby="settings-tab-contacts"
          hidden={activeTab !== 'contacts'}
        >
          {peopleLoading ? (
            <PageLoader label="Loading contacts" />
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

        <div
          className="dd-tabs__panel max-w-3xl @max-[859px]:max-w-none @max-[859px]:basis-full"
          id="settings-panel-appearance"
          role="tabpanel"
          aria-labelledby="settings-tab-appearance"
          hidden={activeTab !== 'appearance'}
        >
          <div className="dd-form">
            <section
              className="dd-form__section"
              aria-labelledby="settings-theme-title"
            >
              <div className="dd-form__head">
                <h2 className="dd-form__title" id="settings-theme-title">
                  Theme
                </h2>
                <p className="dd-form__desc">
                  Applies right away, in every open tab.
                </p>
              </div>
              <fieldset className="dd-radio-cards">
                <legend className="dd-visually-hidden">Theme</legend>
                {THEME_OPTIONS.map((option) => (
                  <label key={option.id} className="dd-radio-card">
                    <input
                      className="dd-radio__input"
                      type="radio"
                      name="theme"
                      value={option.id}
                      checked={themeChoice === option.id}
                      onChange={() => setTheme(option.id)}
                    />
                    <span className="dd-radio-card__title">{option.name}</span>
                    <span className="dd-radio-card__desc">
                      {option.description}
                    </span>
                    <ThemePreview theme={option.id} />
                    <span className="dd-radio-card__mark">
                      <Icon name="check" />
                    </span>
                  </label>
                ))}
              </fieldset>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading settings" />}>
      <SettingsPageContent />
    </Suspense>
  )
}
