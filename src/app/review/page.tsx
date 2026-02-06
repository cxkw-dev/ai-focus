'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useYearStats } from '@/hooks/use-year-stats'
import { useChartColors } from '@/hooks/use-chart-colors'
import { SummaryCards } from '@/components/review/summary-cards'
import { MonthlyChart } from '@/components/review/monthly-chart'
import { StatusChart } from '@/components/review/status-chart'
import { PriorityChart } from '@/components/review/priority-chart'
import { CategoryChart } from '@/components/review/category-chart'
import { LabelsChart } from '@/components/review/labels-chart'
import { HighlightsPanel } from '@/components/review/highlights-panel'

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

export default function ReviewPage() {
  const [year, setYear] = React.useState(currentYear)
  const { data: stats, isLoading } = useYearStats(year)
  const colors = useChartColors()

  return (
    <DashboardLayout title="Year in Review">
      <div className="flex flex-col gap-6 pb-8">
        {/* Year Selector */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="appearance-none rounded-lg border px-4 py-2 pr-9 text-sm font-medium focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
                // ring color
                ['--tw-ring-color' as string]: 'var(--primary)',
              }}
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div
              className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
            />
          </div>
        )}

        {stats && stats.summary.totalCreated === 0 && !isLoading && (
          <div
            className="rounded-xl border p-12 text-center"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)' }}
          >
            <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              No tasks found for {year}
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Tasks you create and complete will show up here.
            </p>
          </div>
        )}

        {stats && stats.summary.totalCreated > 0 && (
          <>
            {/* Summary Cards */}
            <SummaryCards summary={stats.summary} />

            {/* Monthly Activity - full width */}
            <MonthlyChart data={stats.monthly} colors={colors} />

            {/* Status + Priority - side by side on desktop */}
            <div className="grid gap-6 md:grid-cols-2">
              <StatusChart data={stats.byStatus} colors={colors} />
              <PriorityChart data={stats.byPriority} colors={colors} />
            </div>

            {/* Category Breakdown - full width */}
            <CategoryChart data={stats.byCategory} colors={colors} />

            {/* Labels + Highlights - side by side on desktop */}
            <div className="grid gap-6 md:grid-cols-2">
              <LabelsChart data={stats.topLabels} colors={colors} />
              <HighlightsPanel highlights={stats.highlights} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
