'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { useYearStats } from '@/hooks/use-year-stats'
import { useAccomplishments } from '@/hooks/use-accomplishments'
import { useChartColors } from '@/hooks/use-chart-colors'
import { MonthlyChart } from '@/components/review/monthly-chart'
import { LabelsChart } from '@/components/review/labels-chart'
import { AccomplishmentsSection } from '@/components/review/accomplishments-section'

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

export default function ReviewPage() {
  const [year, setYear] = React.useState(currentYear)
  const { data: stats, isLoading } = useYearStats(year)
  const { accomplishments, create, update, remove } = useAccomplishments(year)
  const colors = useChartColors()

  const hasData = stats && (stats.summary.totalCreated > 0 || (stats.accomplishments?.total ?? 0) > 0 || accomplishments.length > 0)

  return (
    <div className="flex flex-col gap-4 sm:gap-6 pb-8">
      <div
        className="rounded-2xl border px-4 py-5 sm:px-6 sm:py-6"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p
              className="text-xs font-semibold uppercase tracking-[0.24em]"
              style={{ color: 'var(--text-muted)' }}
            >
              Year in Review
            </p>
            <div>
              <h1 className="text-2xl font-semibold sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
                {year} at a glance
              </h1>
              <p className="mt-1 text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
                Scan the charts first, then dive into the accomplishment timeline below.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="appearance-none rounded-lg border px-4 py-2 pr-9 text-sm font-medium focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--surface-2)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
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

      {stats && !hasData && !isLoading && (
        <div
          className="rounded-xl border p-12 text-center"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)' }}
        >
          <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            No data found for {year}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Tasks and accomplishments will show up here.
          </p>
        </div>
      )}

      {stats && hasData && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
            <MonthlyChart data={stats.monthly} colors={colors} />
            <LabelsChart data={stats.topLabels} colors={colors} />
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
