'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { useYearStats } from '@/hooks/use-year-stats'
import { useAccomplishments } from '@/hooks/use-accomplishments'
import { useChartColors, type ChartColors } from '@/hooks/use-chart-colors'
import { Icon } from '@/components/ui/icon'
import { Select } from '@/components/ui/select'
import { AccomplishmentsSection } from '@/components/review/accomplishments-section'
import type { FocusFlowData, MonthlyData } from '@/types/stats'

interface FocusSankeyChartProps {
  data: FocusFlowData
  colors: ChartColors
}

interface MonthlyChartProps {
  data: MonthlyData[]
  colors: ChartColors
}

function ChartLoading() {
  return <div className="dd-skeleton min-h-100" aria-hidden="true" />
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
const yearOptions = Array.from({ length: 5 }, (_, i) => {
  const value = String(currentYear - i)
  return { value, label: value }
})

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
    <div className="flex flex-col gap-8 pb-8 sm:gap-10">
      <header className="dd-page-header">
        <div className="dd-page-header__row">
          <div className="dd-page-header__titles">
            <h1 className="dd-page-header__title">{year} snapshot</h1>
          </div>
          <div className="dd-page-header__actions">
            <Select
              aria-label="Year"
              value={String(year)}
              onChange={(e) => setYear(Number(e.target.value))}
              options={yearOptions}
              boxClassName="w-30"
              className="font-mono tabular-nums"
            />
          </div>
        </div>
        <p className="dd-page-header__desc">
          Focus flow, pace shifts, and accomplishments.
        </p>
      </header>

      {isLoading && (
        <div className="dd-page-loader" role="status">
          <span
            className="dd-loader dd-loader--sun dd-loader--lg"
            aria-hidden="true"
          >
            <span className="dd-loader__sky" aria-hidden="true">
              <i />
            </span>
            <span className="dd-loader__glyph" aria-hidden="true" />
          </span>
          <p className="dd-page-loader__label">Loading {year}</p>
        </div>
      )}

      {stats && !hasData && !isLoading && (
        <div className="dd-surface">
          <div className="dd-empty-state">
            <div className="dd-empty-state__icon">
              <Icon name="calendar" />
            </div>
            <h2 className="dd-empty-state__title">No data found for {year}</h2>
            <p className="dd-empty-state__text">
              Tasks and accomplishments will show up here.
            </p>
          </div>
        </div>
      )}

      {stats && hasData && (
        <>
          <div className="grid grid-cols-1 items-stretch gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:gap-6">
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
