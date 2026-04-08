'use client'

import * as React from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MonthlyData } from '@/types/stats'

interface MonthlyChartProps {
  data: MonthlyData[]
  colors: Record<string, string>
}

interface MonthlyStoryPoint extends MonthlyData {
  delta: number
  runningBalance: number
}

interface MonthlyStoryTooltipProps {
  active?: boolean
  payload?: Array<{ payload?: MonthlyStoryPoint }>
  label?: string
  colors: Record<string, string>
}

function formatSigned(value: number) {
  const rounded = Math.round(value * 10) / 10
  if (rounded > 0) return `+${rounded}`
  return `${rounded}`
}

function buildStoryData(data: MonthlyData[]) {
  let runningBalance = 0

  return data.map((month) => {
    const delta = month.completed - month.created
    runningBalance += delta

    return {
      ...month,
      delta,
      runningBalance,
    }
  })
}

function getPeakMonth(
  data: MonthlyStoryPoint[],
  key: 'created' | 'completed' | 'delta',
  preferPositive = false,
) {
  if (data.length === 0) return null

  const ranked = [...data].sort((a, b) => b[key] - a[key])
  if (preferPositive) {
    return ranked.find((entry) => entry[key] > 0) ?? null
  }

  return ranked[0] ?? null
}

function getPressureMonth(data: MonthlyStoryPoint[]) {
  const negativeMonths = data.filter((entry) => entry.delta < 0)
  if (negativeMonths.length === 0) return null

  return negativeMonths.reduce((lowest, entry) =>
    entry.delta < lowest.delta ? entry : lowest,
  )
}

function getStorySummary(data: MonthlyStoryPoint[]) {
  const monthsWithWork = data.filter((month) => month.created > 0 || month.completed > 0)
  if (monthsWithWork.length === 0) {
    return {
      insight: 'No task activity yet for this year.',
      pressureLabel: 'No pressure months',
      catchUpLabel: 'No catch-up months',
      balanceLabel: 'Balance 0',
    }
  }

  const peakCreated = getPeakMonth(monthsWithWork, 'created')
  const peakCompleted = getPeakMonth(monthsWithWork, 'completed')
  const catchUpMonth = getPeakMonth(monthsWithWork, 'delta', true)
  const pressureMonth = getPressureMonth(monthsWithWork)
  const finalBalance = monthsWithWork[monthsWithWork.length - 1]?.runningBalance ?? 0

  let insight = `${peakCompleted?.label ?? monthsWithWork[0].label} was your strongest delivery month.`

  if (pressureMonth && catchUpMonth) {
    insight = `${pressureMonth.label} added the most pressure (${formatSigned(
      pressureMonth.delta,
    )}), but ${catchUpMonth.label} was your best catch-up month (${formatSigned(
      catchUpMonth.delta,
    )}).`
  } else if (catchUpMonth) {
    insight = `${catchUpMonth.label} was your clearest catch-up month, with throughput outpacing intake by ${Math.abs(catchUpMonth.delta)}.`
  } else if (peakCreated) {
    insight = `${peakCreated.label} brought the biggest intake spike, and throughput never fully caught up in a single month.`
  }

  const pressureLabel = pressureMonth
    ? `Pressure peak ${pressureMonth.label}`
    : 'No pressure months'
  const catchUpLabel = catchUpMonth
    ? `Catch-up peak ${catchUpMonth.label}`
    : 'No catch-up months'
  const balanceLabel = `Balance ${formatSigned(finalBalance)}`

  return {
    insight,
    pressureLabel,
    catchUpLabel,
    balanceLabel,
  }
}

function MonthlyStoryTooltip({
  active,
  payload,
  label,
  colors,
}: MonthlyStoryTooltipProps) {
  const point = payload?.[0]?.payload

  if (!active || !point) return null

  return (
    <div
      className="rounded-xl border px-3 py-2.5 text-xs shadow-lg"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        color: colors.textPrimary,
      }}
    >
      {label && <p className="mb-2 font-semibold">{label}</p>}
      <div className="space-y-1.5">
        <p className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: colors.primary }}
          />
          <span style={{ color: colors.textMuted }}>Created</span>
          <span className="font-medium">{point.created}</span>
        </p>
        <p className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: colors.statusDone }}
          />
          <span style={{ color: colors.textMuted }}>Completed</span>
          <span className="font-medium">{point.completed}</span>
        </p>
        <p className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: colors.accent }}
          />
          <span style={{ color: colors.textMuted }}>Month net</span>
          <span className="font-medium">{formatSigned(point.delta)}</span>
        </p>
        <p className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: colors.textMuted }}
          />
          <span style={{ color: colors.textMuted }}>Running balance</span>
          <span className="font-medium">
            {formatSigned(point.runningBalance)}
          </span>
        </p>
      </div>
    </div>
  )
}

