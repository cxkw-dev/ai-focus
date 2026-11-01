'use client'

import * as React from 'react'
import { Button, IconButton } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Tip } from '@/components/ui/tooltip'
import type {
  Accomplishment,
  AccomplishmentCategory,
} from '@/types/accomplishment'
import { CategoryBadge } from './category-badge'
import { AccomplishmentDialog } from './accomplishment-dialog'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const FILTER_OPTIONS: {
  value: AccomplishmentCategory | 'ALL'
  label: string
}[] = [
  { value: 'ALL', label: 'All' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'HIRING', label: 'Hiring' },
  { value: 'MENTORING', label: 'Mentoring' },
  { value: 'COLLABORATION', label: 'Collaboration' },
  { value: 'GROWTH', label: 'Growth' },
  { value: 'OTHER', label: 'Other' },
]

interface AccomplishmentsSectionProps {
  accomplishments: Accomplishment[]
  year: number
  onCreate: (data: {
    title: string
    description?: string
    category: AccomplishmentCategory
    date: string
  }) => void
  onUpdate: (
    id: string,
    data: {
      title?: string
      description?: string | null
      category?: AccomplishmentCategory
      date?: string
    },
  ) => void
  onDelete: (id: string) => void
}

export function AccomplishmentsSection({
  accomplishments,
  year,
  onCreate,
  onUpdate,
  onDelete,
}: AccomplishmentsSectionProps) {
  const [filter, setFilter] = React.useState<AccomplishmentCategory | 'ALL'>(
    'ALL',
  )
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Accomplishment | null>(null)
  const filterName = React.useId()

  const filtered =
    filter === 'ALL'
      ? accomplishments
      : accomplishments.filter((a) => a.category === filter)

  // Group by month, newest month first
  const monthGroups = new Map<number, Accomplishment[]>()
  for (const a of filtered) {
    const month = new Date(a.date).getMonth()
    const list = monthGroups.get(month) || []
    list.push(a)
    monthGroups.set(month, list)
  }
  const grouped = Array.from(monthGroups.entries()).sort((a, b) => b[0] - a[0])

  const countFor = (value: AccomplishmentCategory | 'ALL') =>
    value === 'ALL'
      ? accomplishments.length
      : accomplishments.filter((a) => a.category === value).length

  function handleEdit(a: Accomplishment) {
    setEditing(a)
    setDialogOpen(true)
  }

  function handleDialogSubmit(data: {
    title: string
    description?: string
    category: AccomplishmentCategory
    date: string
  }) {
    if (editing) {
      onUpdate(editing.id, data)
    } else {
      onCreate(data)
    }
    setEditing(null)
  }

  return (
    <section aria-labelledby="review-accomplishments-title">
      <header className="dd-table-header">
        <h2
          className="dd-table-header__title"
          id="review-accomplishments-title"
        >
          accomplishments
        </h2>
        {accomplishments.length > 0 && (
          <span className="dd-table-header__meta">
            {accomplishments.length}
          </span>
        )}
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <Icon name="plus" />
          Add
        </Button>
      </header>

      <fieldset className="dd-segmented dd-segmented--sm mb-3">
        <legend className="dd-visually-hidden">Filter by category</legend>
        {FILTER_OPTIONS.map((opt) => (
          <label key={opt.value} className="dd-segmented__item">
            <input
              type="radio"
              name={filterName}
              value={opt.value}
              checked={filter === opt.value}
              onChange={() => setFilter(opt.value)}
            />
            <span>{opt.label}</span>
            <span className="dd-segmented__count">{countFor(opt.value)}</span>
          </label>
        ))}
      </fieldset>

      <div className="dd-surface p-2 sm:p-3">
        {filtered.length === 0 ? (
          <div className="dd-empty-state dd-empty-state--compact">
            <div className="dd-empty-state__icon">
              <Icon name={accomplishments.length === 0 ? 'star' : 'filter'} />
            </div>
            {accomplishments.length === 0 ? (
              <>
                <h3 className="dd-empty-state__title">
                  No accomplishments for {year} yet
                </h3>
                <p className="dd-empty-state__text">
                  Start tracking your wins.
                </p>
              </>
            ) : (
              <>
                <h3 className="dd-empty-state__title">
                  No accomplishments match
                </h3>
                <p className="dd-empty-state__text">
                  Nothing in this category yet.
                </p>
                <div className="dd-empty-state__actions">
                  <Button size="sm" onClick={() => setFilter('ALL')}>
                    <Icon name="x" />
                    Show all
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {grouped.map(([month, items]) => (
              <div key={month}>
                <h3 className="dd-eyebrow px-2 pt-1 pb-1.5">
                  {MONTH_NAMES[month]} {year}
                </h3>
                <ul className="flex flex-col">
                  {items.map((a) => (
                    <li
                      key={a.id}
                      className="group rounded-ctl hover:bg-wash flex items-start gap-3 px-2 py-1.5 transition-colors"
                    >
                      <time
                        dateTime={a.date}
                        className="text-muted w-10 shrink-0 pt-0.5 font-mono text-xs tabular-nums"
                      >
                        {new Date(a.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </time>

                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 sm:flex-nowrap">
                          <CategoryBadge category={a.category} />
                          {a.todoId && (
                            <Tip label="Picked out of a completed task by the local AI">
                              <span className="text-muted inline-flex shrink-0">
                                <Icon name="ai-wand" label="Classified by AI" />
                              </span>
                            </Tip>
                          )}
                          <span className="min-w-0 text-sm font-medium sm:truncate">
                            {a.title}
                          </span>
                        </div>
                        {a.description && (
                          <p className="text-muted mt-0.5 line-clamp-2 text-xs">
                            {a.description}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100">
                        <IconButton
                          icon="edit"
                          label="Edit accomplishment"
                          size="sm"
                          onClick={() => handleEdit(a)}
                        />
                        <IconButton
                          icon="trash"
                          label="Delete accomplishment"
                          size="sm"
                          onClick={() => onDelete(a.id)}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <AccomplishmentDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        onSubmit={handleDialogSubmit}
        accomplishment={editing}
      />
    </section>
  )
}
