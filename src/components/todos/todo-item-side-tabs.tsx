'use client'

import * as React from 'react'
import { IconButton } from '@/components/ui/button'
import type { IconName } from '@/components/ui/icon'
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
 * A card's drawer toggles (billing codes, contacts, timeline), as ghost icon buttons in its footer. They wait for the
 * card's hover or focus like the rest of its chrome; the open one stays visible on the deeper wash. Opening one
 * closes the others.
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
    <>
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
    </>
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
    <IconButton
      icon={icon}
      label={label}
      size="sm"
      aria-pressed={active}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className={cn(
        'p-1',
        active ? 'bg-wash-strong text-text' : 'text-quiet hover:text-text',
      )}
    />
  )
}
