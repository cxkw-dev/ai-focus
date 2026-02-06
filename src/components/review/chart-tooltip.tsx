'use client'

interface Payload {
  name?: string
  value?: number
  color?: string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: Payload[]
  label?: string
  colors: Record<string, string>
}

export function ChartTooltip({ active, payload, label, colors }: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-lg"
      style={{
        backgroundColor: colors.surface2,
        borderColor: colors.border,
        color: colors.textPrimary,
      }}
    >
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span style={{ color: colors.textMuted }}>{entry.name}:</span>
          <span className="font-medium">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}
