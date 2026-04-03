'use client'

import * as React from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type {
  Accomplishment,
  AccomplishmentCategory,
} from '@/types/accomplishment'
import { CategoryBadge, getCategoryLabel } from './category-badge'
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

  const filtered =
    filter === 'ALL'
      ? accomplishments
      : accomplishments.filter((a) => a.category === filter)

  // Group by month
  const grouped = React.useMemo(() => {
    const map = new Map<number, Accomplishment[]>()
    for (const a of filtered) {
      const month = new Date(a.date).getMonth()
      const list = map.get(month) || []
      list.push(a)
      map.set(month, list)
    }
    // Sort months descending
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0])
  }, [filtered])

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
    <div
      className="rounded-xl border p-3 sm:p-5"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: 'var(--primary)' }}
          />
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Accomplishments
          </h3>
          {accomplishments.length > 0 && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              ({accomplishments.length})
            </span>
          )}
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {/* Category filter chips */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTER_OPTIONS.map((opt) => {
          const active = filter === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: active ? 'var(--primary)' : 'var(--surface-2)',
                color: active
                  ? 'var(--primary-foreground)'
                  : 'var(--text-muted)',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Timeline list */}
      {filtered.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {accomplishments.length === 0
              ? `No accomplishments for ${year} yet. Start tracking your wins!`
              : 'No accomplishments match the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([month, items]) => (
            <div key={month}>
              <h4
                className="mb-2 text-xs font-semibold tracking-wider uppercase"
                style={{ color: 'var(--text-muted)' }}
              >
                {MONTH_NAMES[month]} {year}
              </h4>
              <div className="space-y-1.5">
                {items.map((a) => (
                  <div
                    key={a.id}
                    className="group flex items-start gap-3 rounded-lg px-3 py-2 transition-colors"
                    style={{ ['--hover-bg' as string]: 'var(--surface-2)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    {/* Date */}
                    <span
                      className="mt-0.5 shrink-0 text-xs tabular-nums"
                      style={{ color: 'var(--text-muted)', width: '2.5rem' }}
                    >
                      {new Date(a.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <CategoryBadge category={a.category} />
                        <span
                          className="truncate text-sm font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {a.title}
                        </span>
                      </div>
                      {a.description && (
                        <p
                          className="mt-0.5 line-clamp-2 text-xs"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {a.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => handleEdit(a)}
                        className="rounded p-1 transition-colors hover:bg-[var(--surface)]"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(a.id)}
                        className="rounded p-1 transition-colors hover:bg-[var(--surface)]"
                        style={{ color: 'var(--destructive)' }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AccomplishmentDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        onSubmit={handleDialogSubmit}
        accomplishment={editing}
      />
    </div>
  )
}
