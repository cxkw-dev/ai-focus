'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Icon } from '@/components/ui/icon'
import { isChartColorKey, type ChartColors } from '@/hooks/use-chart-colors'
import { STATUS_COLOR_KEYS, STATUS_LABELS } from '@/lib/status'
import { cssVars } from '@/lib/utils'
import type { StatusData } from '@/types/stats'
import type { Status } from '@/types/todo'
import { ChartTooltip } from './chart-tooltip'

interface StatusChartProps {
  data: StatusData[]
  colors: ChartColors
}

/** Tasks by status as a donut with a stacked legend of counts and shares; statuses keep their status colours. */
export function StatusChart({ data, colors }: StatusChartProps) {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => {
      const key = STATUS_COLOR_KEYS[d.status as Status]
      return {
        name: STATUS_LABELS[d.status as Status] || d.status,
        value: d.count,
        fill: key && isChartColorKey(key) ? colors[key] : colors.textMuted,
      }
    })
  const total = chartData.reduce((sum, entry) => sum + entry.value, 0)

  return (
    <figure className="dd-chart">
      <figcaption className="dd-chart__head">
        <div>
          <p className="dd-chart__title">Status distribution</p>
          <p className="dd-chart__sub">Tasks by current status</p>
        </div>
      </figcaption>
      {chartData.length === 0 ? (
        <div className="dd-chart__frame">
          <div className="dd-chart__plot is-empty">
            <div className="dd-chart__empty">
              <Icon name="chart" />
              <b>No status data</b>
              <span>Tasks you create this year show up here by status.</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="dd-chart__pie">
          <div
            className="dd-chart__donut"
            role="img"
            aria-label={`Tasks by status, ${total} in all`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  innerRadius="68%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={-270}
                  stroke={colors.surface}
                  strokeWidth={2}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="dd-chart__donut-center" aria-hidden="true">
              <b>{total}</b>
              <span>tasks</span>
            </div>
          </div>
          <ul className="dd-chart__legend dd-chart__legend--stack">
            {chartData.map((entry) => (
              <li
                key={entry.name}
                className="dd-chart__key"
                style={cssVars({ '--dd-series': entry.fill })}
              >
                {entry.name}
                <span className="dd-chart__key-value">{entry.value}</span>
                <span className="dd-chart__key-share">
                  {Math.round((entry.value / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </figure>
  )
}
