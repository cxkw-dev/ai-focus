'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog'
import { TextField, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
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

const isCategory = (value: string): value is AccomplishmentCategory =>
  CATEGORIES.some((c) => c.value === value)

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

  // Reset form whenever the dialog opens or the target accomplishment changes.
  const resetKey = open ? (accomplishment?.id ?? 'new') : null
  const [prevResetKey, setPrevResetKey] = React.useState<string | null>(null)
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey)
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
  }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form className="dd-dialog__form" onSubmit={handleSubmit}>
          <DialogHeader
            icon="star"
            title={
              accomplishment ? 'edit accomplishment' : 'add accomplishment'
            }
          />

          <DialogBody className="dd-form__body">
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What did you accomplish?"
              required
              autoFocus
            />

            <div className="dd-field">
              <label
                className="dd-field__label"
                htmlFor="accomplishment-description"
              >
                Description <span className="dd-field__opt">· optional</span>
              </label>
              <Textarea
                id="accomplishment-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details"
                rows={3}
              />
            </div>

            <div className="dd-form__grid">
              <div className="dd-field">
                <label
                  className="dd-field__label"
                  htmlFor="accomplishment-category"
                >
                  Category
                </label>
                <Select
                  id="accomplishment-category"
                  value={category}
                  onChange={(e) => {
                    if (isCategory(e.target.value)) setCategory(e.target.value)
                  }}
                  options={CATEGORIES}
                />
              </div>

              <TextField
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </DialogBody>

          <DialogFooter hint="esc to cancel">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!title.trim() || !date}
            >
              {accomplishment ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
