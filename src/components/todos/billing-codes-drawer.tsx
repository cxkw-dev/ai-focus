'use client'

import * as React from 'react'
import { IconButton } from '@/components/ui/button'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerSection,
} from '@/components/ui/drawer'
import { Icon } from '@/components/ui/icon'
import { buildBillingCodeTitle, type BillingCodeEntry } from '@/lib/labels'

interface BillingCodesDrawerProps {
  entries: BillingCodeEntry[]
  open: boolean
  onClose: () => void
}

type CopyFeedback = {
  entryId: string
  status: 'copied' | 'error'
}

export function BillingCodesDrawer({
  entries,
  open,
  onClose,
}: BillingCodesDrawerProps) {
  const [copyFeedback, setCopyFeedback] = React.useState<CopyFeedback | null>(
    null,
  )
  const groupedEntries = React.useMemo(() => {
    const groups = new Map<
      string,
      {
        labelId: string
        labelName: string
        labelColor: string
        entries: BillingCodeEntry[]
      }
    >()

    entries.forEach((entry) => {
      const existingGroup = groups.get(entry.labelId)

      if (existingGroup) {
        existingGroup.entries.push(entry)
        return
      }

      groups.set(entry.labelId, {
        labelId: entry.labelId,
        labelName: entry.labelName,
        labelColor: entry.labelColor,
        entries: [entry],
      })
    })

    return Array.from(groups.values())
  }, [entries])
  const showLabelContext = groupedEntries.length > 1

  const handleCopy = async (entry: BillingCodeEntry) => {
    try {
      await navigator.clipboard.writeText(entry.billingCode.code)
      setCopyFeedback({ entryId: entry.billingCode.id, status: 'copied' })
    } catch {
      setCopyFeedback({ entryId: entry.billingCode.id, status: 'error' })
    }
  }

  // Feedback clears itself; a new copy (or closing the drawer) cancels the pending reset.
  React.useEffect(() => {
    if (!copyFeedback) return
    const timeout = setTimeout(
      () => setCopyFeedback(null),
      copyFeedback.status === 'copied' ? 1600 : 2200,
    )
    return () => clearTimeout(timeout)
  }, [copyFeedback])

  // Reset feedback state when the drawer closes (React 19 reset-on-prop pattern).
  const [prevOpen, setPrevOpen] = React.useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (!open) {
      setCopyFeedback(null)
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <DrawerContent size="sm">
        <DrawerHeader title="billing codes" />
        <DrawerBody>
          {entries.length === 0 ? (
            <div className="dd-empty-state dd-empty-state--compact">
              <div className="dd-empty-state__icon">
                <Icon name="tag" />
              </div>
              <p className="dd-empty-state__title">No billing codes</p>
              <p className="dd-empty-state__text">
                None of this task’s labels has a billing code.
              </p>
            </div>
          ) : (
            groupedEntries.map((group) => (
              <DrawerSection
                key={group.labelId}
                title={
                  showLabelContext ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="size-1.5 flex-none rounded-full"
                        style={{ backgroundColor: group.labelColor }}
                        aria-hidden="true"
                      />
                      {group.labelName}
                    </span>
                  ) : undefined
                }
              >
                <dl className="dd-description-list dd-description-list--compact">
                  {group.entries.map((entry) => {
                    const feedbackState =
                      copyFeedback?.entryId === entry.billingCode.id
                        ? copyFeedback.status
                        : null

                    return (
                      <div
                        key={entry.billingCode.id}
                        className="dd-description-list__item"
                        title={buildBillingCodeTitle(
                          entry.labelName,
                          entry.billingCode,
                        )}
                      >
                        <dt className="dd-description-list__term">
                          {entry.billingCode.type}
                        </dt>
                        <dd className="dd-description-list__details">
                          <span className="dd-description-list__mono min-w-0 flex-1 font-medium">
                            {entry.billingCode.code}
                          </span>
                          {feedbackState === 'copied' && (
                            <span
                              className="animate-fade-in text-ok inline-flex items-center gap-1 text-xs"
                              role="status"
                            >
                              <Icon name="check" />
                              Copied
                            </span>
                          )}
                          {feedbackState === 'error' && (
                            <span
                              className="animate-fade-in text-bad text-xs"
                              role="status"
                            >
                              Couldn’t copy
                            </span>
                          )}
                          <IconButton
                            icon={feedbackState === 'copied' ? 'check' : 'copy'}
                            label={`Copy ${entry.billingCode.code}`}
                            size="sm"
                            className="-my-1 text-sm"
                            onClick={() => void handleCopy(entry)}
                          />
                          {entry.billingCode.description && (
                            <span className="dd-description-list__muted basis-full text-xs">
                              {entry.billingCode.description}
                            </span>
                          )}
                        </dd>
                      </div>
                    )
                  })}
                </dl>
              </DrawerSection>
            ))
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}
