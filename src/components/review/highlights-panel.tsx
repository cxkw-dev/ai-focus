'use client'

import { Calendar, Trophy, FolderOpen, Tag } from 'lucide-react'
import type { Highlights } from '@/types/stats'

interface HighlightsPanelProps {
  highlights: Highlights
}

export function HighlightsPanel({ highlights }: HighlightsPanelProps) {
  const items = [
    {
      icon: Calendar,
      label: 'Busiest Month',
      value: highlights.busiestMonth,
      color: 'var(--primary)',
    },
    {
      icon: Trophy,
      label: 'Most Productive',
      value: highlights.mostProductiveMonth,
      color: 'var(--status-done)',
    },
    {
      icon: FolderOpen,
      label: 'Top Category',
      value: highlights.topCategory,
      color: 'var(--accent)',
    },
    {
      icon: Tag,
      label: 'Top Label',
      value: highlights.topLabel,
      color: 'var(--status-in-progress)',
    },
  ].filter(item => item.value)

  if (items.length === 0) {
    return (
      <div
        className="rounded-xl border p-5 flex items-center justify-center"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)', minHeight: 200 }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No highlights yet</p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl border p-5 relative overflow-hidden"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)' }}
    >
      <div className="absolute top-0 left-3 right-3 h-[3px] rounded-b-full" style={{ backgroundColor: 'var(--status-waiting)' }} />
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Highlights
      </h3>
      <div className="space-y-4">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: `color-mix(in srgb, ${item.color} 15%, transparent)` }}
              >
                <Icon className="h-4 w-4" style={{ color: item.color }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {item.value}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
