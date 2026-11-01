'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { isChartColorKey, type ChartColors } from '@/hooks/use-chart-colors'
import { PRIORITY_COLOR_KEYS, PRIORITY_LABELS } from '@/lib/priority'
import type { PriorityData } from '@/types/stats'
import type { Priority } from '@/types/todo'
import { ChartTooltip } from './chart-tooltip'

interface PriorityChartProps {
  data: PriorityData[]
  colors: ChartColors
}

const VALUE_TICK = { className: 'dd-chart__tick' }
const NAME_TICK = { className: 'fill-muted text-xs' }

/** Tasks per priority, each bar in its priority colour. */
export function PriorityChart({ data, colors }: PriorityChartProps) {
  const chartData = data.map((d) => {
    const key = PRIORITY_COLOR_KEYS[d.priority as Priority]
    return {
      name: PRIORITY_LABELS[d.priority as Priority] || d.priority,
      count: d.count,
      fill: key && isChartColorKey(key) ? colors[key] : colors.textMuted,
    }
  })

  return (
    <figure className="dd-chart">
      <figcaption className="dd-chart__head">
        <div>
          <p className="dd-chart__title">Priority breakdown</p>
          <p className="dd-chart__sub">Tasks per priority</p>
        </div>
      </figcaption>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid horizontal={false} stroke={colors.grid} />
          <XAxis
            type="number"
            tick={VALUE_TICK}
            axisLine={{ stroke: colors.baseline }}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={NAME_TICK}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: colors.wash, stroke: 'none' }}
          />
          <Bar
            dataKey="count"
            name="Tasks"
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  )
}
