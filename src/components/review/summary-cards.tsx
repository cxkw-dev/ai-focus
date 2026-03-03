'use client'

import {
  PlusCircle,
  CheckCircle2,
  TrendingUp,
  Trophy,
  Flame,
  Zap,
} from 'lucide-react'
import type { YearStats } from '@/types/stats'

interface SummaryCardsProps {
  summary: YearStats['summary']
  accomplishmentsTotal?: number
}

export function SummaryCards({ summary, accomplishmentsTotal = 0 }: SummaryCardsProps) {
  const cards = [
    {
      label: 'Tasks Created',
      value: summary.totalCreated,
      icon: PlusCircle,
      color: 'var(--primary)',
    },
    {
      label: 'Tasks Completed',
      value: summary.totalCompleted,
      icon: CheckCircle2,
      color: 'var(--status-done)',
    },
    {
      label: 'Completion Rate',
      value: `${summary.completionRate}%`,
      icon: TrendingUp,
      color: 'var(--accent)',
    },
    {
      label: 'Accomplishments',
      value: accomplishmentsTotal,
      icon: Trophy,
      color: 'var(--category-delivery)',
    },
    {
      label: 'Active Streak',
      value: `${summary.currentStreak} mo`,
      icon: Flame,
      color: 'var(--priority-urgent)',
    },
    {
      label: 'High Priority Done',
      value: summary.highPriorityCompleted,
      icon: Zap,
      color: 'var(--priority-high)',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="relative rounded-xl border p-4 overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-color)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `color-mix(in srgb, ${card.color} 40%, var(--border-color))`
              e.currentTarget.style.boxShadow = `0 4px 12px color-mix(in srgb, ${card.color} 10%, transparent)`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {/* Colored top accent line */}
            <div
              className="absolute top-0 left-0 right-0 h-0.5"
              style={{ backgroundColor: card.color }}
            />
            <div className="flex items-center gap-2 mb-3">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ backgroundColor: `color-mix(in srgb, ${card.color} 12%, transparent)` }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: card.color }} />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {card.label}
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {card.value}
            </p>
          </div>
        )
      })}
    </div>
  )
}
