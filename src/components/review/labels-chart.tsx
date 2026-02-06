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
import type { LabelData } from '@/types/stats'

interface LabelsChartProps {
  data: LabelData[]
  colors: Record<string, string>
}

export function LabelsChart({ data, colors }: LabelsChartProps) {
  if (!colors.primary) return null

  if (data.length === 0) {
    return (
      <div
        className="rounded-xl border p-5 flex items-center justify-center"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)', minHeight: 200 }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No label data</p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl border p-5 relative overflow-hidden"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)' }}
    >
      <div className="absolute top-0 left-3 right-3 h-[3px] rounded-b-full" style={{ backgroundColor: 'var(--status-done)' }} />
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Top Labels
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40 + 40)}>
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
          <Bar dataKey="count" name="Tasks" radius={[0, 4, 4, 0]} barSize={18}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
