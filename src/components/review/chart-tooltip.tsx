'use client'

import type * as React from 'react'
import { cn, cssVars } from '@/lib/utils'

export interface ChartTipRow {
  label: React.ReactNode
  value: React.ReactNode
  /** A `.dd-chart-sN` / `.dd-chart-other` class for the row's key… */
  series?: string
  /** …or a resolved colour for it. */
  color?: string
  /** A total row: hairline above, no key. */
  total?: boolean
}

/**
 * The dawn & dusk chart tooltip (`.dd-chart__tip`): float background and shadow, a mono title, one row per series
 * with its key, values right-aligned in mono. Recharts positions it; `.is-static` keeps it in Recharts' wrapper.
 */
export function ChartTip({
  title,
  rows,
}: {
  title?: React.ReactNode
  rows: ChartTipRow[]
}) {
  return (
    <div className="dd-chart__tip is-static">
      {title != null && <p className="dd-chart__tip-title">{title}</p>}
      {rows.map((row, index) => (
        <p
          key={index}
          className={cn(
            'dd-chart__tip-row',
            row.series,
            row.total && 'dd-chart__tip-row--total',
          )}
          style={row.color ? cssVars({ '--dd-series': row.color }) : undefined}
        >
          {row.label}
          <b>{row.value}</b>
        </p>
      ))}
    </div>
  )
}

interface TooltipEntry {
  name?: string | number
  value?: string | number
  color?: string
  payload?: { fill?: string }
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string | number
}

/** Recharts `content` for simple bar and pie charts: one row per payload entry, keyed by the mark's fill. */
export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <ChartTip
      title={label}
      rows={payload.map((entry) => ({
        label: entry.name,
        value: entry.value,
        color: entry.payload?.fill ?? entry.color,
      }))}
    />
  )
}
