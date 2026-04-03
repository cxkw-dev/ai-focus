'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type {
  Accomplishment,
  AccomplishmentCategory,
} from '@/types/accomplishment'

const CATEGORIES: { value: AccomplishmentCategory; label: string }[] = [
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'HIRING', label: 'Hiring' },
  { value: 'MENTORING', label: 'Mentoring' },
  { value: 'COLLABORATION', label: 'Collaboration' },
  { value: 'GROWTH', label: 'Growth' },
  { value: 'OTHER', label: 'Other' },
]

interface AccomplishmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    title: string
    description?: string
    category: AccomplishmentCategory
    date: string
  }) => void
  accomplishment?: Accomplishment | null
}

export function AccomplishmentDialog({
  open,
  onOpenChange,
  onSubmit,
  accomplishment,
}: AccomplishmentDialogProps) {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [category, setCategory] =
    React.useState<AccomplishmentCategory>('DELIVERY')
  const [date, setDate] = React.useState('')

  React.useEffect(() => {
    if (open) {
      if (accomplishment) {
        setTitle(accomplishment.title)
        setDescription(accomplishment.description ?? '')
        setCategory(accomplishment.category)
        setDate(new Date(accomplishment.date).toISOString().split('T')[0])
      } else {
        setTitle('')
        setDescription('')
        setCategory('DELIVERY')
        setDate(new Date().toISOString().split('T')[0])
      }
    }
  }, [open, accomplishment])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !date) return
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      date,
    })
    onOpenChange(false)
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--surface-2)',
    borderColor: 'var(--border-color)',
    color: 'var(--text-primary)',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle>
              {accomplishment ? 'Edit' : 'Add'} Accomplishment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 px-5 pb-4">
            <div>
              <label
                className="mb-1 block text-xs font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What did you accomplish?"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                style={{
                  ...inputStyle,
                  ['--tw-ring-color' as string]: 'var(--primary)',
                }}
                autoFocus
              />
            </div>

            <div>
              <label
                className="mb-1 block text-xs font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details..."
                rows={3}
                className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                style={{
                  ...inputStyle,
                  ['--tw-ring-color' as string]: 'var(--primary)',
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="mb-1 block text-xs font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as AccomplishmentCategory)
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{
                    ...inputStyle,
                    ['--tw-ring-color' as string]: 'var(--primary)',
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="mb-1 block text-xs font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  style={{
                    ...inputStyle,
                    ['--tw-ring-color' as string]: 'var(--primary)',
                  }}
                />
              </div>
            </div>
          </div>

          <DialogFooter
            className="border-t px-5 py-3"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !date}
              className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
              }}
            >
              {accomplishment ? 'Save' : 'Add'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
