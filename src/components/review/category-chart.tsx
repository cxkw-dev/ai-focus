'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'
import { ChartTooltip } from './chart-tooltip'
import type { CategoryData } from '@/types/stats'

interface CategoryChartProps {
  data: CategoryData[]
  colors: Record<string, string>
}

export function CategoryChart({ data, colors }: CategoryChartProps) {
  if (!colors.primary) return null

  if (data.length === 0) {
    return (
      <div
        className="rounded-xl border p-5 flex items-center justify-center"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)', minHeight: 200 }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No category data</p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl border border-t-[3px] p-5"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)', borderTopColor: 'var(--status-in-progress)' }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Category Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 50 + 60)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} horizontal={false} />
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
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: colors.textMuted, paddingTop: 8 }}
          />
          <Bar dataKey="count" name="Total" radius={[0, 4, 4, 0]} barSize={16}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.5} />
            ))}
          </Bar>
          <Bar dataKey="completedCount" name="Completed" radius={[0, 4, 4, 0]} barSize={16}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
