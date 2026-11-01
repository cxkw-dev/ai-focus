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
import { Icon } from '@/components/ui/icon'
import { seriesColor, type ChartColors } from '@/hooks/use-chart-colors'
import type { LabelData } from '@/types/stats'
import { ChartTooltip } from './chart-tooltip'

interface LabelsChartProps {
  data: LabelData[]
  colors: ChartColors
}

const VALUE_TICK = { className: 'dd-chart__tick' }
const NAME_TICK = { className: 'fill-muted text-xs' }

/** Tasks per label, ranked; labels take the chart series colours in order. */
export function LabelsChart({ data, colors }: LabelsChartProps) {
  const chartData = data.map((entry, index) => ({
    name: entry.name,
    count: entry.count,
    fill: seriesColor(colors, index),
  }))

  return (
    <figure className="dd-chart [--dd-chart-height:200px]">
      <figcaption className="dd-chart__head">
        <div>
          <p className="dd-chart__title">Top labels</p>
          <p className="dd-chart__sub">Tasks per label</p>
        </div>
      </figcaption>
      {chartData.length === 0 ? (
        <div className="dd-chart__frame">
          <div className="dd-chart__plot is-empty">
            <div className="dd-chart__empty">
              <Icon name="tag" />
              <b>No label data</b>
              <span>Label your tasks to see where the work went.</span>
            </div>
          </div>
        </div>
      ) : (
        <ResponsiveContainer
          width="100%"
          height={Math.max(200, chartData.length * 40 + 40)}
        >
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
              width={100}
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
      )}
    </figure>
  )
}