export function MonthlyChart({ data, colors }: MonthlyChartProps) {
  const storyData = React.useMemo(() => buildStoryData(data), [data])
  const { insight, pressureLabel, catchUpLabel, balanceLabel } =
    React.useMemo(() => getStorySummary(storyData), [storyData])
  const hasActivity = storyData.some(
    (month) => month.created > 0 || month.completed > 0,
  )

  if (!colors.primary) return null

  return (
    <div
      className="h-full rounded-2xl border p-4 sm:p-5"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border-color)',
        backgroundImage:
          'radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 9%, transparent), transparent 34%), radial-gradient(circle at 100% 12%, color-mix(in srgb, var(--status-done) 9%, transparent), transparent 28%)',
      }}
    >
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <div
            className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase"
            style={{
              borderColor:
                'color-mix(in srgb, var(--accent) 24%, var(--border-color))',
              color: 'var(--accent)',
              backgroundColor:
                'color-mix(in srgb, var(--accent) 8%, var(--surface))',
            }}
          >
            Pace Story
          </div>
          <div>
            <h3
              className="text-lg font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              How workload and throughput moved
            </h3>
            <p
              className="mt-1 text-sm leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              {insight}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:max-w-[240px] lg:justify-end">
          {[
            pressureLabel,
            catchUpLabel,
            balanceLabel,
          ].map((label) => (
            <div
              key={label}
              className="rounded-full border px-3 py-1.5 text-sm"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text-primary)',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {!hasActivity ? (
        <div
          className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed px-6 text-center"
          style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--surface-2)',
          }}
        >
          <div>
            <p
              className="text-base font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              No monthly task flow yet
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              Create and complete a few tasks and this chart will start telling
              the story of your pace through the year.
            </p>
          </div>
        </div>
      ) : (
        <div className="h-[300px] sm:h-[340px] lg:h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={storyData}
              margin={{ top: 12, right: 8, left: -12, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={colors.border}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: colors.textMuted, fontSize: 12 }}
                axisLine={{ stroke: colors.border }}
                tickLine={false}
              />
              <YAxis
                yAxisId="volume"
                tick={{ fill: colors.textMuted, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="balance"
                orientation="right"
                tick={{ fill: colors.textMuted, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={36}
              />
              <Tooltip
                content={<MonthlyStoryTooltip colors={colors} />}
                cursor={{
                  fill: 'color-mix(in srgb, var(--primary) 8%, transparent)',
                }}
              />
              <ReferenceLine
                yAxisId="balance"
                y={0}
                stroke={colors.border}
                strokeDasharray="4 4"
              />
              <Bar
                yAxisId="volume"
                dataKey="created"
                name="Created"
                fill={colors.primary}
                radius={[4, 4, 0, 0]}
                barSize={14}
              />
              <Bar
                yAxisId="volume"
                dataKey="completed"
                name="Completed"
                fill={colors.statusDone}
                radius={[4, 4, 0, 0]}
                barSize={14}
              />
              <Line
                yAxisId="balance"
                type="monotone"
                dataKey="runningBalance"
                name="Running balance"
                stroke={colors.accent}
                strokeWidth={2.5}
                dot={{
                  r: 2.5,
                  fill: colors.accent,
                  stroke: colors.surface,
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 4,
                  fill: colors.accent,
                  stroke: colors.surface,
                  strokeWidth: 2,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          {
            label: 'Created',
            value: storyData.reduce((total, month) => total + month.created, 0),
            color: colors.primary,
          },
          {
            label: 'Completed',
            value: storyData.reduce(
              (total, month) => total + month.completed,
              0,
            ),
            color: colors.statusDone,
          },
          {
            label: 'Running balance',
            value: balanceLabel.replace('Balance ', ''),
            color: colors.accent,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs sm:text-sm"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: `color-mix(in srgb, ${item.color} 10%, var(--surface-2))`,
              color: 'var(--text-primary)',
            }}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
            <span style={{ color: 'var(--text-muted)' }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
