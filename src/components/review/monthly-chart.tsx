'use client'

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
import { Icon } from '@/components/ui/icon'
import {
  seriesClass,
  seriesColor,
  type ChartColors,
} from '@/hooks/use-chart-colors'
import type { MonthlyData } from '@/types/stats'
import { ChartTip } from './chart-tooltip'

interface MonthlyChartProps {
  data: MonthlyData[]
  colors: ChartColors
}

interface MonthlyStoryPoint extends MonthlyData {
  delta: number
  runningBalance: number
}

interface MonthlyStoryTooltipProps {
  active?: boolean
  payload?: Array<{ payload?: MonthlyStoryPoint }>
  label?: string | number
}

// Axis ticks take the system's tick style (mono, xs, muted); the plots share one y-axis width so they line up.
const TICK = { className: 'dd-chart__tick' }
const Y_AXIS_WIDTH = 32
const SYNC_ID = 'review-pace-story'

function formatSigned(value: number) {
  const rounded = Math.round(value * 10) / 10
  if (rounded > 0) return `+${rounded}`
  return `${rounded}`
}

function buildStoryData(data: MonthlyData[]): MonthlyStoryPoint[] {
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
  const monthsWithWork = data.filter(
    (month) => month.created > 0 || month.completed > 0,
  )
  if (monthsWithWork.length === 0) {
    return {
      insight: 'No task activity yet for this year.',
      pressureMonth: null,
      catchUpMonth: null,
      finalBalance: 0,
    }
  }

  const peakCreated = getPeakMonth(monthsWithWork, 'created')
  const peakCompleted = getPeakMonth(monthsWithWork, 'completed')
  const catchUpMonth = getPeakMonth(monthsWithWork, 'delta', true)
  const pressureMonth = getPressureMonth(monthsWithWork)
  const finalBalance =
    monthsWithWork[monthsWithWork.length - 1]?.runningBalance ?? 0

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

  return { insight, pressureMonth, catchUpMonth, finalBalance }
}

function MonthlyStoryTooltip({
  active,
  payload,
  label,
}: MonthlyStoryTooltipProps) {
  const point = payload?.[0]?.payload

  if (!active || !point) return null

  return (
    <ChartTip
      title={label}
      rows={[
        { label: 'Created', value: point.created, series: seriesClass(0) },
        { label: 'Completed', value: point.completed, series: seriesClass(1) },
        {
          label: 'Running balance',
          value: formatSigned(point.runningBalance),
          series: seriesClass(2),
        },
        { label: 'Month net', value: formatSigned(point.delta), total: true },
      ]}
    />
  )
}

/** A peak month as an inline stat: the month, and its net change with a tone for what that change means. */
function PeakStat({
  label,
  month,
  tone,
}: {
  label: string
  month: MonthlyStoryPoint | null
  tone: 'ok' | 'bad'
}) {
  return (
    <p className="dd-stat dd-stat--inline">
      <span className="dd-stat__label">{label}</span>
      <span className="dd-stat__value">{month ? month.label : 'none'}</span>
      {month && (
        <span className={`dd-stat__delta dd-stat__delta--${tone}`}>
          <Icon name={month.delta > 0 ? 'arrow-up' : 'arrow-down'} />
          <span className="dd-visually-hidden">
            {month.delta > 0 ? 'Up' : 'Down'}
          </span>
          {formatSigned(month.delta)}
        </span>
      )}
    </p>
  )
}

