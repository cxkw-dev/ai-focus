'use client'

import * as React from 'react'
import { Icon, type IconName } from '@/components/ui/icon'
import { Tip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface TodoItemSideTabsProps {
  hasBillingEntries: boolean
  billingOpen: boolean
  contactsOpen: boolean
  timelineOpen: boolean
  setBillingOpen: React.Dispatch<React.SetStateAction<boolean>>
  setContactsOpen: React.Dispatch<React.SetStateAction<boolean>>
  setTimelineOpen: React.Dispatch<React.SetStateAction<boolean>>
}

/**
 * The card's quiet side strip: one tonal tab per drawer (billing codes, contacts, timeline). Opening one closes the
 * others; the open tab takes the deeper wash.
 */
export function TodoItemSideTabs({
  hasBillingEntries,
  billingOpen,
  contactsOpen,
  timelineOpen,
  setBillingOpen,
  setContactsOpen,
  setTimelineOpen,
}: TodoItemSideTabsProps) {
  const open = (tab: 'billing' | 'contacts' | 'timeline') => {
    setBillingOpen((prev) => (tab === 'billing' ? !prev : false))
    setContactsOpen((prev) => (tab === 'contacts' ? !prev : false))
    setTimelineOpen((prev) => (tab === 'timeline' ? !prev : false))
  }

  return (
    <div className="rounded-r-box bg-wash flex w-6 flex-none flex-col overflow-hidden">
      {hasBillingEntries && (
        <SideTab
          icon="tag"
          label="Billing codes"
          active={billingOpen}
          onClick={() => open('billing')}
        />
      )}
      <SideTab
        icon="users"
        label="Contacts"
        active={contactsOpen}
        onClick={() => open('contacts')}
      />
      <SideTab
        icon="clock"
        label="Timeline"
        active={timelineOpen}
        onClick={() => open('timeline')}
      />
    </div>
  )
}

function SideTab({
  icon,
  label,
  active,
  onClick,
}: {
  icon: IconName
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <Tip label={label} side="right">
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        onClick={(event) => {
          event.stopPropagation()
          onClick()
        }}
        className={cn(
          'flex min-h-5 flex-1 items-center justify-center text-sm transition-colors',
          active
            ? 'bg-wash-strong text-text'
            : 'text-quiet hover:bg-wash hover:text-text',
        )}
      >
        <Icon name={icon} />
      </button>
    </Tip>
  )
}
