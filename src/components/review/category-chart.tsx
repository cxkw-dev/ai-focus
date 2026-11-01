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
import { setColor, type ChartColors } from '@/hooks/use-chart-colors'
import type { AccomplishmentCategoryData } from '@/types/stats'
import type { AccomplishmentCategory } from '@/types/accomplishment'
import { ChartTooltip } from './chart-tooltip'
import { getCategoryLabel, getCategorySet } from './category-badge'

interface CategoryChartProps {
  data: AccomplishmentCategoryData[]
  colors: ChartColors
}

const VALUE_TICK = { className: 'dd-chart__tick' }
const NAME_TICK = { className: 'fill-muted text-xs' }

/** Accomplishments per category; each bar takes its category chip's set colour. */
export function CategoryChart({ data, colors }: CategoryChartProps) {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => {
      const category = d.category as AccomplishmentCategory
      return {
        name: getCategoryLabel(category),
        count: d.count,
        fill: setColor(colors, getCategorySet(category)),
      }
    })

  return (
    <figure className="dd-chart [--dd-chart-height:200px]">
      <figcaption className="dd-chart__head">
        <div>
          <p className="dd-chart__title">By category</p>
          <p className="dd-chart__sub">Accomplishments this year</p>
        </div>
      </figcaption>
      {chartData.length === 0 ? (
        <div className="dd-chart__frame">
          <div className="dd-chart__plot is-empty">
            <div className="dd-chart__empty">
              <Icon name="chart" />
              <b>No category data</b>
              <span>Accomplishments you log show up here by category.</span>
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
              name="Accomplishments"
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
