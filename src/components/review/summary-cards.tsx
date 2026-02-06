'use client'

import {
  PlusCircle,
  CheckCircle2,
  TrendingUp,
  Clock,
  Flame,
  Zap,
} from 'lucide-react'
import type { YearStats } from '@/types/stats'

interface SummaryCardsProps {
  summary: YearStats['summary']
}

export function SummaryCards({ summary }: SummaryCardsProps) {
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
      label: 'Avg Days to Complete',
      value: summary.avgCompletionDays,
      icon: Clock,
      color: 'var(--status-waiting)',
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
            className="rounded-xl border p-4"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4" style={{ color: card.color }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {card.label}
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {card.value}
            </p>
          </div>
        )
      })}
    </div>
  )
}
