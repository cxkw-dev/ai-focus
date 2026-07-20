'use client'

import * as React from 'react'
import { Clock, DollarSign, Users } from 'lucide-react'
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

export function TodoItemSideTabs({
  hasBillingEntries,
  billingOpen,
  contactsOpen,
  timelineOpen,
  setBillingOpen,
  setContactsOpen,
  setTimelineOpen,
}: TodoItemSideTabsProps) {
  return (
    <div className="flex flex-shrink-0 flex-col gap-px self-stretch">
      {hasBillingEntries && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setBillingOpen((prev) => !prev)
            setContactsOpen(false)
            setTimelineOpen(false)
          }}
          className={cn(
            'todo-billing-tab flex w-5 flex-1 items-center justify-center rounded-tr-lg transition-all duration-150',
            billingOpen && 'todo-billing-tab-active',
          )}
          title="Billing codes"
        >
          <DollarSign className="h-3 w-3" />
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setContactsOpen((prev) => !prev)
          setBillingOpen(false)
          setTimelineOpen(false)
        }}
        className={cn(
          'todo-contacts-tab flex w-5 flex-1 items-center justify-center transition-all duration-150',
          !hasBillingEntries && 'rounded-tr-lg',
          contactsOpen && 'todo-contacts-tab-active',
        )}
        title="Contacts"
      >
        <Users className="h-3 w-3" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setTimelineOpen((prev) => !prev)
          setBillingOpen(false)
          setContactsOpen(false)
        }}
        className={cn(
          'todo-timeline-tab flex w-5 flex-1 items-center justify-center rounded-br-lg transition-all duration-150',
          timelineOpen && 'todo-timeline-tab-active',
        )}
        title="Timeline"
      >
        <Clock className="h-3 w-3" />
      </button>
    </div>
  )
}
