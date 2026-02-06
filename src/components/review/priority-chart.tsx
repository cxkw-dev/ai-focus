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
import type { PriorityData } from '@/types/stats'

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
}

const PRIORITY_COLOR_KEYS: Record<string, string> = {
  LOW: 'priorityLow',
  MEDIUM: 'priorityMedium',
  HIGH: 'priorityHigh',
  URGENT: 'priorityUrgent',
}

interface PriorityChartProps {
  data: PriorityData[]
  colors: Record<string, string>
}

export function PriorityChart({ data, colors }: PriorityChartProps) {
  if (!colors.primary) return null

  const chartData = data.map(d => ({
    name: PRIORITY_LABELS[d.priority] || d.priority,
    count: d.count,
    fill: colors[PRIORITY_COLOR_KEYS[d.priority]] || colors.textMuted,
  }))

  return (
    <div
      className="rounded-xl border p-5 relative overflow-hidden"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)' }}
    >
      <div className="absolute top-0 left-3 right-3 h-[3px] rounded-b-full" style={{ backgroundColor: 'var(--priority-high)' }} />
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Priority Breakdown
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
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
            width={60}
          />
          <Tooltip content={<ChartTooltip colors={colors} />} />
          <Bar dataKey="count" name="Tasks" radius={[0, 4, 4, 0]} barSize={20}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