export function MonthlyChart({ data, colors }: MonthlyChartProps) {
  const storyData = buildStoryData(data)
  const { insight, pressureMonth, catchUpMonth, finalBalance } =
    getStorySummary(storyData)
  const hasActivity = storyData.some(
    (month) => month.created > 0 || month.completed > 0,
  )
  const totalCreated = storyData.reduce(
    (total, month) => total + month.created,
    0,
  )
  const totalCompleted = storyData.reduce(
    (total, month) => total + month.completed,
    0,
  )
  const balanceColor = seriesColor(colors, 2)

  return (
    <section
      aria-labelledby="review-pace-title"
      className="flex h-full min-w-0 flex-col"
    >
      <header className="dd-table-header">
        <h2 className="dd-table-header__title" id="review-pace-title">
          pace story
        </h2>
      </header>

      <figure className="dd-chart flex-1 [--dd-chart-height:300px]">
        <figcaption className="dd-chart__head">
          <div className="max-w-prose min-w-0">
            <p className="dd-chart__title">How workload and throughput moved</p>
            <p className="dd-chart__sub">{insight}</p>
          </div>
          <ul className="dd-chart__legend">
            <li className={`dd-chart__key ${seriesClass(0)}`}>
              Created
              <span className="dd-chart__key-value pl-1.5">{totalCreated}</span>
            </li>
            <li className={`dd-chart__key ${seriesClass(1)}`}>
              Completed
              <span className="dd-chart__key-value pl-1.5">
                {totalCompleted}
              </span>
            </li>
            <li
              className={`dd-chart__key dd-chart__key--line ${seriesClass(2)}`}
            >
              Running balance
            </li>
          </ul>
        </figcaption>

        <div className="dd-stat-inline-group">
          <PeakStat label="Pressure peak" month={pressureMonth} tone="bad" />
          <PeakStat label="Catch-up peak" month={catchUpMonth} tone="ok" />
          <p className="dd-stat dd-stat--inline">
            <span className="dd-stat__label">Balance</span>
            <span className="dd-stat__value">{formatSigned(finalBalance)}</span>
          </p>
        </div>

        {!hasActivity ? (
          <div className="dd-chart__frame">
            <div className="dd-chart__plot is-empty">
              <div className="dd-chart__empty">
                <Icon name="chart" />
                <b>No monthly task flow yet</b>
                <span>
                  Create and complete a few tasks and this chart will start
                  telling the story of your pace through the year.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Two measures, two plots: volume above, the running balance below, on one shared month axis. */}
            <div className="flex flex-col gap-1.5">
              <div
                className="h-52"
                role="img"
                aria-label="Tasks created and completed per month"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={storyData}
                    syncId={SYNC_ID}
                    barGap={2}
                    margin={{ top: 6, right: 4, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid vertical={false} stroke={colors.grid} />
                    <XAxis
                      dataKey="label"
                      height={1}
                      tick={false}
                      tickLine={false}
                      axisLine={{ stroke: colors.baseline }}
                    />
                    <YAxis
                      width={Y_AXIS_WIDTH}
                      tick={TICK}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={<MonthlyStoryTooltip />}
                      cursor={{ fill: colors.wash, stroke: 'none' }}
                    />
                    <Bar
                      dataKey="created"
                      name="Created"
                      fill={seriesColor(colors, 0)}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={24}
                    />
                    <Bar
                      dataKey="completed"
                      name="Completed"
                      fill={seriesColor(colors, 1)}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={24}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div
                className="h-28"
                role="img"
                aria-label="Running balance of completed minus created tasks"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={storyData}
                    syncId={SYNC_ID}
                    margin={{ top: 6, right: 4, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid vertical={false} stroke={colors.grid} />
                    <XAxis
                      dataKey="label"
                      scale="band"
                      tick={TICK}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                    />
                    <YAxis
                      width={Y_AXIS_WIDTH}
                      tick={TICK}
                      tickCount={3}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={() => null}
                      cursor={{ stroke: colors.baseline }}
                    />
                    <ReferenceLine y={0} stroke={colors.baseline} />
                    <Line
                      type="linear"
                      dataKey="runningBalance"
                      name="Running balance"
                      stroke={balanceColor}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{
                        r: 4,
                        fill: balanceColor,
                        stroke: colors.surface,
                        strokeWidth: 2,
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <details className="dd-chart__data">
              <summary>View as table</summary>
              <div className="dd-chart__data-scroll">
                <table>
                  <caption className="dd-visually-hidden">
                    Tasks created and completed per month, with the running
                    balance
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Month</th>
                      <th scope="col">Created</th>
                      <th scope="col">Completed</th>
                      <th scope="col">Net</th>
                      <th scope="col">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storyData.map((month) => (
                      <tr key={month.month}>
                        <th scope="row">{month.label}</th>
                        <td>{month.created}</td>
                        <td>{month.completed}</td>
                        <td>{formatSigned(month.delta)}</td>
                        <td>{formatSigned(month.runningBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </figure>
    </section>
  )
}
