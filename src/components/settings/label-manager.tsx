'use client'

import * as React from 'react'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Label as TodoLabel } from '@/types/todo'

interface LabelManagerProps {
  labels: TodoLabel[]
  onCreateLabel: (data: Pick<TodoLabel, 'name' | 'color'>) => Promise<boolean>
  onUpdateLabel: (id: string, data: Partial<Pick<TodoLabel, 'name' | 'color'>>) => Promise<boolean>
  onDeleteLabel: (id: string) => Promise<boolean>
  disabled?: boolean
}

export function LabelManager({
  labels,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
  disabled,
}: LabelManagerProps) {
  const [newName, setNewName] = React.useState('')
  const [newColor, setNewColor] = React.useState('#22c55e')
  const [presetColors, setPresetColors] = React.useState<Array<{ varName: string; value: string }>>([])
  const [drafts, setDrafts] = React.useState<Record<string, { name: string; color: string }>>({})
  const [isSaving, setIsSaving] = React.useState(false)
  const isCompact = labels.length > 6

  React.useEffect(() => {
    const nextDrafts: Record<string, { name: string; color: string }> = {}
    labels.forEach((label) => {
      nextDrafts[label.id] = { name: label.name, color: label.color }
    })
    setDrafts(nextDrafts)
  }, [labels])

  React.useEffect(() => {
    const rootStyles = getComputedStyle(document.documentElement)
    const presetVars = [
      '--primary',
      '--accent',
      '--status-in-progress',
      '--status-waiting',
      '--status-on-hold',
      '--status-done',
      '--priority-high',
      '--priority-urgent',
    ]

    const toHex = (value: string) => {
      const trimmed = value.trim()
      if (trimmed.startsWith('#')) return trimmed.toLowerCase()
      const match = trimmed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
      if (!match) return '#22c55e'
      const [, r, g, b] = match
      const toHexPart = (v: string) => Number(v).toString(16).padStart(2, '0')
      return `#${toHexPart(r)}${toHexPart(g)}${toHexPart(b)}`
    }

    const uniquePresets: Array<{ varName: string; value: string }> = []
    const seen = new Set<string>()
    presetVars.forEach((varName) => {
      const value = toHex(rootStyles.getPropertyValue(varName))
      const key = value.toLowerCase()
      if (seen.has(key)) return
      seen.add(key)
      uniquePresets.push({ varName, value })
    })
    setPresetColors(uniquePresets)
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setIsSaving(true)
    const success = await onCreateLabel({ name: newName.trim(), color: newColor })
    setIsSaving(false)
    if (success) {
      setNewName('')
      setNewColor('#22c55e')
    }
  }

  const commitUpdate = async (id: string, updates: Partial<Pick<TodoLabel, 'name' | 'color'>>) => {
    if (Object.keys(updates).length === 0) return
    setIsSaving(true)
    await onUpdateLabel(id, updates)
    setIsSaving(false)
  }

  const handleDelete = async (id: string) => {
    setIsSaving(true)
    await onDeleteLabel(id)
    setIsSaving(false)
  }

  return (
    <div className="space-y-5">
      <div
        className="rounded-xl border p-4 space-y-3"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'color-mix(in srgb, var(--surface) 60%, transparent)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Create Label
          </div>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: `${newColor}22`,
              color: newColor,
            }}
          >
            {newName.trim() ? newName.trim() : 'Preview'}
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] items-center">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Label name"
            disabled={disabled || isSaving}
            className="text-sm"
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Color
            </span>
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              disabled={disabled || isSaving}
              className="color-swatch h-9 w-9 rounded-full border-2 bg-transparent p-0"
              style={{
                borderColor: 'color-mix(in srgb, var(--border-color) 70%, transparent)',
                boxShadow: `0 0 0 2px ${newColor}22`,
              }}
              aria-label="Label color"
            />
          </div>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={!newName.trim() || disabled || isSaving}
          >
            Add label
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {presetColors.map((preset) => (
            <button
              key={preset.varName}
              type="button"
              onClick={() => setNewColor(preset.value)}
              className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-105"
              style={{
                backgroundColor: preset.value,
                borderColor: newColor === preset.value ? 'var(--text-primary)' : 'color-mix(in srgb, var(--border-color) 70%, transparent)',
                boxShadow: newColor === preset.value ? `0 0 0 2px ${preset.value}55` : 'none',
              }}
              aria-label={`Select ${preset.varName}`}
            />
          ))}
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Quick picks
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Existing Labels
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Tap save to apply changes
          </div>
        </div>

        {labels.length === 0 && (
          <div
            className="rounded-xl border p-4 text-xs"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'color-mix(in srgb, var(--surface) 70%, transparent)',
              color: 'var(--text-muted)',
            }}
          >
            No labels yet. Create your first label above.
          </div>
        )}

        {labels.map((label) => {
          const draft = drafts[label.id] ?? { name: label.name, color: label.color }

          return (
            <div
              key={label.id}
              className={cn(
                'flex flex-col gap-3 rounded-xl border',
                isCompact ? 'p-2' : 'p-3'
              )}
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'color-mix(in srgb, var(--surface-2) 80%, transparent)',
              }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    backgroundColor: `${draft.color}22`,
                    color: draft.color,
                  }}
                >
                  {draft.name.trim() || 'Untitled'}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Preview
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[220px]">
                  <Input
                    value={draft.name}
                    onChange={(e) => {
                      const next = e.target.value
                      setDrafts((prev) => ({
                        ...prev,
                        [label.id]: { ...draft, name: next },
                      }))
                    }}
                    disabled={disabled}
                    className="text-sm w-full"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Color
                  </span>
                  <input
                    type="color"
                    value={draft.color}
                    onChange={(e) => {
                      const next = e.target.value
                      setDrafts((prev) => ({
                        ...prev,
                        [label.id]: { ...draft, color: next },
                      }))
                    }}
                    disabled={disabled}
                    className="color-swatch h-8 w-8 rounded-full border-2 bg-transparent p-0"
                    style={{
                      borderColor: 'color-mix(in srgb, var(--border-color) 70%, transparent)',
                      boxShadow: `0 0 0 2px ${draft.color}22`,
                    }}
                    aria-label="Label color"
                  />
                </div>

                <div className="flex items-center gap-2 sm:ml-auto">
                  {(draft.name.trim() !== label.name || draft.color !== label.color) && (
                    <Button
                      type="button"
                      onClick={() => {
                        const updates: Partial<Pick<TodoLabel, 'name' | 'color'>> = {}
                        if (draft.name.trim() && draft.name.trim() !== label.name) updates.name = draft.name.trim()
                        if (draft.color !== label.color) updates.color = draft.color
                        if (Object.keys(updates).length > 0) void commitUpdate(label.id, updates)
                      }}
                      disabled={disabled || isSaving || !draft.name.trim()}
                      className="h-9 px-3 text-xs"
                    >
                      Save
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDelete(label.id)}
                    disabled={disabled || isSaving}
                    className="h-9 w-9 p-0 border-destructive/40 text-destructive hover:bg-destructive/10"
                    aria-label="Delete label"
                    title="Delete label"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {presetColors.map((preset) => (
                  <button
                    key={`${label.id}-${preset.varName}`}
                    type="button"
                    onClick={() =>
                      setDrafts((prev) => ({
                        ...prev,
                        [label.id]: { ...draft, color: preset.value },
                      }))
                    }
                    className={cn(
                      'h-6 w-6 rounded-full border-2 transition-transform hover:scale-105',
                      isCompact && 'h-5 w-5'
                    )}
                    style={{
                      backgroundColor: preset.value,
                      borderColor: draft.color === preset.value
                        ? 'var(--text-primary)'
                        : 'color-mix(in srgb, var(--border-color) 70%, transparent)',
                      boxShadow: draft.color === preset.value ? `0 0 0 2px ${preset.value}55` : 'none',
                    }}
                    aria-label={`Select ${preset.varName}`}
                    title="Apply theme color"
                  />
                ))}
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Theme picks
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
