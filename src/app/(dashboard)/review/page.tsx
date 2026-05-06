'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { ChevronDown } from 'lucide-react'
import { useYearStats } from '@/hooks/use-year-stats'
import { useAccomplishments } from '@/hooks/use-accomplishments'
import { useChartColors } from '@/hooks/use-chart-colors'
import { AccomplishmentsSection } from '@/components/review/accomplishments-section'
import type { FocusFlowData, MonthlyData } from '@/types/stats'

interface FocusSankeyChartProps {
  data: FocusFlowData
  colors: Record<string, string>
}

interface MonthlyChartProps {
  data: MonthlyData[]
  colors: Record<string, string>
}

function ChartLoading() {
  return (
    <div
      className="min-h-[280px] animate-pulse rounded-lg"
      style={{ backgroundColor: 'var(--surface)' }}
    />
  )
}

const FocusSankeyChart = dynamic<FocusSankeyChartProps>(
  () =>
    import('@/components/review/focus-sankey-chart').then(
      (mod) => mod.FocusSankeyChart,
    ),
  { loading: ChartLoading, ssr: false },
)

const MonthlyChart = dynamic<MonthlyChartProps>(
  () =>
    import('@/components/review/monthly-chart').then((mod) => mod.MonthlyChart),
  { loading: ChartLoading, ssr: false },
)

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

export default function ReviewPage() {
  const [year, setYear] = React.useState(currentYear)
  const { data: stats, isLoading } = useYearStats(year)
  const { accomplishments, create, update, remove } = useAccomplishments(year)
  const colors = useChartColors()

  const hasData =
    stats &&
    (stats.summary.totalCreated > 0 ||
      (stats.accomplishments?.total ?? 0) > 0 ||
      accomplishments.length > 0)

  return (
    <div className="flex flex-col gap-4 pb-8 sm:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1
            className="text-lg font-semibold sm:text-xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {year} snapshot
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Focus flow, pace shifts, and accomplishments.
          </p>
        </div>

        <div className="relative self-start sm:self-auto">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="appearance-none rounded-full border px-4 py-2 pr-9 text-sm font-medium focus:ring-2 focus:outline-none"
            style={{
              backgroundColor: 'var(--surface-2)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
              ['--tw-ring-color' as string]: 'var(--primary)',
            }}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div
            className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
            style={{
              borderColor: 'var(--primary)',
              borderTopColor: 'transparent',
            }}
          />
        </div>
      )}

      {stats && !hasData && !isLoading && (
        <div
          className="rounded-xl border p-12 text-center"
          style={{
            backgroundColor: 'var(--surface)',
            borderColor: 'var(--border-color)',
          }}
        >
          <p
            className="text-lg font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            No data found for {year}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Tasks and accomplishments will show up here.
          </p>
        </div>
      )}

      {stats && hasData && (
        <>
          <div className="grid grid-cols-1 items-stretch gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <FocusSankeyChart data={stats.focusFlow} colors={colors} />
            <MonthlyChart data={stats.monthly} colors={colors} />
          </div>

          <AccomplishmentsSection
            accomplishments={accomplishments}
            year={year}
            onCreate={(data) => create.mutate(data)}
            onUpdate={(id, data) => update.mutate({ id, data })}
            onDelete={(id) => remove.mutate(id)}
          />
        </>
      )}
    </div>
  )
}
