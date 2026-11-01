import type * as React from 'react'
import { Icon, type IconName } from '@/components/ui/icon'
import type { YearStats } from '@/types/stats'

interface SummaryCardsProps {
  summary: YearStats['summary']
  accomplishmentsTotal?: number
}

interface SummaryTile {
  label: string
  icon: IconName
  value: React.ReactNode
  unit?: string
}

/** The year's headline figures as dawn & dusk stat tiles in one joined grid: 2 across on phones, 3, then 6. */
export function SummaryCards({
  summary,
  accomplishmentsTotal = 0,
}: SummaryCardsProps) {
  const tiles: SummaryTile[] = [
    { label: 'Tasks created', icon: 'plus', value: summary.totalCreated },
    {
      label: 'Tasks completed',
      icon: 'success',
      value: summary.totalCompleted,
    },
    {
      label: 'Completion rate',
      icon: 'graph',
      value: summary.completionRate,
      unit: '%',
    },
    { label: 'Accomplishments', icon: 'star', value: accomplishmentsTotal },
    {
      label: 'Active streak',
      icon: 'calendar',
      value: summary.currentStreak,
      unit: 'mo',
    },
    {
      label: 'High priority done',
      icon: 'bolt',
      value: summary.highPriorityCompleted,
    },
  ]

  return (
    <div className="@container">
      <div className="dd-stat-grid dd-stat-grid--joined [--dd-stat-min:40%] @2xl:[--dd-stat-min:30%] @6xl:[--dd-stat-min:15%]">
        {tiles.map((tile) => (
          <div key={tile.label} className="dd-stat">
            <p className="dd-stat__label">
              <Icon name={tile.icon} />
              {tile.label}
            </p>
            <div className="dd-stat__main">
              <p className="dd-stat__value">
                {tile.value}
                {tile.unit && (
                  <span className="dd-stat__unit">{tile.unit}</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
