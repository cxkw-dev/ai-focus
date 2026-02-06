'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { ChartTooltip } from './chart-tooltip'
import type { MonthlyData } from '@/types/stats'

interface MonthlyChartProps {
  data: MonthlyData[]
  colors: Record<string, string>
}

export function MonthlyChart({ data, colors }: MonthlyChartProps) {
  if (!colors.primary) return null

  return (
    <div
      className="rounded-xl border border-t-[3px] p-5"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)', borderTopColor: 'var(--primary)' }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Monthly Activity
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.statusDone} stopOpacity={0.3} />
              <stop offset="95%" stopColor={colors.statusDone} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: colors.textMuted, fontSize: 12 }}
            axisLine={{ stroke: colors.border }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: colors.textMuted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<ChartTooltip colors={colors} />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: colors.textMuted, paddingTop: 8 }}
          />
          <Area
            type="monotone"
            dataKey="created"
            name="Created"
            stroke={colors.primary}
            fill="url(#gradCreated)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="completed"
            name="Completed"
            stroke={colors.statusDone}
            fill="url(#gradCompleted)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
