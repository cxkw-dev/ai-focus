'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ChartTooltip } from './chart-tooltip'
import { getCategoryLabel, getCategoryCssVar } from './category-badge'
import type { AccomplishmentCategoryData } from '@/types/stats'
import type { AccomplishmentCategory } from '@/types/accomplishment'

interface CategoryChartProps {
  data: AccomplishmentCategoryData[]
  colors: Record<string, string>
}

const CATEGORY_COLOR_MAP: Record<string, string> = {
  DELIVERY: 'categoryDelivery',
  HIRING: 'categoryHiring',
  MENTORING: 'categoryMentoring',
  COLLABORATION: 'categoryCollaboration',
  GROWTH: 'categoryGrowth',
}

export function CategoryChart({ data, colors }: CategoryChartProps) {
  if (!colors.primary) return null

  const nonZero = data.filter((d) => d.count > 0)

  if (nonZero.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border p-5"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border-color)',
          minHeight: 200,
        }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No category data
        </p>
      </div>
    )
  }

  const chartData = nonZero.map((d) => ({
    name: getCategoryLabel(d.category as AccomplishmentCategory),
    count: d.count,
    category: d.category,
  }))

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="mb-4 flex items-center gap-2">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: `var(${getCategoryCssVar('DELIVERY')})` }}
        />
        <h3
          className="text-sm font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          By Category
        </h3>
      </div>
      <ResponsiveContainer
        width="100%"
        height={Math.max(200, chartData.length * 40 + 40)}
      >
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={colors.border}
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fill: colors.textMuted, fontSize: 12 }}
            axisLine={{ stroke: colors.border }}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: colors.textMuted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip content={<ChartTooltip colors={colors} />} />
          <Bar
            dataKey="count"
            name="Accomplishments"
            radius={[0, 4, 4, 0]}
            barSize={18}
          >
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  colors[CATEGORY_COLOR_MAP[entry.category]] || colors.primary
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
