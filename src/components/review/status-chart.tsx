'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartTooltip } from './chart-tooltip'
import { STATUS_COLOR_KEYS, STATUS_LABELS } from '@/lib/status'
import type { StatusData } from '@/types/stats'
import type { Status } from '@/types/todo'

interface StatusChartProps {
  data: StatusData[]
  colors: Record<string, string>
}

export function StatusChart({ data, colors }: StatusChartProps) {
  if (!colors.primary) return null

  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: STATUS_LABELS[d.status as Status] || d.status,
      value: d.count,
      fill: colors[STATUS_COLOR_KEYS[d.status as Status]] || colors.textMuted,
    }))

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border p-5"
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border-color)',
          minHeight: 300,
        }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          No status data
        </p>
      </div>
    )
  }

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
          style={{ backgroundColor: 'var(--accent)' }}
        />
        <h3
          className="text-sm font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Status Distribution
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip colors={colors} />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: colors.textMuted }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
