'use client'

import * as React from 'react'
import { Button, IconButton } from '@/components/ui/button'
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from '@/components/ui/drawer'
import { Icon, type IconName } from '@/components/ui/icon'
import { Textarea } from '@/components/ui/input'
import { useStatusUpdates } from '@/hooks/use-status-updates'
import { STATUS_CONFIG } from '@/lib/status'
import { cn } from '@/lib/utils'
import type { StatusUpdate } from '@/types/todo'

const MARKER_TONES = ['ok', 'warn', 'bad', 'info'] as const

/** A status marker takes its tone from the status colour when that colour is a state token (ok/warn/bad/info). */
function markerFor(update: StatusUpdate): {
  icon: IconName
  tone?: (typeof MARKER_TONES)[number]
} {
  if (!update.status) return { icon: 'chat' }
  const config = STATUS_CONFIG[update.status]
  return {
    icon: config.icon,
    tone: MARKER_TONES.find((tone) => config.colorVar === `var(--dd-${tone})`),
  }
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function dayHeading(day: Date) {
  const now = new Date()
  const daysAgo = Math.round(
    (startOfDay(now).getTime() - day.getTime()) / 86_400_000,
  )
  const label =
    daysAgo === 0
      ? 'Today'
      : daysAgo === 1
        ? 'Yesterday'
        : day.toLocaleDateString('en-US', { weekday: 'long' })
  const date = day.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(day.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
  })
  return { label, date }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
}

/** Updates arrive newest first; keep that order and split them into days. */
function groupByDay(updates: StatusUpdate[]) {
  const groups: { key: string; day: Date; updates: StatusUpdate[] }[] = []
  for (const update of updates) {
    const day = startOfDay(new Date(update.createdAt))
    const key = toIsoDate(day)
    const last = groups[groups.length - 1]
    if (last?.key === key) last.updates.push(update)
    else groups.push({ key, day, updates: [update] })
  }
  return groups
}

interface StatusUpdatesDrawerProps {
  todoId: string
  open: boolean
  onClose: () => void
}

export function StatusUpdatesDrawer({
  todoId,
  open,
  onClose,
}: StatusUpdatesDrawerProps) {
  const { updates, isLoading, addUpdate, removeUpdate } = useStatusUpdates(
    todoId,
    open,
  )
  const [newContent, setNewContent] = React.useState('')

  const handleAdd = async () => {
    const text = newContent.trim()
    if (!text) return
    try {
      await addUpdate({ content: text })
      setNewContent('')
    } catch {
      // onError toast handles user feedback
    }
  }

  // Reset new-content draft when the drawer closes.
  const [prevOpen, setPrevOpen] = React.useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (!open) {
      setNewContent('')
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <DrawerContent>
        <DrawerHeader eyebrow="Status updates" title="timeline" />
        <DrawerBody>
          {isLoading ? (
            <span className="dd-loading" role="status">
              <span className="dd-spinner dd-spinner--sm" aria-hidden="true" />
              Loading updates
            </span>
          ) : updates.length === 0 ? (
            <div className="dd-empty-state dd-empty-state--compact">
              <div className="dd-empty-state__icon">
                <Icon name="clock" />
              </div>
              <p className="dd-empty-state__title">No updates yet</p>
              <p className="dd-empty-state__text">
                Post what changed; each update lands here with its time.
              </p>
            </div>
          ) : (
            <div className="dd-timeline">
              {groupByDay(updates).map((group) => {
                const heading = dayHeading(group.day)
                return (
                  <section key={group.key} className="dd-timeline__group">
                    <h3 className="dd-timeline__day">
                      {heading.label}{' '}
                      <time className="dd-timeline__date" dateTime={group.key}>
                        {heading.date}
                      </time>
                    </h3>
                    <ol className="dd-timeline__list">
                      {group.updates.map((update) => {
                        const marker = markerFor(update)
                        return (
                          <li
                            key={update.id}
                            className="dd-timeline__item group/update"
                          >
                            <span
                              className={cn(
                                'dd-timeline__marker',
                                marker.tone &&
                                  `dd-timeline__marker--${marker.tone}`,
                              )}
                            >
                              <Icon name={marker.icon} />
                            </span>
                            <div className="dd-timeline__body pr-8">
                              <p className="dd-timeline__text">
                                {update.status && (
                                  <>
                                    <b>{STATUS_CONFIG[update.status].label}</b>
                                    {' · '}
                                  </>
                                )}
                                {update.content}
                              </p>
                              <time
                                className="dd-timeline__time"
                                dateTime={update.createdAt}
                              >
                                {formatTime(update.createdAt)}
                              </time>
                            </div>
                            <IconButton
                              icon="trash"
                              label="Remove update"
                              size="sm"
                              className="absolute top-0 right-0 text-sm opacity-0 group-focus-within/update:opacity-100 group-hover/update:opacity-100 focus-visible:opacity-100"
                              onClick={() => {
                                removeUpdate(update.id).catch(() => {})
                              }}
                            />
                          </li>
                        )
                      })}
                    </ol>
                  </section>
                )
              })}
            </div>
          )}
        </DrawerBody>

        <DrawerFooter>
          <Textarea
            boxClassName="basis-full"
            rows={2}
            aria-label="New update"
            placeholder="Add an update"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd()
            }}
          />
          <span className="dd-drawer__hint">⌘ ↵ to post</span>
          <Button
            variant="primary"
            onClick={handleAdd}
            disabled={!newContent.trim()}
          >
            <Icon name="send" />
            Add update
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
